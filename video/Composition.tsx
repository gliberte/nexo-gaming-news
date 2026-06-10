import React from 'react';
import { AbsoluteFill, Sequence, Video, Audio, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// Estilos de texto para hooks y subtítulos
const textStyles = {
  glitch: {
    fontFamily: "'Luckiest Guy', sans-serif",
    fontSize: '78px',
    color: '#ffffff',
    textShadow: '-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 6px 6px 0px #00ffff, -6px -6px 0px #ff0055',
    textTransform: 'uppercase' as const,
    fontWeight: '900',
    textAlign: 'center' as const,
    letterSpacing: '2px',
    lineHeight: '1.1',
  },
  neon_cyan: {
    fontFamily: "'Luckiest Guy', sans-serif",
    fontSize: '75px',
    color: '#00f0ff',
    textShadow: '-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 0 15px rgba(0, 240, 255, 0.8)',
    fontWeight: '800',
    textAlign: 'center' as const,
    letterSpacing: '1px',
    lineHeight: '1.1',
  },
  warning_red: {
    fontFamily: "'Luckiest Guy', sans-serif",
    fontSize: '75px',
    color: '#ff0033',
    textShadow: '-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 0 15px rgba(255, 0, 51, 0.8)',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    letterSpacing: '2px',
    lineHeight: '1.1',
  },
  bright_yellow: {
    fontFamily: "'Luckiest Guy', sans-serif",
    fontSize: '75px',
    color: '#fbff00',
    textShadow: '-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 0 15px rgba(251, 255, 0, 0.8)',
    fontWeight: '800' as const,
    textAlign: 'center' as const,
    lineHeight: '1.1',
  }
};

const textStylesMap: Record<string, React.CSSProperties> = textStyles;

// Componente para animar el texto de forma premium
const AnimatedText: React.FC<{ text: string; styleName: string }> = ({ text, styleName }) => {
  const frame = useCurrentFrame();
  const style = textStylesMap[styleName] || textStyles.bright_yellow;

  // Entrada: Slide up y Fade-in en los primeros 8 frames
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 8], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 6], [0.85, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      opacity,
      transform: `translateY(${translateY}px) scale(${scale})`,
      transition: 'transform 0.15s ease-out',
    }}>
      <h2 style={style}>{text}</h2>
    </div>
  );
};

// Estima la cantidad de líneas de un bloque de texto dado un ancho estimado en caracteres
const estimateLineCount = (text: string): number => {
  // Con Luckiest Guy a 60px y ancho de 920px (1080 - 160), 
  // estimamos un límite de unos 25 caracteres por línea.
  const charsPerLine = 25;
  const words = text.trim().split(/\s+/);
  if (words.length === 0 || words[0] === "") return 0;
  
  let lines = 1;
  let currentLineLength = 0;
  
  for (const word of words) {
    const wordLength = word.length;
    if (currentLineLength === 0) {
      currentLineLength = wordLength;
    } else if (currentLineLength + 1 + wordLength <= charsPerLine) {
      currentLineLength += 1 + wordLength;
    } else {
      lines++;
      currentLineLength = wordLength;
    }
  }
  return lines;
};

// Divide una frase/cláusula excesivamente larga para que no supere las 5 líneas
const splitSentenceIntoClauses = (sentence: string): string[] => {
  const lines = estimateLineCount(sentence);
  if (lines <= 5) {
    return [sentence];
  }
  
  // Dividir por comas, puntos y comas o dos puntos
  const parts = sentence.split(/([,;:])/);
  const rawClauses: string[] = [];
  let current = "";
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      current += parts[i];
    } else {
      current += parts[i];
      rawClauses.push(current.trim());
      current = "";
    }
  }
  if (current.trim() !== "") {
    rawClauses.push(current.trim());
  }

  // Agrupar las cláusulas resultantes sin exceder las 5 líneas
  const groupedClauses: string[] = [];
  let temp = "";
  for (const clause of rawClauses) {
    if (temp === "") {
      temp = clause;
    } else {
      const combined = temp + " " + clause;
      if (estimateLineCount(combined) <= 5) {
        temp = combined;
      } else {
        groupedClauses.push(temp);
        temp = clause;
      }
    }
  }
  if (temp !== "") {
    groupedClauses.push(temp);
  }
  return groupedClauses;
};

// Auxiliar para dividir por palabras si falla la separación por puntuación
const splitByWords = (text: string, maxLines = 5): string[] => {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  let currentWords: string[] = [];
  
  for (const word of words) {
    currentWords.push(word);
    if (estimateLineCount(currentWords.join(" ")) > maxLines) {
      currentWords.pop();
      chunks.push(currentWords.join(" "));
      currentWords = [word];
    }
  }
  if (currentWords.length > 0) {
    chunks.push(currentWords.join(" "));
  }
  return chunks;
};

const splitLongSentence = (sentence: string): string[] => {
  const initialClauses = splitSentenceIntoClauses(sentence);
  const finalClauses: string[] = [];
  
  for (const clause of initialClauses) {
    if (estimateLineCount(clause) > 5) {
      const wordSplits = splitByWords(clause, 5);
      finalClauses.push(...wordSplits);
    } else {
      finalClauses.push(clause);
    }
  }
  return finalClauses;
};

// Función auxiliar para dividir el texto en fragmentos que representen oraciones o cláusulas legibles
// Garantiza de forma determinista entre 3 y 5 líneas por párrafo formando siempre frases completas.
const splitTextIntoReadableSentences = (text: string): string[] => {
  // 1. Dividir por signos de puntuación de fin de oración (. ! ?)
  const rawSentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const sentences: string[] = [];
  
  // 2. Procesar cada oración para asegurar que ninguna exceda las 5 líneas
  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    
    const parts = splitLongSentence(trimmed);
    sentences.push(...parts);
  }

  // 3. Agrupar las oraciones consecutivamente buscando un tamaño balanceado <= 5 líneas
  const groups: string[] = [];
  let currentGroup = "";
  
  for (const sentence of sentences) {
    if (currentGroup === "") {
      currentGroup = sentence;
    } else {
      const combined = currentGroup + " " + sentence;
      const combinedLines = estimateLineCount(combined);
      
      if (combinedLines <= 5) {
        currentGroup = combined;
      } else {
        groups.push(currentGroup);
        currentGroup = sentence;
      }
    }
  }
  if (currentGroup !== "") {
    groups.push(currentGroup);
  }

  // 4. Intentar fusionar grupos con menos de 3 líneas de forma segura sin pasarse de 5 líneas
  for (let i = 0; i < groups.length; i++) {
    const lines = estimateLineCount(groups[i]);
    if (lines < 3) {
      // Intentar fusionar con el siguiente grupo
      if (i + 1 < groups.length) {
        const nextMerged = groups[i] + " " + groups[i+1];
        if (estimateLineCount(nextMerged) <= 5) {
          groups[i] = nextMerged;
          groups.splice(i + 1, 1);
          i--;
          continue;
        }
      }
      // Intentar fusionar con el grupo anterior
      if (i > 0) {
        const prevMerged = groups[i-1] + " " + groups[i];
        if (estimateLineCount(prevMerged) <= 5) {
          groups[i-1] = prevMerged;
          groups.splice(i, 1);
          i--;
          continue;
        }
      }
    }
  }

  return groups.map(g => g.trim()).filter(Boolean);
};

// Componente para resaltar palabras claves con estilo cyberpunk amarillo neón
const HighlightedText: React.FC<{ text: string }> = ({ text }) => {
  const keywords = [
    'ZELDA', 'NINTENDO', 'SWITCH', 'REMAKE', 'OCARINA', 'GAMEPLAY', 'UNREAL', 
    'ENGINE', 'XBOX', 'GAME', 'PASS', 'WWDC', 'APPLE', 'IPHONE', 'MAC', 
    'PLAYSTATION', 'PS5', 'SONY', 'MICROSOFT', 'CRISIS', 'PRECIOS', 'SUSCRIPTORES', 
    'TRAILER', 'OFICIAL', 'REVELADO', 'LANZAMIENTO', 'HYRULE', 'FANS', 'ESPERADO',
    'TIEMPOS', 'GRÁFICOS', 'ILUMINACIÓN', 'FÍSICAS', 'INMERSIÓN', 'DETALLE'
  ];

  const words = text.split(/(\s+)/); // Preservar espacios en blanco

  return (
    <>
      {words.map((part, index) => {
        if (part.trim() === '') {
          return <span key={index}>{part}</span>;
        }

        const cleanWord = part.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¡¿"']/g, "").toUpperCase();
        const isKeyword = keywords.includes(cleanWord);

        if (isKeyword) {
          return (
            <span 
              key={index} 
              style={{ 
                color: '#fbff00', // Amarillo neón
                textShadow: '-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 0 12px rgba(251, 255, 0, 0.6)',
              }}
            >
              {part}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

// Componente animado individual para cada fragmento de texto (alineado a la izquierda, 3-5 líneas)
const SubtitleChunk: React.FC<{ text: string; relativeFrame: number; framesPerChunk: number }> = ({ 
  text, 
  relativeFrame,
  framesPerChunk
}) => {
  const opacity = interpolate(relativeFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(relativeFrame, [0, Math.max(15, framesPerChunk)], [0.97, 1.0], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      fontFamily: "'Luckiest Guy', sans-serif",
      fontSize: '60px',
      color: '#ffffff',
      textAlign: 'left', // Alineado a la izquierda
      textTransform: 'uppercase',
      lineHeight: '1.2',
      textShadow: '-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 8px 16px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 240, 255, 0.2)',
      maxWidth: '100%',
      width: '100%', // Forzar ancho al 100% para que textAlign funcione correctamente
      margin: '0',
    }}>
      <HighlightedText text={text} />
    </div>
  );
};

// Componente contenedor para los subtítulos dinámicos de narración
const DynamicNarrativeSubtitles: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const chunks = splitTextIntoReadableSentences(text);
  const numChunks = chunks.length;
  const framesPerChunk = durationInFrames / numChunks;

  const activeChunkIndex = Math.min(
    Math.floor(frame / framesPerChunk),
    numChunks - 1
  );
  
  const activeText = chunks[activeChunkIndex] || '';
  const chunkStartFrame = Math.floor(activeChunkIndex * framesPerChunk);
  const relativeFrame = frame - chunkStartFrame;

  return (
    <div style={{
      position: 'absolute',
      bottom: '180px',
      left: '80px', // Margen izquierdo consistente
      right: '80px',
      display: 'flex',
      justifyContent: 'flex-start', // Flex start para alinear a la izquierda
      alignItems: 'center',
      zIndex: 6,
    }}>
      <SubtitleChunk 
        key={activeChunkIndex} // Resetea el componente al cambiar el chunk
        text={activeText} 
        relativeFrame={relativeFrame}
        framesPerChunk={framesPerChunk}
      />
    </div>
  );
};

// Componente para la barra de progreso
const ProgressBar = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  const widthPercent = (frame / durationInFrames) * 100;
  
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: '10px',
      width: `${widthPercent}%`,
      background: 'linear-gradient(90deg, #ff0055 0%, #00f0ff 100%)',
      boxShadow: '0 0 8px #00f0ff',
      zIndex: 10,
    }} />
  );
};

// Marcos cibernéticos e interfaz HUD
const CyberHUD = () => {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 5 }}>
      {/* Bordes Neon */}
      <div style={{
        position: 'absolute',
        inset: '30px',
        border: '1px solid rgba(0, 240, 255, 0.15)',
        boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.05)',
      }} />
      
      {/* Esquineros Neon */}
      <div style={{ position: 'absolute', top: '25px', left: '25px', width: '20px', height: '20px', borderTop: '3px solid #00f0ff', borderLeft: '3px solid #00f0ff' }} />
      <div style={{ position: 'absolute', top: '25px', right: '25px', width: '20px', height: '20px', borderTop: '3px solid #ff0055', borderRight: '3px solid #ff0055' }} />
      <div style={{ position: 'absolute', bottom: '35px', left: '25px', width: '20px', height: '20px', borderBottom: '3px solid #ff0055', borderLeft: '3px solid #ff0055' }} />
      <div style={{ position: 'absolute', bottom: '35px', right: '25px', width: '20px', height: '20px', borderBottom: '3px solid #00f0ff', borderRight: '3px solid #00f0ff' }} />

      {/* Marca de agua Nexo Gaming con Logo */}
      <div style={{
        position: 'absolute',
        top: '45px',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'rgba(14, 14, 15, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          padding: '8px 20px',
          borderRadius: '30px',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <img 
            src={require('./assets/logo.jpg')} 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%',
              border: '1px solid #00f0ff',
            }} 
          />
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '15px',
            color: '#ffffff',
            fontWeight: 900,
            letterSpacing: '3px',
            textShadow: '0 0 5px rgba(0, 240, 255, 0.5)',
          }}>NEXO GAMING</span>
        </div>
      </div>

      {/* Efecto de líneas CRT sutil */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
        backgroundSize: '100% 4px, 6px 100%',
      }} />
    </AbsoluteFill>
  );
};

export const NexoGamingVideo: React.FC<{ plan: any }> = ({ plan }) => {
  if (!plan || !plan.scenes || plan.scenes.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#0e0e0f', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: '#ffffff', fontFamily: 'Sora' }}>Cargando Plan...</h1>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0e0e0f' }}>
      {/* Importar fuentes de Google Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Orbitron:wght@500;800;900&family=Sora:wght@400;700;800&display=swap');
        `}
      </style>

      {/* Audio de Fondo (Soundtrack) */}
      <Audio 
        src={require('./assets/soundtrack.mp3')} 
        volume={plan.isVoiceMock ? 0.38 : (plan.soundtrack?.volume_level || 0.12)}
        loop
      />

      {/* Escenas Secuenciales */}
      {plan.scenes.map((scene: any) => {
        const startFrame = Math.round(scene.start_time_seconds * 30);
        const durationFrames = Math.round((scene.end_time_seconds - scene.start_time_seconds) * 30);
        
        return (
          <Sequence 
            key={scene.scene_id} 
            from={startFrame} 
            durationInFrames={durationFrames}
          >
            {/* Visual de la escena - desmutado sutil si falla ElevenLabs */}
            <Video 
              src={require(`./assets/scene_${scene.scene_id}_visual.mp4`)} 
              muted={!plan.isVoiceMock}
              volume={plan.isVoiceMock ? 0.22 : 0}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            
            {/* Audio de la voz (ElevenLabs TTS mock silencioso) */}
            <Audio 
              src={require(`./assets/scene_${scene.scene_id}_voice.mp3`)} 
              volume={plan.isVoiceMock ? 0 : 1.0}
            />

            {/* Subtítulo Dinámico overlay */}
            {scene.hook_settings?.screen_text_overlay && (
              <div style={{
                position: 'absolute',
                left: 0, right: 0,
                top: scene.hook_settings.dynamic_subtitles_placement === 'top_middle' ? '20%' : 
                     scene.hook_settings.dynamic_subtitles_placement === 'center_middle' ? '45%' : '75%',
                display: 'flex',
                justifyContent: 'center',
                padding: '0 50px',
                zIndex: 6,
              }}>
                <AnimatedText 
                  text={scene.hook_settings.screen_text_overlay} 
                  styleName={scene.hook_settings.text_style}
                />
              </div>
            )}

            {/* Subtítulo de Narración Completa (Dinámico y Animado) */}
            {scene.narrative_text && (
              <DynamicNarrativeSubtitles text={scene.narrative_text} />
            )}
          </Sequence>
        );
      })}

      {/* HUD Cibernético */}
      <CyberHUD />

      {/* Barra de progreso */}
      <ProgressBar />
    </AbsoluteFill>
  );
};

// Componente para la carátula o portada del video (1080x1920)
export const NexoGamingCover: React.FC<{ title: string; imageUrl?: string }> = ({ title, imageUrl }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0e0e0f', fontFamily: "'Luckiest Guy', sans-serif" }}>
      {/* Imagen de fondo con tinte Cyberpunk */}
      {imageUrl ? (
        <img 
          src={imageUrl} 
          style={{ 
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.5) contrast(1.15) saturate(1.2)',
          }} 
        />
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, #1f1a24 0%, #0e0e0f 100%)',
        }} />
      )}

      {/* Capas superpuestas Cyberpunk de color */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(0, 240, 255, 0.05) 0%, rgba(255, 0, 85, 0.05) 100%)',
      }} />

      {/* Marca de agua / Logo en la parte superior */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'rgba(14, 14, 15, 0.9)',
          border: '2px solid #00f0ff',
          padding: '12px 28px',
          borderRadius: '35px',
          boxShadow: '0 0 25px rgba(0, 240, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            fontWeight: 900,
            letterSpacing: '4px',
            textShadow: '0 0 8px rgba(0, 240, 255, 0.6)',
          }}>NEXO GAMING</span>
        </div>
      </div>

      {/* Título gigante y llamativo en el centro */}
      <div style={{
        position: 'absolute',
        inset: '0 60px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 5,
      }}>
        <h1 style={{
          fontSize: '95px',
          color: '#fbff00', // Amarillo neón
          textTransform: 'uppercase',
          lineHeight: '1.05',
          letterSpacing: '1px',
          textShadow: '-6px -6px 0 #000, 6px -6px 0 #000, -6px 6px 0 #000, 6px 6px 0 #000, 0 15px 30px rgba(0, 0, 0, 0.9), 0 0 25px rgba(251, 255, 0, 0.5)',
          margin: 0,
        }}>
          {title}
        </h1>
      </div>

      {/* Marco HUD decorativo */}
      <div style={{
        position: 'absolute',
        inset: '30px',
        border: '2px solid rgba(0, 240, 255, 0.25)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'absolute', top: '25px', left: '25px', width: '30px', height: '30px', borderTop: '4px solid #00f0ff', borderLeft: '4px solid #00f0ff' }} />
      <div style={{ position: 'absolute', top: '25px', right: '25px', width: '30px', height: '30px', borderTop: '4px solid #ff0055', borderRight: '4px solid #ff0055' }} />
      <div style={{ position: 'absolute', bottom: '25px', left: '25px', width: '30px', height: '30px', borderBottom: '4px solid #ff0055', borderLeft: '4px solid #ff0055' }} />
      <div style={{ position: 'absolute', bottom: '25px', right: '25px', width: '30px', height: '30px', borderBottom: '4px solid #00f0ff', borderRight: '4px solid #00f0ff' }} />
    </AbsoluteFill>
  );
};
