"use server";

import { getSupabaseServerClient } from "@/utils/supabase";

export async function getAdminDataAction(password: string) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return { success: false, error: "Falta configurar ADMIN_PASSWORD en las variables de entorno de producción." };
    }

    if (password !== adminPassword) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: "Faltan credenciales de Supabase en las variables de entorno (NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)." };
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("published_news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error:", error);
      return { success: false, error: `Error de Supabase: ${error.message}` };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Error in getAdminDataAction:", err);
    return { success: false, error: err.message || "Error interno al obtener los datos." };
  }
}

export async function getAdminNewsItemAction(password: string, id: string) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return { success: false, error: "Falta configurar ADMIN_PASSWORD en las variables de entorno de producción." };
    }

    if (password !== adminPassword) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: "Faltan credenciales de Supabase en las variables de entorno (NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)." };
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("published_news")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase Single Error:", error);
      return { success: false, error: `Error de Supabase al buscar noticia: ${error.message}` };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Error in getAdminNewsItemAction:", err);
    return { success: false, error: err.message || "Error interno al obtener la noticia." };
  }
}
