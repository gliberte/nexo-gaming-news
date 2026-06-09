const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables
require('dotenv').config({ path: path.resolve(__dirname, '../supabase/functions/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan credenciales de Supabase.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const title = process.argv[2];
const url = process.argv[3];

if (!title || !url) {
  console.log("📖 Uso: node add_news.js \"Título del Artículo\" \"https://enlace-del-articulo.com\"");
  process.exit(1);
}

async function add() {
  console.log(`📥 Insertando noticia: "${title}"...`);
  const { data, error } = await supabase
    .from('published_news')
    .insert([
      { title, source_url: url }
    ])
    .select();

  if (error) {
    console.error("❌ Error al insertar noticia:", error.message);
    process.exit(1);
  }

  console.log(`✅ Noticia insertada correctamente con ID: ${data[0].id}`);
  console.log(`\n👉 Siguiente paso: Genera el plan de producción desde tu panel administrativo web o ejecuta el renderizado.`);
}

add();
