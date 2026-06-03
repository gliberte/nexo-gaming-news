import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import { GamingArticle } from "./extractor.ts";

export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("❌ Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY faltantes.");
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Comprueba si la URL de la noticia ya existe en la base de datos.
 * Devuelve true si ya existe (para evitar duplicados).
 */
export async function isNewsAlreadyProcessed(url: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("published_news")
    .select("id")
    .eq("source_url", url)
    .single();

  // PGRST116 es el código de Supabase para "No se encontraron filas" (lo cual es bueno, significa que es nueva)
  if (error && error.code !== "PGRST116") {
    console.error("❌ Error al consultar la base de datos:", error.message);
    // En caso de error de conexión, devolvemos true por seguridad para evitar spam
    return true; 
  }

  return data !== null;
}

/**
 * Inserta el registro de la noticia para marcarla como procesada/publicada.
 */
export async function markNewsAsProcessed(
  article: GamingArticle, 
  xSuccess: boolean, 
  igSuccess: boolean,
  webArticle?: string,
  youtubeUrl?: string,
  imageUrl?: string,
  tiktokScript?: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from("published_news")
    .insert({
      source_url: article.link,
      title: article.title,
      platform: article.platform,
      x_published: xSuccess,
      ig_published: igSuccess,
      web_article: webArticle,
      youtube_url: youtubeUrl,
      image_url: imageUrl,
      tiktok_script: tiktokScript
    });

  if (error) {
    console.error(`❌ Error insertando noticia en BD (${article.link}):`, error.message);
    return false;
  }
  
  return true;
}
