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
const newsId = "9049bb85-4b69-4ede-a02a-aceea6451300";

const manualPlan = {
  soundtrack: {
    name: "synthwave_cyberpunk",
    volume_level: 0.12
  },
  scenes: [
    {
      scene_id: 1,
      start_time_seconds: 0,
      end_time_seconds: 6,
      narrative_text: "¡Atención fans de Nintendo! Se acaba de revelar el remake más esperado de todos los tiempos. The Legend of Zelda: Ocarina of Time volverá totalmente recreado para la Nintendo Switch 2.",
      visual_resource: {
        youtube_search_query: "The Legend of Zelda Ocarina of Time Remake Switch 2 trailer"
      },
      hook_settings: {
        screen_text_overlay: "¡OCARINA REMAKE EN SWITCH 2!",
        text_style: "neon_cyan",
        dynamic_subtitles_placement: "center_middle"
      }
    },
    {
      scene_id: 2,
      start_time_seconds: 6,
      end_time_seconds: 13,
      narrative_text: "Según los últimos informes de la industria, Nintendo está trabajando en una versión totalmente reimaginada del legendario juego de Nintendo sesenta y cuatro para acompañar el catálogo de su nueva consola.",
      visual_resource: {
        youtube_search_query: "Nintendo Switch 2 hardware console reveal"
      }
    },
    {
      scene_id: 3,
      start_time_seconds: 13,
      end_time_seconds: 21,
      narrative_text: "El título estaría siendo reconstruido desde cero utilizando Unreal Engine 5, prometiendo gráficos de última generación, iluminación global en tiempo real y físicas completamente realistas.",
      visual_resource: {
        youtube_search_query: "Zelda Ocarina of Time Unreal Engine 5 gameplay"
      }
    },
    {
      scene_id: 4,
      start_time_seconds: 21,
      end_time_seconds: 29,
      narrative_text: "Este remake buscaría revivir el reino de Hyrule respetando la historia clásica que nos enamoró en mil novecientos noventa y ocho, pero con un nivel de inmersión y detalle nunca antes visto.",
      visual_resource: {
        youtube_search_query: "Zelda Ocarina of time N64 original gameplay comparisons"
      }
    },
    {
      scene_id: 5,
      start_time_seconds: 29,
      end_time_seconds: 37,
      narrative_text: "Se estima que el juego llegará al mercado a finales de dos mil veintiséis. Dime en los comentarios, ¿crees que este remake superará al juego original? ¡Sígueme para más noticias gaming!",
      visual_resource: {
        youtube_search_query: "Zelda Breath of the Wild 2 Link gameplay cinematic"
      }
    }
  ]
};

async function run() {
  console.log("📥 Insertando plan de producción manual para la noticia de Zelda...");
  
  const { error } = await supabase
    .from('published_news')
    .update({
      production_plan: manualPlan
    })
    .eq('id', newsId);

  if (error) {
    console.error("❌ Error al guardar el plan:", error.message);
    process.exit(1);
  }

  console.log("✅ Plan de producción manual guardado con éxito.");
}

run();
