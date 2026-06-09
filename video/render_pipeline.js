const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ytSearch = require('yt-search');
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');


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

  // 2. Generar Soundtrack Mock si no existe un soundtrack real
  console.log("\n🎵 Verificando soundtrack...");
  const soundtrackPath = path.join(assetsDir, 'soundtrack.mp3');
  if (fs.existsSync(soundtrackPath)) {
    console.log("✅ Soundtrack real encontrado en assets/soundtrack.mp3. Reutilizando...");
  } else {
    console.log("   Generando soundtrack mock (silencio)...");
    try {
      execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 120 -q:a 9 -acodec libmp3lame "${soundtrackPath}" -y`, { stdio: 'ignore' });
      console.log("✅ Soundtrack mock creado.");
    } catch (err) {
      console.error("❌ Error creando soundtrack mock:", err.message);
    }
  }

  // 3. Procesar cada escena
  let currentRunningTime = 0.0;
  let isVoiceMock = false;
  plan.isVoiceMock = false; // Inicializar por defecto

  for (const scene of plan.scenes) {
    const sceneId = scene.scene_id;
    const originalDuration = scene.end_time_seconds - scene.start_time_seconds;
    console.log(`\n🎬 --- PROCESANDO ESCENA ${sceneId} (Duración estimada: ${originalDuration}s) ---`);

    const voicePath = path.join(assetsDir, `scene_${sceneId}_voice.mp3`);
    let finalSceneDuration = originalDuration;

    // A. Generar Voice-over (ElevenLabs real o mock silencioso)
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB"; // Default (Adam) u otra voz

    if (elevenLabsApiKey && scene.narrative_text) {
      console.log(`🎙️ Generando voice-over real con ElevenLabs para escena ${sceneId}...`);
      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: scene.narrative_text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(voicePath, buffer);
        console.log("   ✅ Voice-over real de ElevenLabs guardado.");

        // Obtener la duración exacta del audio generado usando ffprobe
        const probeCmd = `ffprobe -i "${voicePath}" -show_entries format=duration -v quiet -of csv="p=0"`;
        const audioDurationStr = execSync(probeCmd).toString().trim();
        const audioDuration = parseFloat(audioDurationStr);
        if (!isNaN(audioDuration) && audioDuration > 0) {
          finalSceneDuration = audioDuration;
          console.log(`   ℹ️ Duración medida del audio: ${finalSceneDuration.toFixed(2)}s`);
        }
      } catch (err) {
        console.error("   ⚠️ Falló ElevenLabs o medición del audio. Cayendo en mock silent...", err.message);
        isVoiceMock = true;
        // Fallback a silencio
        execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${originalDuration} -q:a 9 -acodec libmp3lame "${voicePath}" -y`, { stdio: 'ignore' });
        console.log("   ✅ Voice-over mock creado.");
      }
    } else {
      console.log(`🎙️ Generando voice-over mock (silencioso) de ${originalDuration}s...`);
      isVoiceMock = true;
      try {
        execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${originalDuration} -q:a 9 -acodec libmp3lame "${voicePath}" -y`, { stdio: 'ignore' });
        console.log("   ✅ Voice-over mock creado.");
      } catch (err) {
        console.error("   ❌ Error al crear voice-over mock:", err.message);
      }
    }

    // Actualizar dinámicamente las marcas de tiempo de la escena en el plan en memoria
    scene.start_time_seconds = currentRunningTime;
    scene.end_time_seconds = currentRunningTime + finalSceneDuration;
    currentRunningTime = scene.end_time_seconds;
    console.log(`   ⏱️ Tiempos de escena sincronizados: ${scene.start_time_seconds.toFixed(2)}s -> ${scene.end_time_seconds.toFixed(2)}s`);

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
        // Descargar solo los primeros 45 segundos para agilizar el renderizado
        execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --merge-output-format mp4 --download-sections "*00:00-00:45" "${videoUrl}" -o "${tempVideoPath}" --no-playlist`, { stdio: 'inherit' });
        downloadSuccess = true;
        console.log("✅ Descarga finalizada.");
      } catch (err) {
        console.error("❌ Error descargando con yt-dlp:", err.message);
      }
    }

    // C. Procesamiento y corte con FFmpeg usando la duración final sincronizada
    if (downloadSuccess && fs.existsSync(tempVideoPath)) {
      console.log(`✂️ Recortando y adaptando video a vertical (1080x1920)...`);
      try {
        // Escalar y hacer crop a vertical 1080x1920, descartando el audio original para mayor velocidad y robustez
        // Usamos scale=-1:1920 para garantizar que la altura sea suficiente para el crop vertical
        execSync(`ffmpeg -ss 0 -t ${finalSceneDuration} -i "${tempVideoPath}" -vf "scale=-1:1920,crop=1080:1920" -c:v libx264 -an "${finalVideoPath}" -y`, { stdio: 'ignore' });
        console.log("✅ Video adaptado correctamente.");
        // Limpiar archivo temporal
        if (fs.existsSync(tempVideoPath)) {
          fs.unlinkSync(tempVideoPath);
        }
      } catch (err) {
        console.error("❌ Error al recortar con FFmpeg:", err.message);
        downloadSuccess = false; // Forzar generación de fallback si falla FFmpeg
      }
    }

    // Fallback: Si no se pudo descargar o recortar, generar un video de prueba con la duración final sincronizada
    if (!downloadSuccess || !fs.existsSync(finalVideoPath)) {
      console.log("⚠️ Generando video de prueba (fallback) con FFmpeg...");
      try {
        // Generar un video de prueba con tono azul oscuro/cyberpunk
        execSync(`ffmpeg -f lavfi -i color=c=0x0e0e0f:s=1080x1920:r=30 -t ${finalSceneDuration} -c:v libx264 -pix_fmt yuv420p "${finalVideoPath}" -y`, { stdio: 'ignore' });
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
  
  // Inyectar estado de voice mock en el plan
  plan.isVoiceMock = isVoiceMock;
  if (isVoiceMock) {
    console.log("ℹ️ Detectado uso de Voice Mock (ElevenLabs deshabilitado o sin cuota). Se configurará música y video desmutado.");
  }

  try {
    console.log(`Compilando video final a: ${outputVideoPath}`);
    // Pasar los props del plan y la duración total a través de CLI
    execSync(`npx remotion render Root.tsx NexoGamingVideo "${outputVideoPath}" --props='${JSON.stringify({ plan })}' --duration=${totalFrames} --overwrite`, { stdio: 'inherit' });
    console.log(`\n🎉 --- RENDERIZADO COMPLETADO CON ÉXITO --- 🎉`);
    console.log(`Video disponible en: /${outputVideoName}`);

    // 5. Subir a Cloudflare R2 y guardar la URL en la base de datos
    const r2Url = await uploadToR2(outputVideoPath, newsId);
    if (r2Url) {
      console.log(`💾 Actualizando base de datos en Supabase con la URL del video...`);
      const { error: updateError } = await supabase
        .from('published_news')
        .update({ video_url: r2Url })
        .eq('id', newsId);

      if (updateError) {
        console.error("❌ Error al actualizar video_url en la base de datos:", updateError.message);
      } else {
        console.log("✅ Base de datos actualizada con éxito.");
      }
    }

    // Enviar video o su URL de R2 a Telegram
    await uploadToTelegram(outputVideoPath, newsItem.title, r2Url);
  } catch (err) {
    console.error("❌ Error durante el renderizado de Remotion o subida a R2:", err.message);
    process.exit(1);
  }
}

async function uploadToR2(videoPath, newsId) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    console.warn("⚠️ Advertencia: Faltan credenciales de Cloudflare R2 en el entorno. Se omite la subida.");
    return null;
  }

  console.log(`📤 Subiendo video a Cloudflare R2 (${bucketName})...`);
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
    }
  });

  const fileStream = fs.createReadStream(videoPath);
  const key = `news_${newsId}.mp4`;

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileStream,
      ContentType: 'video/mp4'
    }));

    const fileUrl = `${publicUrl.replace(/\/$/, '')}/${key}`;
    console.log(`✅ Video subido con éxito a R2: ${fileUrl}`);
    return fileUrl;
  } catch (err) {
    console.error("❌ Error al subir video a Cloudflare R2:", err.message);
    return null;
  }
}

async function uploadToTelegram(videoPath, title, r2Url) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("⚠️ Advertencia: TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no están configurados. Se omite el envío a Telegram.");
    return;
  }

  // Verificar tamaño del archivo
  let fileSizeMb = 0;
  if (fs.existsSync(videoPath)) {
    const stats = fs.statSync(videoPath);
    fileSizeMb = stats.size / (1024 * 1024);
    console.log(`- Tamaño del video a enviar: ${fileSizeMb.toFixed(2)} MB`);
  }

  const caption = `🎮 *¡Nuevo video listo de Nexo Gaming News!* 🎮\n\n*Título:* ${title}\n\n🎬 Formato optimizado para TikTok, Reels y Shorts. ¡Descárgalo y publícalo!`;

  // Si el video pesa más de 49MB y tenemos R2 URL, enviar como link para no fallar
  if (fileSizeMb > 49 && r2Url) {
    console.log(`⚠️ El video supera el límite de 50MB de Telegram bots (${fileSizeMb.toFixed(2)} MB). Enviando URL de Cloudflare R2...`);
    const messageText = `${caption}\n\n📥 *Descargar Video en Alta Calidad:* \n🔗 [Click aquí para ver o descargar el video](${r2Url})`;
    try {
      const { spawnSync } = require('child_process');
      const result = spawnSync('curl', [
        '-s',
        '-F', `chat_id=${chatId}`,
        '-F', `text=${messageText}`,
        '-F', 'parse_mode=Markdown',
        '-F', 'disable_web_page_preview=false',
        `https://api.telegram.org/bot${token}/sendMessage`
      ], { encoding: 'utf8' });

      const responseText = result.stdout || '';
      let parsed;
      try { parsed = JSON.parse(responseText); } catch { parsed = null; }

      if (parsed && parsed.ok) {
        console.log("✅ Enlace del video enviado a Telegram con éxito.");
      } else {
        throw new Error(parsed?.description || 'Error al enviar texto a Telegram');
      }
    } catch (err) {
      console.error("❌ Error al enviar enlace a Telegram:", err.message);
    }
    return;
  }

  console.log(`📤 Enviando video compilado a Telegram...`);
  try {
    const { spawnSync } = require('child_process');
    const result = spawnSync('curl', [
      '-s',
      '-F', `chat_id=${chatId}`,
      '-F', `video=@${videoPath}`,
      '-F', `caption=${caption}`,
      '-F', 'parse_mode=Markdown',
      `https://api.telegram.org/bot${token}/sendVideo`
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    const responseText = result.stdout || '';
    let parsed;
    try { parsed = JSON.parse(responseText); } catch { parsed = null; }

    if (parsed && parsed.ok) {
      console.log("✅ Video enviado a Telegram con éxito. message_id:", parsed.result?.message_id);
    } else {
      console.error("❌ Telegram API respondió con error. Intentando enviar como enlace de R2 fallback...");
      if (r2Url) {
        // Fallback inmediato enviando el link
        const messageText = `${caption}\n\n📥 *Descargar Video (R2 Fallback):* \n🔗 ${r2Url}`;
        spawnSync('curl', [
          '-s',
          '-F', `chat_id=${chatId}`,
          '-F', `text=${messageText}`,
          '-F', 'parse_mode=Markdown',
          `https://api.telegram.org/bot${token}/sendMessage`
        ]);
        console.log("✅ Enlace fallback enviado a Telegram.");
      } else {
        throw new Error(parsed?.description || 'Respuesta no-ok de Telegram');
      }
    }
  } catch (err) {
    console.error("❌ Error al enviar video a Telegram:", err.message);
  }
}

run();

