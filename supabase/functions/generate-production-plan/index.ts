import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Manejo de preflights CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY no está configurada en las variables de entorno." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tiktok_script } = await req.json();
    if (!tiktok_script) {
      return new Response(
        JSON.stringify({ error: "El campo 'tiktok_script' es requerido en el cuerpo de la solicitud." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenerativeAI(apiKey);
    let model = ai.getGenerativeModel({ model: "gemini-3.5-flash" });

    const systemInstructions = `
Contexto: Eres un sistema de producción audiovisual automatizado. Tu objetivo es convertir un Guion de TikTok (ya generado) en un Plan de Producción Audiovisual para Instagram, TikTok, YouTube Shorts y la Web.

Tu tarea: Analiza el guion de entrada y genera una estructura JSON que contenga las instrucciones técnicas para los módulos de ejecución.

Debes ceñirte exactamente a las siguientes especificaciones para el JSON de salida:
{
  "production_plan": {
    "voice_over": {
      "provider": "elevenlabs",
      "voice_settings": {
        "stability": 0.5,
        "clarity": 0.75,
        "style_exaggeration": 0.2,
        "intonation_description": "Tono enérgico, de ritmo rápido y dinámico (estilo insider de gaming), enfatizando las palabras clave y marcas importantes."
      }
    },
    "scenes": [
      {
        "scene_id": 1,
        "start_time_seconds": 0.0,
        "end_time_seconds": 3.0,
        "narrative_text": "Texto completo que se va a narrar en esta escena",
        "visual_resource": {
          "resource_type": "Gameplay de Juego X / Logo animado / Stock de tecnología / Gráfico de datos",
          "youtube_search_query": "Término de búsqueda hiper-específico en inglés para YouTube",
          "fallback_stock_query": "Búsqueda de respaldo genérica de stock de alta calidad"
        },
        "hook_settings": {
          "dynamic_subtitles_placement": "center_middle / top_middle / bottom_middle",
          "screen_text_overlay": "Texto exacto que debe aparecer en pantalla grande para el gancho visual",
          "text_style": "Estilo de renderizado (neon_cyan, warning_red, bright_yellow, glitch)"
        }
      }
    ],
    "soundtrack": {
      "music_style": "Estilo de música sugerido (ej. Synthwave suspenso, Industrial oscuro, Upbeat Electro)",
      "tempo": "Fast (110-130 BPM)",
      "volume_level": 0.12
    },
    "web_blog_version": {
      "seo_title": "Título del artículo optimizado para SEO",
      "three_sentence_summary": "Resumen de exactamente 3 frases de la noticia.",
      "blog_post_markdown": "Versión en formato blog post de la noticia, optimizada para SEO en formato Markdown (2-3 párrafos con H2)."
    },
    "render_specifications": {
      "composition_library": "Remotion",
      "resolution": "1080x1920",
      "fps": 30
    }
  }
}

Reglas estrictas:
1. No alucines URLs. Si no encuentras un tráiler exacto, indica una búsqueda genérica.
2. Prioriza material con licencia creativa o clips de prensa oficiales.
3. El JSON de salida debe ser perfectamente válido y parseable, sin comentarios ni explicaciones adicionales fuera del bloque JSON.
    `.trim();

    let response;
    try {
      response = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemInstructions + "\n\nGUION DE ENTRADA:\n" + tiktok_script }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
    } catch (err: any) {
      console.warn(`⚠️ Error en gemini-3.5-flash: ${err.message}. Intentando fallback a gemini-2.5-flash...`);
      try {
        model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
        response = await model.generateContent({
          contents: [
            { role: "user", parts: [{ text: systemInstructions + "\n\nGUION DE ENTRADA:\n" + tiktok_script }] }
          ],
          generationConfig: {
            responseMimeType: "application/json",
          }
        });
      } catch (fallbackErr: any) {
        console.error("❌ Falló también el fallback a gemini-2.5-flash:", fallbackErr.message);
        throw new Error(`Original Error: ${err.message} | Fallback Error: ${fallbackErr.message}`);
      }
    }

    const outputText = response.response.text();
    const parsed = JSON.parse(outputText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Error en la Edge Function generate-production-plan:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
