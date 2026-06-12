"use server";

import { getSupabaseServerClient } from "@/utils/supabase";
import { exec } from "child_process";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

// Helper to check password session (similar to admin, or bypass for demo)
function verifyDemoSession() {
  // En el entorno CaaS, permitimos operaciones del dashboard para demostración
  return true;
}

/**
 * Obtiene las noticias pertenecientes a un creador (filtradas por el user_id almacenado en el plan o la columna)
 */
export async function getCreatorNewsAction(creatorId: string) {
  verifyDemoSession();
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("published_news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching creator news:", error);
    throw new Error("No se pudieron obtener las noticias.");
  }

  // Filtrar en memoria por el user_id del creador
  const filtered = (data || []).filter((item: any) => {
    const rawPlan = item.production_plan;
    const plan = rawPlan?.production_plan || rawPlan;
    const itemUserId = plan?.user_id || item.user_id || "default-creator";
    return itemUserId === creatorId;
  });

  return filtered;
}

/**
 * Obtiene el detalle de una noticia específica para el editor
 */
export async function getCreatorNewsItemAction(id: string) {
  verifyDemoSession();
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("published_news")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching news item:", error);
    throw new Error("No se pudo obtener la noticia.");
  }

  return data;
}

/**
 * Importa una noticia usando la Edge Function de Supabase, y la asocia al creador
 */
export async function importCreatorNewsAction(creatorId: string, title: string, url: string, platform?: string, niche: string = "gaming") {
  verifyDemoSession();
  const supabase = getSupabaseServerClient();

  try {
    console.log(`Invocando Edge Function process-gaming-news para creador "${creatorId}" [niche: ${niche}]: "${title}"...`);
    
    // Invocamos la Edge Function de procesamiento de noticias
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke("process-gaming-news", {
      body: {
        title,
        url,
        platform: platform || "Manual",
        creatorId: creatorId,
        niche: niche,
        force: true
      }
    });

    if (edgeError) {
      console.error("Error al invocar edge function:", edgeError);
      throw new Error(edgeError.message || "Fallo en la Edge Function.");
    }

    // Buscamos la noticia recién insertada en la base de datos por su URL de origen
    const { data: newsItem, error: fetchError } = await supabase
      .from("published_news")
      .select("*")
      .eq("source_url", url)
      .single();

    if (fetchError || !newsItem) {
      console.warn("No se encontró la noticia recién insertada por URL de origen. Intentando por título...");
      // Fallback
      const { data: fallbackNews } = await supabase
        .from("published_news")
        .select("*")
        .eq("title", title)
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (fallbackNews && fallbackNews.length > 0) {
        const item = fallbackNews[0];
        await associateNewsToCreator(item.id, creatorId, item.production_plan);
        return { success: true, id: item.id };
      }
      throw new Error("La noticia se procesó pero no se pudo asociar a tu perfil.");
    }

    // Asociamos la noticia al creador
    await associateNewsToCreator(newsItem.id, creatorId, newsItem.production_plan);

    return { success: true, id: newsItem.id };
  } catch (err: any) {
    console.error("Error en importCreatorNewsAction:", err);
    throw new Error(err.message || "Error al importar la noticia.");
  }
}

// Helper para asociar la noticia al creador guardando el user_id en el JSONB del plan de producción
async function associateNewsToCreator(id: string, creatorId: string, currentPlan: any) {
  const supabase = getSupabaseServerClient();
  const updatedPlan = currentPlan ? JSON.parse(JSON.stringify(currentPlan)) : {};
  
  if (updatedPlan.production_plan) {
    updatedPlan.production_plan.user_id = creatorId;
  } else {
    updatedPlan.user_id = creatorId;
  }

  const { error } = await supabase
    .from("published_news")
    .update({ 
      user_id: creatorId,
      production_plan: updatedPlan 
    })
    .eq("id", id);

  if (error) {
    console.error("Error asociando noticia a creador:", error);
  }
}

/**
 * Guarda los cambios manuales hechos por el creador en el editor (Guion, subtítulos, crops, etc.)
 */
export async function saveCreatorSceneScriptAction(
  id: string, 
  creatorId: string, 
  productionPlan: any, 
  tweet: string, 
  instagramCaption: string
) {
  verifyDemoSession();
  const supabase = getSupabaseServerClient();

  const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
  // Asegurar que el user_id esté inyectado en el plan
  if (updatedPlan.production_plan) {
    updatedPlan.production_plan.user_id = creatorId;
  } else {
    updatedPlan.user_id = creatorId;
  }

  const { error } = await supabase
    .from("published_news")
    .update({
      production_plan: updatedPlan,
      tweet: tweet || null,
      instagram_caption: instagramCaption || null,
      user_id: creatorId
    })
    .eq("id", id);

  if (error) {
    console.error("Error al guardar cambios de la noticia:", error);
    throw new Error("No se pudieron guardar los cambios.");
  }

  return { success: true };
}

/**
 * Inyecta el branding del creador y ejecuta el renderizado en segundo plano
 */
export async function renderCreatorVideoAction(id: string, creatorId: string, branding: any) {
  verifyDemoSession();
  const supabase = getSupabaseServerClient();

  // 1. Obtener la noticia y el plan de producción actual
  const { data: newsItem, error: fetchError } = await supabase
    .from("published_news")
    .select("production_plan")
    .eq("id", id)
    .single();

  if (fetchError || !newsItem) {
    throw new Error("No se pudo obtener la noticia para renderizar.");
  }

  const updatedPlan = newsItem.production_plan ? JSON.parse(JSON.stringify(newsItem.production_plan)) : {};
  const innerPlan = updatedPlan.production_plan || updatedPlan;
  
  // Inyectar el branding y el creador en el plan
  innerPlan.branding = branding;
  innerPlan.user_id = creatorId;
  
  if (updatedPlan.production_plan) {
    updatedPlan.production_plan = innerPlan;
  } else {
    Object.assign(updatedPlan, innerPlan);
  }

  // 2. Guardar el plan actualizado con la marca del usuario
  const { error: updateError } = await supabase
    .from("published_news")
    .update({ 
      production_plan: updatedPlan,
      status: "draft" // Regresa a draft durante el renderizado
    })
    .eq("id", id);

  if (updateError) {
    console.error("Error al inyectar branding en base de datos:", updateError);
    throw new Error("No se pudo guardar la configuración de branding en el plan.");
  }

  // 3. Ejecutar renderizado
  try {
    const videoDir = path.resolve(process.cwd(), "../video");
    const cmd = `node render_pipeline.js ${id}`;
    
    console.log(`[CaaS Render] Ejecutando render para noticia ${id} desde ${videoDir}...`);
    
    // Ejecutamos de forma asíncrona para no bloquear el hilo de Next.js
    exec(cmd, { cwd: videoDir, maxBuffer: 1024 * 1024 * 100 }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[CaaS Render Error] Error renderizando video ${id}:`, err);
        return;
      }
      console.log(`[CaaS Render Success] Video ${id} finalizado.`);
      if (stderr) console.warn(`[CaaS Render Stderr]:`, stderr);
      
      // Marcar noticia como publicada al terminar exitosamente
      supabase
        .from("published_news")
        .update({ status: "published" })
        .eq("id", id)
        .then(({ error: statusError }) => {
          if (statusError) console.error("Error actualizando estado final:", statusError.message);
        });
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error al invocar render de video:", err);
    throw new Error(`Fallo en el renderizado: ${err.message}`);
  }
}

/**
 * Obtiene los feeds RSS utilizando la Edge Function de Supabase y cruza contra published_news
 * para marcar si ya existe un borrador/video creado.
 */
export async function getDashboardRssFeedsAction(maxItems: number = 12, niche: string = "gaming", platform?: string) {
  verifyDemoSession();
  const supabase = getSupabaseServerClient();

  try {
    console.log(`Invocando Edge Function process-gaming-news para feeds CaaS (max_items=${maxItems}, niche=${niche}, platform=${platform})...`);
    const { data, error } = await supabase.functions.invoke("process-gaming-news", {
      body: {
        action: "fetch_feeds",
        max_items: maxItems,
        niche: niche,
        platform: platform
      }
    });

    if (error) {
      console.error("Error al invocar edge function para feeds:", error);
      throw new Error(error.message || "Fallo en la Edge Function.");
    }

    const articles = data?.articles || [];
    if (articles.length > 0) {
      const urls = articles.map((a: any) => a.link).filter(Boolean);
      
      // Buscar correspondencias en base de datos
      const { data: existingNews, error: fetchError } = await supabase
        .from("published_news")
        .select("source_url, id")
        .in("source_url", urls);

      if (fetchError) {
        console.error("Error al cruzar feeds con db:", fetchError);
        return articles.map((art: any) => ({ ...art, isProcessed: false, dbId: null }));
      }
      
      const existingUrls = new Set(existingNews?.map(n => n.source_url) || []);
      const urlToIdMap = new Map(existingNews?.map(n => [n.source_url, n.id]) || []);
      
      return articles.map((art: any) => ({
        ...art,
        isProcessed: existingUrls.has(art.link),
        dbId: urlToIdMap.get(art.link) || null
      }));
    }

    return articles;
  } catch (err: any) {
    console.error("Error en getDashboardRssFeedsAction:", err);
    throw new Error(`Error al obtener los feeds: ${err.message}`);
  }
}
