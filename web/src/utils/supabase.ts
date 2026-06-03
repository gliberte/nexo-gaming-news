import { createClient } from "@supabase/supabase-js";

// Creamos un cliente usando la Service Role Key para hacer fetch en el servidor
// IMPORTANTE: Este cliente solo debe usarse en Server Components o API Routes
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });
}
