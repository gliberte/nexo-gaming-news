const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ytSearch = require('yt-search');
const path = require('path');

// Cargar variables
require('dotenv').config({ path: path.resolve(__dirname, '../supabase/functions/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error("❌ Error: Faltan credenciales de Supabase o Gemini en el entorno.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenerativeAI(geminiApiKey);

const newsId = process.argv[2];

if (!newsId) {
  console.log("📖 Uso: node process_single_news.js <news_id>");
  process.exit(1);
}

async function run() {
  console.log(`🤖 Iniciando procesamiento de IA para noticia ID: ${newsId}...`);

  // 1. Obtener la noticia original
  const { data: newsItem, error: dbError } = await supabase
    .from('published_news')
    .select('*')
    .eq('id', newsId)
    .single();

  if (dbError || !newsItem) {
    console.error("❌ Error al buscar la noticia:", dbError?.message || "Noticia no encontrada.");
    process.exit(1);
  }

  console.log(`- Noticia encontrada: "${newsItem.title}"`);
  console.log(`- Link original: ${newsItem.source_url}`);

  // 2. Definir el prompt para Gemini
  const prompt = `
Actúa como un Community Manager experto en videojuegos para el canal "NexoGamingNews".
Tu tarea es tomar una noticia de videojuegos y generar contenido para publicarla en la web, en X (Twitter), en Instagram y en TikTok.

NOTICIA ORIGINAL:
Título: ${newsItem.title}
Plataforma: Switch/Nintendo
Contenido: The Legend of Zelda: Ocarina of Time Remake ha sido revelado oficialmente para la consola Nintendo Switch 2. El legendario juego de Nintendo 64 volverá a la vida con un apartado visual recreado desde cero en Unreal Engine 5 adaptado al hardware de nueva generación de Nintendo, con fecha estimada para finales de 2026.
Enlace: ${newsItem.source_url}

INSTRUCCIONES PARA EL TÍTULO:
- Traduce el título de la noticia al español. Mantén el sentido original y un tono atractivo.

INSTRUCCIONES PARA X (TWITTER):
- Escribe un tweet conciso (máximo 280 caracteres, incluyendo el enlace).
- El tono debe ser rápido, llamativo y gamer.
- Usa 2 o 3 emojis.
- Incluye 2 o 3 hashtags relevantes (#GamingNews, #Zelda, #NintendoSwitch2).
- Debe incluir el enlace original al final.

INSTRUCCIONES PARA INSTAGRAM:
- Escribe un copy (pie de foto) más detallado y envolvente.
- Haz una pregunta a la comunidad al final para fomentar la interacción ("¿Qué opinan de esto?", "¿Lo van a jugar?").
- Separa el texto en párrafos cortos y usa emojis.
- Incluye hashtags relevantes al final.

INSTRUCCIONES PARA BÚSQUEDA DE VIDEO:
- Identifica de qué videojuego principal trata la noticia.
- Genera un término de búsqueda muy preciso en inglés para buscar el trailer oficial de ese juego en YouTube (por ejemplo: "The Legend of Zelda Ocarina of Time Remake official trailer").

INSTRUCCIONES PARA ARTÍCULO WEB:
- Redacta un artículo breve (2-3 párrafos) en formato Markdown adaptado para una audiencia de gamers hardcore.
- Usa un tono editorial, "Cyber-Industrial", con un título H2.

INSTRUCCIONES PARA TIKTOK (GUION):
- Escribe un guion dinámico para ser leído en un video vertical de entre 60 y 120 segundos.
- Empieza siempre con un "Gancho" agresivo en los primeros 3 segundos.
- Desarrolla la noticia con lenguaje natural, entusiasta y veloz.
- Termina con un "Call to Action" (Ej: "Dime en los comentarios qué opinas" o "Sígueme para más noticias").
- Incluye indicaciones visuales entre corchetes (Ej: [Mostrar imagen del juego]).

DEVUELVE TU RESPUESTA EXACTAMENTE EN ESTE FORMATO JSON, SIN NADA MÁS NI BLOQUES DE CÓDIGO MARKDOWN:
{
  "spanish_title": "Aquí va el título traducido al español...",
  "tweet": "Aquí va el tweet...",
  "instagram_caption": "Aquí va el copy de instagram...",
  "youtube_search_query": "Término de búsqueda del trailer...",
  "web_article": "Aquí va el artículo en formato Markdown...",
  "tiktok_script": "Aquí va el guion para TikTok..."
}
`;

  try {
    console.log("🧠 Generando contenidos con Gemini...");
    const model = ai.getGenerativeModel({ model: "gemini-3.5-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const textResponse = response.response.text();
    if (!textResponse) {
      throw new Error("Respuesta de Gemini vacía.");
    }

    // Extraer el objeto JSON usando una expresión regular robusta
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No se encontró una estructura JSON válida en la respuesta de la IA.");
    }

    const cleanText = jsonMatch[0].trim();
    const generated = JSON.parse(cleanText);

    console.log("✅ Contenido generado con éxito.");
    console.log(`   - Título en Español: "${generated.spanish_title}"`);

    // 3. Buscar trailer en YouTube
    let youtubeUrl = "No se encontró trailer.";
    if (generated.youtube_search_query) {
      try {
        console.log(`🔍 Buscando trailer en YouTube para: "${generated.youtube_search_query}"...`);
        const ytResult = await ytSearch(generated.youtube_search_query);
        const videos = ytResult.videos.slice(0, 1);
        if (videos.length > 0) {
          youtubeUrl = videos[0].url;
          console.log(`✅ Trailer encontrado: ${youtubeUrl}`);
        }
      } catch (ytError) {
        console.error("⚠️ Error buscando en YouTube:", ytError.message);
      }
    }

    // 4. Actualizar noticia en Supabase
    console.log("💾 Guardando en base de datos...");
    const { error: updateError } = await supabase
      .from('published_news')
      .update({
        title: generated.spanish_title,
        web_article: generated.web_article,
        youtube_url: youtubeUrl,
        // Almacenamos el guion de TikTok en la columna correspondiente
        tiktok_script: generated.tiktok_script
      })
      .eq('id', newsId);

    if (updateError) {
      throw updateError;
    }

    console.log(`🎉 Noticia procesada con éxito. Visita el editor web y verás habilitado el botón para generar el plan.`);
  } catch (err) {
    console.error("❌ Error al procesar noticia con IA:", err.message);
    process.exit(1);
  }
}

run();
