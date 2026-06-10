import { fetchGamingNews, GamingArticle } from "./extractor.ts";
import { generateSocialPosts } from "./ai_processor.ts";
import { isNewsAlreadyProcessed, markNewsAsProcessed, getSupabaseClient } from "./database.ts";
import { publishToX, publishToInstagram, publishToTelegram } from "./publisher.ts";

async function scrapeUrlMetadata(url: string): Promise<{ content: string; imageUrl?: string }> {
  let content = "";
  let imageUrl: string | undefined = undefined;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const html = await res.text();
      const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
      if (ogDescMatch) content = ogDescMatch[1];
      
      if (!content) {
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        if (descMatch) content = descMatch[1];
      }

      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (ogImageMatch) imageUrl = ogImageMatch[1];
    }
  } catch (e) {
    console.error("Error scraping URL metadata:", e.message);
  }
  return { content, imageUrl };
}

async function searchYouTubeTrailer(query: string): Promise<string> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return "No se encontró trailer.";
    const html = await res.text();
    
    // Buscar videoId de ytInitialData
    const videoIdMatch = html.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
    }
    
    // Fallback: buscar formato /watch?v=...
    const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/watch?v=${watchMatch[1]}`;
    }
    
    return "No se encontró trailer.";
  } catch (e) {
    console.error("Error buscando trailer en YouTube:", e.message);
    return "No se encontró trailer.";
  }
}

Deno.serve(async (req) => {
  try {
    // Intentar parsear el cuerpo JSON si es una petición POST
    let body: any = null;
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch (e) {
        console.log("No se pudo parsear el cuerpo como JSON o no contiene datos:", e.message);
      }
    }

    // FLUJO 1: Procesamiento Manual de Noticia
    if (body && body.url) {
      const manualTitle = body.title || "Noticia Ingestada Manualmente";
      const manualUrl = body.url;
      const isForce = body.force === true;

      console.log(`📥 Ingesta manual solicitada: "${manualTitle}" (${manualUrl}) [force=${isForce}]`);

      // Comprobar duplicado a menos que sea forzado
      if (!isForce) {
        const isDuplicated = await isNewsAlreadyProcessed(manualUrl);
        if (isDuplicated) {
          console.log(`⏭️ Noticia manual ya procesada anteriormente: ${manualUrl}`);
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Esta noticia ya ha sido procesada previamente." 
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Scraping rápido
      console.log(`🔍 Extrayendo metadatos de la URL...`);
      const { content: scrapedContent, imageUrl: scrapedImageUrl } = await scrapeUrlMetadata(manualUrl);

      const article: GamingArticle = {
        title: manualTitle,
        link: manualUrl,
        content: scrapedContent || `Noticia manual sobre ${manualTitle}.`,
        pubDate: new Date().toISOString(),
        platform: "Manual",
        imageUrl: scrapedImageUrl
      };

      console.log(`🤖 Generando posts de redes sociales con IA...`);
      const generatedPosts = await generateSocialPosts(article);
      
      if (!generatedPosts) {
        throw new Error("No se pudo generar el contenido con IA.");
      }

      // Buscar trailer en YouTube usando la función nativa optimizada
      let youtubeUrl = "No se encontró trailer.";
      if (generatedPosts.youtube_search_query) {
        console.log(`🔍 Buscando trailer oficial en YouTube para: "${generatedPosts.youtube_search_query}"...`);
        youtubeUrl = await searchYouTubeTrailer(generatedPosts.youtube_search_query);
      }

      // Enviar borrador a Telegram
      const telegramMessage = `
🎮 *Nueva Noticia Gaming Procesada (Manual)* 🎮

*Título:* ${generatedPosts.spanish_title}
*Fuente:* ${article.link}
*Trailer:* ${youtubeUrl}

🎬 *Guion para TikTok:*
${generatedPosts.tiktok_script}

*Borrador para X (Twitter):*
${generatedPosts.tweet}

*Borrador para Instagram:*
${generatedPosts.instagram_caption}
      `.trim();

      await publishToTelegram(telegramMessage);

      // Generar Plan de Video (IA) si hay guion
      let productionPlan = null;
      if (generatedPosts.tiktok_script) {
        try {
          console.log(`🎬 Generando Plan de Producción de Video para: ${generatedPosts.spanish_title}`);
          const supabase = getSupabaseClient();
          const { data: planData, error: planError } = await supabase.functions.invoke("generate-production-plan", {
            body: { tiktok_script: generatedPosts.tiktok_script }
          });
          if (planError) {
            console.error("❌ Error al invocar generate-production-plan:", planError);
          } else {
            productionPlan = planData;
            console.log("✅ Plan de Producción de Video generado con éxito.");
          }
        } catch (err) {
          console.error("❌ Error grave al invocar generate-production-plan:", err.message);
        }
      }

      // Guardar en Base de Datos
      const saved = await markNewsAsProcessed(
        { ...article, title: generatedPosts.spanish_title },
        false, // xSuccess
        false, // igSuccess
        generatedPosts.web_article,
        youtubeUrl,
        article.imageUrl,
        generatedPosts.tiktok_script,
        productionPlan,
        generatedPosts.tweet,
        generatedPosts.instagram_caption
      );

      if (!saved) {
        throw new Error("No se pudo registrar la noticia en la base de datos.");
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Noticia procesada y enviada a Telegram con éxito.",
        data: {
          title: generatedPosts.spanish_title,
          youtube_url: youtubeUrl,
          image_url: article.imageUrl
        }
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // FLUJO 2: Ingesta Automática de RSS (Por defecto o GET)
    console.log("📡 Iniciando procesamiento automático por RSS...");
    const articles = await fetchGamingNews(2); // Máximo 2 noticias por feed por ejecución
    const processedArticles = [];

    for (const article of articles) {
      // Comprobar si ya fue publicada en la Base de Datos
      const isDuplicated = await isNewsAlreadyProcessed(article.link);
      
      if (isDuplicated) {
        console.log(`⏭️ Noticia ya procesada anteriormente: ${article.title}`);
        continue;
      }

      // Si ya hemos procesado 3 noticias nuevas en esta ejecución, paramos para no saturar.
      if (processedArticles.length >= 3) {
        console.log("🛑 Límite de 3 noticias nuevas alcanzado en esta ejecución. Se detiene el proceso.");
        break;
      }

      console.log(`🤖 Procesando nueva noticia con IA: ${article.title}`);
      
      // Generar contenido con Gemini
      const generatedPosts = await generateSocialPosts(article);
      
      if (!generatedPosts) {
        console.error(`❌ Falló la generación de IA para: ${article.title}`);
        continue;
      }

      const xSuccess = false;
      const igSuccess = false;

      // Buscar trailer en YouTube usando la función nativa optimizada
      let youtubeUrl = "No se encontró trailer.";
      if (generatedPosts.youtube_search_query) {
        console.log(`🔍 Buscando trailer oficial en YouTube para: "${generatedPosts.youtube_search_query}"...`);
        youtubeUrl = await searchYouTubeTrailer(generatedPosts.youtube_search_query);
      }

      // Enviar a Telegram para revisión manual
      const telegramMessage = `
🎮 *Nueva Noticia Gaming Procesada* 🎮

*Título:* ${generatedPosts.spanish_title}
*Fuente:* ${article.link}
*Trailer:* ${youtubeUrl}

🎬 *Guion para TikTok:*
${generatedPosts.tiktok_script}

*Borrador para X (Twitter):*
${generatedPosts.tweet}

*Borrador para Instagram:*
${generatedPosts.instagram_caption}
      `.trim();

      await publishToTelegram(telegramMessage);

      // Generar Plan de Video (IA) si hay guion
      let productionPlan = null;
      if (generatedPosts.tiktok_script) {
        try {
          console.log(`🎬 Generando Plan de Producción de Video para: ${generatedPosts.spanish_title}`);
          const supabase = getSupabaseClient();
          const { data: planData, error: planError } = await supabase.functions.invoke("generate-production-plan", {
            body: { tiktok_script: generatedPosts.tiktok_script }
          });
          if (planError) {
            console.error("❌ Error al invocar generate-production-plan:", planError);
          } else {
            productionPlan = planData;
            console.log("✅ Plan de Producción de Video generado con éxito.");
          }
        } catch (err) {
          console.error("❌ Error grave al invocar generate-production-plan:", err.message);
        }
      }

      // Guardar en Base de Datos para evitar duplicados en el futuro
      await markNewsAsProcessed(
        { ...article, title: generatedPosts.spanish_title },
        xSuccess,
        igSuccess,
        generatedPosts.web_article,
        youtubeUrl,
        article.imageUrl,
        generatedPosts.tiktok_script,
        productionPlan,
        generatedPosts.tweet,
        generatedPosts.instagram_caption
      );
      
      processedArticles.push({
        title: generatedPosts.spanish_title,
        x_status: xSuccess ? "ok" : "fail",
        ig_status: igSuccess ? "ok" : "fail"
      });
    }

    return new Response(JSON.stringify({
      message: "Pipeline de noticias RSS ejecutado correctamente.",
      processed_count: processedArticles.length,
      details: processedArticles
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error grave en la ejecución del pipeline:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
