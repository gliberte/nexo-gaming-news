import { TwitterApi } from "https://esm.sh/twitter-api-v2@1.17.2";

/**
 * Publica un texto en X (Twitter).
 */
export async function publishToX(tweet: string): Promise<boolean> {
  const appKey = Deno.env.get("X_API_KEY");
  const appSecret = Deno.env.get("X_API_SECRET");
  const accessToken = Deno.env.get("X_ACCESS_TOKEN");
  const accessSecret = Deno.env.get("X_ACCESS_SECRET");

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    console.error("❌ Faltan credenciales de X en las variables de entorno.");
    return false;
  }

  const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });

  try {
    const { data: createdTweet } = await client.v2.tweet(tweet);
    console.log("✅ Publicado en X exitosamente. ID:", createdTweet.id);
    return true;
  } catch (error) {
    console.error("❌ Error al publicar en X:", error);
    return false;
  }
}

/**
 * Publica una imagen con texto en Instagram.
 * Nota: La API Graph de Instagram requiere obligatoriamente una imagen o video.
 */
export async function publishToInstagram(caption: string, imageUrl?: string): Promise<boolean> {
  const igToken = Deno.env.get("IG_ACCESS_TOKEN");
  const igAccountId = Deno.env.get("IG_ACCOUNT_ID");

  if (!igToken || !igAccountId) {
    console.error("❌ Faltan credenciales de Instagram en las variables de entorno.");
    return false;
  }

  // Si no hay imagen de la noticia, usamos un fallback público (ej. el logo del proyecto alojado en imgur/supabase)
  // Por ahora ponemos un placeholder, pero deberías subir tu logo a Supabase Storage y poner la URL pública aquí.
  const finalImageUrl = imageUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e0/Placeholder_gamepad.svg";

  try {
    // 1. Crear el contenedor (Media Object)
    const containerUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media`;
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: finalImageUrl,
        caption: caption,
        access_token: igToken
      })
    });
    
    const containerData = await containerRes.json();
    if (containerData.error) throw new Error(containerData.error.message);

    const creationId = containerData.id;

    // 2. Publicar el contenedor (Media Publish)
    const publishUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: igToken
      })
    });

    const publishData = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);

    console.log("✅ Publicado en Instagram exitosamente. ID:", publishData.id);
    return true;

  } catch (error) {
    console.error("❌ Error al publicar en Instagram:", error.message);
    return false;
  }
}

/**
 * Envia el borrador de la noticia generada a Telegram.
 */
export async function publishToTelegram(message: string): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("❌ Faltan credenciales de Telegram en las variables de entorno.");
    return false;
  }

  const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    const telegramResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();
      throw new Error(`Error enviando a Telegram: ${errorText}`);
    }

    console.log("✅ Enviado a Telegram exitosamente.");
    return true;
  } catch (error) {
    console.error("❌ Error al enviar a Telegram:", error.message);
    return false;
  }
}
