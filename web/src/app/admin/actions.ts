"use server";

import { getSupabaseServerClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function submitNewsAction(formData: FormData) {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    throw new Error("Contraseña incorrecta.");
  }

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const youtubeUrl = formData.get("youtubeUrl") as string;
  const imageFile = formData.get("image") as File;
  const status = (formData.get("status") as string) || "published";

  if (!title || !content) {
    throw new Error("El título y el contenido son obligatorios.");
  }

  const supabase = getSupabaseServerClient();
  let imageUrl = formData.get("existingImage") as string | null;

  // Subir imagen si existe
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('news_images')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError);
      throw new Error("No se pudo subir la imagen.");
    }

    const { data: publicUrlData } = supabase.storage
      .from('news_images')
      .getPublicUrl(fileName);
      
    imageUrl = publicUrlData.publicUrl;
  }

  const tiktokScript = formData.get("tiktokScript") as string;
  const productionPlan = formData.get("productionPlan") as string;
  const tweet = formData.get("tweet") as string;
  const instagramCaption = formData.get("instagramCaption") as string;

  const newsData = {
    title: title,
    web_article: content,
    youtube_url: youtubeUrl || null,
    image_url: imageUrl,
    status: status,
    platform: 'manual',
    tiktok_script: tiktokScript || null,
    production_plan: productionPlan ? JSON.parse(productionPlan) : null,
    tweet: tweet || null,
    instagram_caption: instagramCaption || null,
  };

  let resultId = id;

  if (id) {
    // Actualizar existente
    const { error: updateError } = await supabase
      .from('published_news')
      .update(newsData)
      .eq('id', id);

    if (updateError) {
      console.error("Error al actualizar en base de datos:", updateError);
      throw new Error("No se pudo actualizar la noticia.");
    }
  } else {
    // Insertar nueva
    const sourceUrl = `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const { data: insertedData, error: insertError } = await supabase
      .from('published_news')
      .insert({
        ...newsData,
        source_url: sourceUrl,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error("Error al guardar en base de datos:", insertError);
      throw new Error("No se pudo guardar la noticia.");
    }
    
    if (insertedData) {
      resultId = insertedData.id;
    }
  }

  revalidatePath('/');
  revalidatePath('/admin');
  if (resultId) revalidatePath(`/noticia/${resultId}`);
  
  return { success: true, id: resultId };
}

export async function updateNewsStatusAction(password: string, id: string, status: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    throw new Error("Contraseña incorrecta.");
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('published_news')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar estado:", error);
    throw new Error("No se pudo actualizar el estado de la noticia.");
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/noticia/${id}`);

  return { success: true };
}

export async function generateProductionPlanAction(password: string, tiktokScript: string, id?: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    throw new Error("Contraseña incorrecta.");
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.functions.invoke('generate-production-plan', {
    body: { tiktok_script: tiktokScript }
  });

  if (error) {
    console.error("Error invoking generate-production-plan:", error);
    throw new Error("No se pudo generar el plan de producción.");
  }

  // Si se provee un ID, guardar inmediatamente en la base de datos para evitar que falle el renderizador
  if (id) {
    console.log(`Guardando el plan de producción generado en la base de datos para la noticia ID: ${id}`);
    const { error: updateError } = await supabase
      .from('published_news')
      .update({ production_plan: data })
      .eq('id', id);

    if (updateError) {
      console.error("Error al guardar el plan de producción en la base de datos:", updateError);
    }
  }

  return data;
}

export async function triggerVideoRenderAction(password: string, id: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    throw new Error("Contraseña incorrecta.");
  }

  try {
    const videoDir = path.resolve(process.cwd(), "../video");
    const cmd = `node render_pipeline.js ${id}`;
    
    console.log(`Ejecutando render de video para noticia ${id} desde ${videoDir}...`);
    const { stdout, stderr } = await execPromise(cmd, { cwd: videoDir });
    console.log("Stdout del render:", stdout);
    
    if (stderr) {
      console.warn("Stderr del render:", stderr);
    }

    return { success: true, stdout };
  } catch (err: any) {
    console.error("Error al renderizar el video:", err);
    throw new Error(`Fallo en el renderizado: ${err.message}`);
  }
}

async function generateSocialContentForNews(title: string, webArticle: string, tiktokScript: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurado en el servidor web.");
  }

  const prompt = `
Actúa como un redactor experto en redes sociales para el canal de videojuegos "NexoGamingNews".
Tu tarea es redactar dos borradores de publicaciones de redes sociales y sugerencias de TikTok basados en los datos de la noticia proporcionados.

DATOS DE LA NOTICIA:
Título: ${title}
Contenido/Artículo Web: ${webArticle}
Guión de TikTok: ${tiktokScript}

INSTRUCCIONES PARA X (TWITTER):
- Escribe un tweet conciso (máximo 280 caracteres).
- El tono debe ser rápido, llamativo y gamer.
- Usa 2 o 3 emojis.
- Incluye 2 o 3 hashtags relevantes (#GamingNews, #Switch2, #Zelda, etc.).

INSTRUCCIONES PARA INSTAGRAM:
- Escribe un copy (pie de foto) más de 3 párrafos, detallado y envolvente.
- Haz una pregunta a la comunidad al final para fomentar la interacción.
- Separa el texto en párrafos cortos y usa emojis.
- Incluye hashtags relevantes al final.

INSTRUCCIONES PARA TIKTOK (Sugerencias):
- Sugiere de 1 a 3 comentarios cortos e interesantes para fijar en el video (comentarios gancho).
- Sugiere de 3 a 5 tags (hashtags) recomendados para la publicación del video en TikTok.

Devuelve tu respuesta EXACTAMENTE en este formato JSON, sin comentarios adicionales ni bloques de markdown. Solo el JSON parseable:
{
  "tweet": "Aquí va el tweet...",
  "instagram_caption": "Aquí va el copy de instagram...",
  "tiktok_comments": ["Comentario sugerido 1", "Comentario sugerido 2"],
  "tiktok_tags": ["#tag1", "#tag2", "#tag3"]
}
  `.trim();

  const url35 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  const urlFallback = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  let attempts = 3;
  let delay = 1000;
  let lastError: any = null;

  for (let i = 0; i < attempts; i++) {
    try {
      let currentUrl = url35;
      let response = await fetch(currentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ Error en gemini-3.5-flash: status ${response.status}. Detalle: ${errorText}. Intentando fallback a gemini-2.5-flash...`);
        
        currentUrl = urlFallback;
        response = await fetch(currentUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const finalErrorText = await response.text();
          throw new Error(`Google Gemini API falló (incluyendo fallback): ${finalErrorText}`);
        }
      }

      const json = await response.json();
      const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error("No se recibió respuesta válida de Google Gemini.");
      }

      try {
        return JSON.parse(textResponse.trim());
      } catch (err) {
        console.error("Error al parsear JSON de Gemini:", textResponse);
        throw new Error("La respuesta de la IA no contenía un JSON válido.");
      }
    } catch (error: any) {
      console.warn(`Intento ${i + 1} falló al generar contenido social:`, error.message);
      lastError = error;
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  throw lastError || new Error("Fallo la comunicación con Google Gemini después de múltiples intentos.");
}

export async function sendCuratedContentToTelegramAction(password: string, id: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    throw new Error("Contraseña incorrecta.");
  }

  const supabase = getSupabaseServerClient();
  const { data: newsItem, error } = await supabase
    .from("published_news")
    .select("title, tweet, instagram_caption, video_url, id, web_article, tiktok_script")
    .eq("id", id)
    .single();

  if (error || !newsItem) {
    console.error("Error obteniendo noticia de Supabase:", error);
    throw new Error("No se pudo obtener la noticia de la base de datos.");
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error("Faltan credenciales de Telegram en las variables de entorno del servidor web.");
  }

  const title = newsItem.title || "Sin título";
  let tweet = (newsItem.tweet || "").trim();
  let instagram = (newsItem.instagram_caption || "").trim();
  const videoUrl = newsItem.video_url;
  
  let tiktokComments: string[] = [];
  let tiktokTags: string[] = [];

  const needTweet = !tweet;
  const needInstagram = !instagram;
  const needsGeneration = needTweet || needInstagram;

  if (needsGeneration) {
    console.log("Detectados borradores vacíos de redes sociales. Generando contenidos con IA...");
    try {
      const generated = await generateSocialContentForNews(
        newsItem.title || "",
        newsItem.web_article || "",
        newsItem.tiktok_script || ""
      );

      const updateData: any = {};
      if (needTweet) {
        tweet = generated.tweet || "";
        updateData.tweet = tweet;
      }
      if (needInstagram) {
        instagram = generated.instagram_caption || "";
        updateData.instagram_caption = instagram;
      }

      tiktokComments = generated.tiktok_comments || [];
      tiktokTags = generated.tiktok_tags || [];

      if (Object.keys(updateData).length > 0) {
        console.log("Almacenando contenidos generados en la base de datos:", updateData);
        const { error: updateError } = await supabase
          .from("published_news")
          .update(updateData)
          .eq("id", id);

        if (updateError) {
          console.error("Error al guardar en base de datos:", updateError.message);
        } else {
          console.log("Contenidos de redes sociales guardados en la BD.");
        }
      }
    } catch (genErr: any) {
      console.error("Fallo la generación automática de posts:", genErr.message);
    }
  } else {
    // Si ya existen ambos, solo generamos sugerencias rápidas de TikTok
    try {
      console.log("Generando comentarios y tags sugeridos de TikTok con IA...");
      const generated = await generateSocialContentForNews(
        newsItem.title || "",
        newsItem.web_article || "",
        newsItem.tiktok_script || ""
      );
      tiktokComments = generated.tiktok_comments || [];
      tiktokTags = generated.tiktok_tags || [];
    } catch (genErr: any) {
      console.error("Fallo la generación de sugerencias de TikTok:", genErr.message);
    }
  }

  // Si falló la generación de IA y siguen vacíos, usar placeholders
  if (!tweet) tweet = "No redactado";
  if (!instagram) instagram = "No redactado";

  let caption = `
🎮 *Contenidos Curados: ${title}* 🎮

🐦 *Borrador para X (Twitter):*
${tweet}

📸 *Borrador para Instagram:*
${instagram}
  `.trim();

  if (tiktokComments.length > 0 || tiktokTags.length > 0) {
    caption += `\n\n🎵 *Sugerencias para TikTok:*`;
    if (tiktokComments.length > 0) {
      caption += `\n💬 *Comentarios gancho:*`;
      tiktokComments.forEach(c => {
        caption += `\n- ${c}`;
      });
    }
    if (tiktokTags.length > 0) {
      caption += `\n🏷️ *Tags recomendados:* ${tiktokTags.join(" ")}`;
    }
  }

  try {
    if (videoUrl) {
      console.log(`Enviando video a Telegram (${videoUrl})...`);
      const telegramVideoUrl = `https://api.telegram.org/bot${botToken}/sendVideo`;
      
      let videoCaption = caption;
      let followUpText = "";
      
      if (caption.length > 1024) {
        videoCaption = `🎮 *Contenidos Curados: ${title}* 🎮\n\n🎥 *Video de TikTok* (Textos curados abajo en la respuesta)`;
        followUpText = caption;
      }

      const response = await fetch(telegramVideoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          video: videoUrl,
          caption: videoCaption,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram sendVideo falló: ${errorText}`);
      }

      if (followUpText) {
        const videoJson = await response.json();
        const videoMessageId = videoJson.result?.message_id;
        
        console.log(`Enviando mensaje complementario debido a límite de caracteres (ID respuesta: ${videoMessageId})...`);
        const telegramMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const followUpResponse = await fetch(telegramMessageUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: followUpText,
            parse_mode: 'Markdown',
            reply_to_message_id: videoMessageId
          })
        });

        if (!followUpResponse.ok) {
          const errorText = await followUpResponse.text();
          console.error("Fallo el envío del texto complementario a Telegram:", errorText);
        }
      }
    } else {
      console.log(`Enviando mensaje de texto normal a Telegram (sin video_url)...`);
      const telegramMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramMessageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption + "\n\n🎥 *Video TikTok (Remotion):* No renderizado en R2 aún.",
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram sendMessage falló: ${errorText}`);
      }
    }

    return { 
      success: true,
      tweet,
      instagramCaption: instagram
    };
  } catch (err: any) {
    console.error("Error al enviar notificación de Telegram:", err);
    throw new Error(`Error al enviar a Telegram: ${err.message}`);
  }
}

export async function processManualNewsAction(password: string, title: string, url: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    throw new Error("Contraseña incorrecta.");
  }

  const supabase = getSupabaseServerClient();

  try {
    console.log(`Invocando Edge Function process-gaming-news de forma manual para: "${title}" - ${url}...`);
    const { data, error } = await supabase.functions.invoke("process-gaming-news", {
      body: {
        title,
        url,
        force: true
      }
    });

    if (error) {
      console.error("Error al invocar edge function process-gaming-news:", error);
      throw new Error(error.message || "Fallo en la Edge Function.");
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Error en processManualNewsAction:", err);
    throw new Error(`Error al invocar la función de procesamiento: ${err.message}`);
  }
}

