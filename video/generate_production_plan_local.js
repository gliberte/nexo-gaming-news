const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
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
  console.log("📖 Uso: node generate_production_plan_local.js <news_id>");
  process.exit(1);
}

async function run() {
  console.log(`🎬 Generando Plan de Producción de Video para noticia ID: ${newsId}...`);

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

  if (!newsItem.tiktok_script) {
    console.error("❌ Error: La noticia no tiene un guion de TikTok generado para desglosar.");
    process.exit(1);
  }

  // 2. Definir el prompt para desglosar el guion en escenas
  const prompt = `
Actúa como un director de producción audiovisual para el canal "NexoGamingNews".
Tu tarea es tomar un guion de TikTok/Reels y dividirlo en escenas detalladas para la generación del video de la noticia.

GUION DE TIKTOK:
${newsItem.tiktok_script}

INSTRUCCIONES PARA GENERAR EL PLAN DE PRODUCCIÓN:
- Divide el guion en exactamente entre 5 y 7 escenas secuenciales.
- Para cada escena, define:
  1. "scene_id": número secuencial comenzando en 1.
  2. "start_time_seconds" y "end_time_seconds": marcas de tiempo estimadas (la primera escena empieza en 0, y cada escena debe durar entre 5 y 10 segundos).
  3. "narrative_text": el texto del locutor que corresponde a esa escena (extraído del guion de TikTok).
  4. "visual_search_query": una palabra clave o término preciso en inglés para buscar clips de gameplay de ese juego en YouTube (ej: "Zelda Ocarina of Time Unreal Engine 5 gameplay", "Nintendo Switch 2 concept reveal").
  5. "hook_settings": Ajustes visuales de subtítulos dinámicos llamativos (solo para la primera escena - escena 1). Define:
     - "screen_text_overlay": un texto muy corto y llamativo en mayúsculas (ej: "¡OCARINA REMAKE EN SWITCH 2!").
     - "text_style": elige entre "glitch", "neon_cyan", "warning_red" o "bright_yellow".
     - "dynamic_subtitles_placement": elige entre "top_middle", "center_middle" o "bottom_middle".

DEVUELVE TU RESPUESTA EXACTAMENTE EN ESTE FORMATO JSON, SIN NADA MÁS NI BLOQUES DE CÓDIGO MARKDOWN:
{
  "production_plan": {
    "soundtrack": {
      "name": "synthwave_cyberpunk",
      "volume_level": 0.12
    },
    "scenes": [
      {
        "scene_id": 1,
        "start_time_seconds": 0,
        "end_time_seconds": 6,
        "narrative_text": "Texto que leerá el locutor en esta escena...",
        "visual_search_query": "Término en inglés para buscar en youtube...",
        "hook_settings": {
          "screen_text_overlay": "TEXTO NEON INICIAL",
          "text_style": "neon_cyan",
          "dynamic_subtitles_placement": "center_middle"
        }
      },
      ...
    ]
  }
}
`;

  try {
    console.log("🧠 Desglosando guion con Gemini...");
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

    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No se encontró estructura JSON válida.");
    }

    const cleanText = jsonMatch[0].trim();
    const generated = JSON.parse(cleanText);

    console.log("✅ Plan de producción generado.");
    
    // 3. Guardar en base de datos
    console.log("💾 Guardando plan de producción en Supabase...");
    const { error: updateError } = await supabase
      .from('published_news')
      .update({
        production_plan: generated.production_plan
      })
      .eq('id', newsId);

    if (updateError) {
      throw updateError;
    }

    console.log(`🎉 ¡Plan de producción guardado con éxito! Ya puedes renderizar el video.`);
  } catch (err) {
    console.error("❌ Error generando plan localmente:", err.message);
    process.exit(1);
  }
}

run();
