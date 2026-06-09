const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ytSearch = require('yt-search');
const { createClient } = require('@supabase/supabase-js');

// Configurar dotenv apuntando al .env de las funciones de supabase
require('dotenv').config({ path: path.resolve(__dirname, '../supabase/functions/.env') });

const newsId = process.argv[2];

if (!newsId) {
  console.error("❌ Error: Debes proporcionar el ID de la noticia. Uso: node render_pipeline.js <news_id>");
  process.exit(1);
}

// Inicializar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Credenciales de Supabase faltantes en el entorno.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log(`🤖 --- INICIANDO PIPELINE DE RENDERIZADO PARA NOTICIA: ${newsId} ---`);
  
  // 1. Obtener la noticia y el plan de producción de la BD
  console.log("🔍 Consultando plan de producción en la base de datos...");
  const { data: newsItem, error: dbError } = await supabase
    .from('published_news')
    .select('title, production_plan')
    .eq('id', newsId)
    .single();

  if (dbError || !newsItem) {
    console.error("❌ Error al obtener noticia de la BD:", dbError?.message || "Noticia no encontrada");
    process.exit(1);
  }

  const rawPlan = newsItem.production_plan;
  if (!rawPlan) {
    console.error("❌ Error: Esta noticia no tiene un plan de producción generado.");
    process.exit(1);
  }

  const plan = rawPlan.production_plan || rawPlan;
  console.log(`✅ Plan obtenido: "${newsItem.title}"`);
  console.log(`- Escenas a procesar: ${plan.scenes?.length || 0}`);

  // Crear directorio de assets
  const assetsDir = path.resolve(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // 2. Generar Soundtrack Mock (Silencio de 2 minutos)
  console.log("\n🎵 Generando soundtrack mock...");
  const soundtrackPath = path.join(assetsDir, 'soundtrack.mp3');
  try {
    execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 120 -q:a 9 -acodec libmp3lame "${soundtrackPath}" -y`, { stdio: 'ignore' });
    console.log("✅ Soundtrack mock creado.");
  } catch (err) {
    console.error("❌ Error creando soundtrack mock:", err.message);
  }

  // 3. Procesar cada escena
  for (const scene of plan.scenes) {
    const sceneId = scene.scene_id;
    const duration = scene.end_time_seconds - scene.start_time_seconds;
    console.log(`\n🎬 --- PROCESANDO ESCENA ${sceneId} (Duración: ${duration}s) ---`);

    // A. Generar Voice-over Mock (silencio con la duración exacta de la escena)
    console.log(`🎙️ Generando voice-over mock de ${duration}s...`);
    const voicePath = path.join(assetsDir, `scene_${sceneId}_voice.mp3`);
    try {
      execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${duration} -q:a 9 -acodec libmp3lame "${voicePath}" -y`, { stdio: 'ignore' });
      console.log("✅ Voice-over mock creado.");
    } catch (err) {
      console.error("❌ Error al crear voice-over mock:", err.message);
    }

    // B. Buscar clip en YouTube y descargarlo
    const query = scene.visual_resource.youtube_search_query;
    console.log(`🔍 Buscando clip en YouTube para: "${query}"`);
    let videoUrl = null;
    try {
      const searchRes = await ytSearch(query);
      const videos = searchRes.videos.slice(0, 1);
      if (videos.length > 0) {
        videoUrl = videos[0].url;
        console.log(`   🟢 Encontrado: "${videos[0].title}" | ${videoUrl}`);
      } else {
        console.log(`   ⚠️ No se encontraron videos. Usando fallback de stock.`);
      }
    } catch (err) {
      console.error(`   ⚠️ Error al buscar en YouTube:`, err.message);
    }

    const tempVideoPath = path.join(assetsDir, `temp_scene_${sceneId}.mp4`);
    const finalVideoPath = path.join(assetsDir, `scene_${sceneId}_visual.mp4`);

    let downloadSuccess = false;

    if (videoUrl) {
      console.log(`📥 Descargando video con yt-dlp...`);
      try {
        // Descargar solo los primeros 30 segundos para agilizar el renderizado
        execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --merge-output-format mp4 --download-sections "*00:00-00:45" "${videoUrl}" -o "${tempVideoPath}" --no-playlist`, { stdio: 'inherit' });
        downloadSuccess = true;
        console.log("✅ Descarga finalizada.");
      } catch (err) {
        console.error("❌ Error descargando con yt-dlp:", err.message);
      }
    }

    // C. Procesamiento y corte con FFmpeg
    if (downloadSuccess && fs.existsSync(tempVideoPath)) {
      console.log(`✂️ Recortando y adaptando video a vertical (1080x1920)...`);
      try {
        // Escalar y hacer crop a vertical 1080x1920, descartando el audio original para mayor velocidad y robustez
        // Usamos scale=-1:1920 para garantizar que la altura sea suficiente para el crop vertical
        execSync(`ffmpeg -ss 0 -t ${duration} -i "${tempVideoPath}" -vf "scale=-1:1920,crop=1080:1920" -c:v libx264 -an "${finalVideoPath}" -y`, { stdio: 'ignore' });
        console.log("✅ Video adaptado correctamente.");
        // Limpiar archivo temporal
        fs.unlinkSync(tempVideoPath);
      } catch (err) {
        console.error("❌ Error al recortar con FFmpeg:", err.message);
        downloadSuccess = false; // Forzar generación de fallback si falla FFmpeg
      }
    }

    // Fallback: Si no se pudo descargar o recortar, generar un video de prueba de color neon interactivo
    if (!downloadSuccess || !fs.existsSync(finalVideoPath)) {
      console.log("⚠️ Generando video de prueba (fallback) con FFmpeg...");
      try {
        // Generar un video de prueba con tono azul oscuro/cyberpunk
        execSync(`ffmpeg -f lavfi -i color=c=0x0e0e0f:s=1080x1920:r=30 -t ${duration} -c:v libx264 -pix_fmt yuv420p "${finalVideoPath}" -y`, { stdio: 'ignore' });
        console.log("✅ Video de prueba generado como fallback.");
      } catch (err) {
        console.error("❌ Error grave al generar video fallback:", err.message);
      }
    }
  }

  // 4. Renderizar composición con Remotion
  console.log("\n⚛️ --- EJECUTANDO COMPILADOR REMOTION --- ⚛️");
  const outputVideoName = `news_${newsId}.mp4`;
  const outputVideoPath = path.resolve(__dirname, '..', 'web', 'public', outputVideoName);
  
  // Calcular la duración total de la composición
  const maxEndTime = Math.max(...plan.scenes.map(s => s.end_time_seconds));
  const totalFrames = Math.round(maxEndTime * 30);
  console.log(`- Duración total calculada: ${maxEndTime}s (${totalFrames} frames)`);

  try {
    console.log(`Compilando video final a: ${outputVideoPath}`);
    // Pasar los props del plan y la duración total a través de CLI
    execSync(`npx remotion render Root.tsx NexoGamingVideo "${outputVideoPath}" --props='${JSON.stringify({ plan })}' --duration=${totalFrames} --overwrite`, { stdio: 'inherit' });
    console.log(`\n🎉 --- RENDERIZADO COMPLETADO CON ÉXITO --- 🎉`);
    console.log(`Video disponible en: /${outputVideoName}`);
  } catch (err) {
    console.error("❌ Error durante el renderizado de Remotion:", err.message);
    process.exit(1);
  }
}

run();
