"use server";

import { getSupabaseServerClient } from "@/utils/supabase";

export async function getAdminDataAction(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    throw new Error("Contraseña incorrecta.");
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("published_news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Error al obtener datos.");
  }

  return data;
}

export async function getAdminNewsItemAction(password: string, id: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    throw new Error("Contraseña incorrecta.");
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("published_news")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("Error al obtener la noticia.");
  }

  return data;
}
