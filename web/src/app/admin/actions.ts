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

  const newsData = {
    title: title,
    web_article: content,
    youtube_url: youtubeUrl || null,
    image_url: imageUrl,
    status: status,
    platform: 'manual',
    tiktok_script: tiktokScript || null,
    production_plan: productionPlan ? JSON.parse(productionPlan) : null,
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

export async function generateProductionPlanAction(password: string, tiktokScript: string) {
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

