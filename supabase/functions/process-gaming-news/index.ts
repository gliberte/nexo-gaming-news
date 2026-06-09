import { fetchGamingNews } from "./extractor.ts";
import { generateSocialPosts } from "./ai_processor.ts";
import { isNewsAlreadyProcessed, markNewsAsProcessed, getSupabaseClient } from "./database.ts";
import { publishToX, publishToInstagram, publishToTelegram } from "./publisher.ts";
import ytSearch from "npm:yt-search";

Deno.serve(async (req) => {
  try {
    // 1. Extraer noticias de los feeds RSS
    const articles = await fetchGamingNews(2); // Máximo 2 noticias por feed por ejecución
    const processedArticles = [];

    for (const article of articles) {
      // 2. Comprobar si ya fue publicada en la Base de Datos
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
      
      // 3. Generar contenido con Gemini
      const generatedPosts = await generateSocialPosts(article);
      
      if (!generatedPosts) {
        console.error(`❌ Falló la generación de IA para: ${article.title}`);
        continue;
      }

      // 4. Publicar en redes sociales (Deshabilitado)
      // Se delega la publicación a un proceso manual vía Telegram para ahorrar costos de API.
      const xSuccess = false;
      const igSuccess = false;

      // Buscar trailer en YouTube
      let youtubeUrl = "No se encontró trailer.";
      if (generatedPosts.youtube_search_query) {
        try {
          const ytResult = await ytSearch(generatedPosts.youtube_search_query);
          const videos = ytResult.videos.slice(0, 1);
          if (videos.length > 0) {
            youtubeUrl = videos[0].url;
          }
        } catch (ytError) {
          console.error("❌ Error buscando en YouTube:", ytError.message);
        }
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

      // 5. Guardar en Base de Datos para evitar duplicados en el futuro
      await markNewsAsProcessed(
        { ...article, title: generatedPosts.spanish_title },
        xSuccess,
        igSuccess,
        generatedPosts.web_article,
        youtubeUrl,
        article.imageUrl,
        generatedPosts.tiktok_script,
        productionPlan
      );
      
      processedArticles.push({
        title: generatedPosts.spanish_title,
        x_status: xSuccess ? "ok" : "fail",
        ig_status: igSuccess ? "ok" : "fail"
      });
    }

    return new Response(JSON.stringify({
      message: "Pipeline de noticias ejecutado correctamente.",
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
