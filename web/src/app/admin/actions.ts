"use server";

import { getSupabaseServerClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";

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

  const newsData = {
    title: title,
    web_article: content,
    youtube_url: youtubeUrl || null,
    image_url: imageUrl,
    status: status,
    platform: 'manual',
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
