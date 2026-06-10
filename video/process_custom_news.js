const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde la carpeta de funciones
require('dotenv').config({ path: path.resolve(__dirname, '../supabase/functions/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan credenciales de Supabase en supabase/functions/.env (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const title = process.argv[2];
const url = process.argv[3];
const envFlag = process.argv[4]; // '--local' o '--prod'

if (!title || !url) {
  console.log("📖 Uso: node process_custom_news.js \"Título del Artículo\" \"https://enlace-del-articulo.com\" [--local|--prod]");
  process.exit(1);
}

async function run() {
  let targetUrl = supabaseUrl;
  
  if (envFlag === '--local') {
    targetUrl = 'http://localhost:54321';
    console.log(`🌐 Usando entorno local: ${targetUrl}`);
  } else if (envFlag === '--prod') {
    console.log(`🌐 Usando entorno de producción configurado: ${targetUrl}`);
  } else {
    // Si no se especifica bandera, detecta si es la URL local por defecto
    console.log(`🌐 Usando entorno por defecto: ${targetUrl}`);
  }

  console.log(`⚡ Invocando la Edge Function 'process-gaming-news' para la noticia:\n   "${title}"\n   Link: ${url}\n`);

  try {
    const supabase = createClient(targetUrl, supabaseKey);
    const { data, error } = await supabase.functions.invoke('process-gaming-news', {
      body: { title, url, force: true }
    });

    if (error) {
      throw error;
    }

    console.log("✅ Proceso completado con éxito por la Edge Function.");
    console.log("Respuesta de la Función:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Error al ejecutar el procesamiento manual:", err.message || err);
    process.exit(1);
  }
}

run();
