import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { GamingArticle } from "./extractor.ts";

export interface GeneratedPosts {
  tweet: string;
  instagram_caption: string;
  youtube_search_query: string;
  web_article: string;
  tiktok_script: string;
}

/**
 * Utiliza Google Gemini para procesar la noticia cruda y generar copys para redes sociales.
 */
export async function generateSocialPosts(article: GamingArticle): Promise<GeneratedPosts | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY no está configurada en las variables de entorno.");
    return null;
  }

  const ai = new GoogleGenerativeAI(apiKey);

  const prompt = `
Actúa como un Community Manager experto en videojuegos para el canal "NexoGamingNews".
Tu tarea es tomar una noticia cruda y generar contenido para publicarla en X (Twitter) y en Instagram.

NOTICIA ORIGINAL:
Título: ${article.title}
Plataforma: ${article.platform}
Contenido: ${article.content}
Enlace: ${article.link}

INSTRUCCIONES PARA X (TWITTER):
- Escribe un tweet conciso (máximo 280 caracteres, incluyendo el enlace).
- El tono debe ser rápido, llamativo y gamer.
- Usa 2 o 3 emojis.
- Incluye 2 o 3 hashtags relevantes (#GamingNews, #${article.platform.replace(/\s/g, '')}, etc.).
- Debe incluir el enlace original al final.

INSTRUCCIONES PARA INSTAGRAM:
- Escribe un copy (pie de foto) más detallado y envolvente.
- Haz una pregunta a la comunidad al final para fomentar la interacción ("¿Qué opinan de esto?", "¿Lo van a jugar?").
- Separa el texto en párrafos cortos y usa emojis.
- Incluye hashtags relevantes al final.
- Menciona que el enlace está en la bio o incluye el enlace como texto.

INSTRUCCIONES PARA BÚSQUEDA DE VIDEO:
- Identifica de qué videojuego principal trata la noticia.
- Genera un término de búsqueda muy preciso en inglés para buscar el trailer oficial de ese juego en YouTube (por ejemplo: "The Legend of Zelda Echoes of Wisdom official trailer").

INSTRUCCIONES PARA ARTÍCULO WEB:
- Redacta un artículo breve (2-3 párrafos) en formato Markdown adaptado para una audiencia de gamers hardcore.
- Usa un tono editorial, "Cyber-Industrial", con un título H2.
- Incluye detalles técnicos o de la industria relevantes a la noticia.

INSTRUCCIONES PARA TIKTOK (GUION):
- Escribe un guion dinámico para ser leído en un video vertical de entre 60 y 120 segundos.
- Empieza siempre con un "Gancho" agresivo en los primeros 3 segundos.
- Desarrolla la noticia con lenguaje natural, entusiasta y veloz.
- Termina con un "Call to Action" (Ej: "Dime en los comentarios qué opinas" o "Sígueme para más noticias").
- Incluye indicaciones visuales entre corchetes (Ej: [Mostrar imagen del juego]).

DEVUELVE TU RESPUESTA EXACTAMENTE EN ESTE FORMATO JSON, SIN NADA MÁS:
{
  "tweet": "Aquí va el tweet...",
  "instagram_caption": "Aquí va el copy de instagram...",
  "youtube_search_query": "Término de búsqueda del trailer...",
  "web_article": "Aquí va el artículo en formato Markdown...",
  "tiktok_script": "Aquí va el guion para TikTok..."
}
`;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-3.5-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const text = response.response.text();
    if (text) {
      const parsed: GeneratedPosts = JSON.parse(text);
      return parsed;
    }
    return null;

  } catch (error) {
    console.error(`❌ Error generando contenido con IA para "${article.title}":`, error.message);
    return null;
  }
}
