import React from 'react';
import { AbsoluteFill, Sequence, Video, Audio, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// Estilos de texto para hooks y subtítulos
const textStyles = {
  glitch: {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '68px',
    color: '#ffffff',
    textShadow: '3px 3px 0px #00ffff, -3px -3px 0px #ff0055',
    textTransform: 'uppercase' as const,
    fontWeight: '900',
    textAlign: 'center' as const,
    letterSpacing: '2px',
  },
  neon_cyan: {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '60px',
    color: '#00f0ff',
    textShadow: '0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 40px rgba(0, 240, 255, 0.5)',
    fontWeight: '800',
    textAlign: 'center' as const,
    letterSpacing: '1px',
  },
  warning_red: {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '65px',
    color: '#ff0033',
    textShadow: '0 0 10px #ff0033, 0 0 20px #ff0033, 0 0 30px rgba(255, 0, 51, 0.6)',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    letterSpacing: '2px',
  },
  bright_yellow: {
    fontFamily: 'Sora, sans-serif',
    fontSize: '60px',
    color: '#fbff00',
    textShadow: '0 0 8px rgba(251, 255, 0, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.8)',
    fontWeight: '800' as const,
    textAlign: 'center' as const,
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

// Componente para los subtítulos de narración
const NarrativeSubtitles: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '120px',
      left: '60px',
      right: '60px',
      display: 'flex',
      justifyContent: 'center',
      zIndex: 6,
    }}>
      <p style={{
        fontFamily: 'Sora, sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '1.4',
        textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 10px rgba(0,0,0,0.8)',
        padding: '14px 28px',
        background: 'rgba(14, 14, 15, 0.75)',
        borderRadius: '16px',
        border: '1px solid rgba(0, 240, 255, 0.15)',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
        margin: 0,
      }}>
        {text}
      </p>
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

      {/* Marca de agua Nexo Gaming */}
      <div style={{
        position: 'absolute',
        top: '45px',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'rgba(14, 14, 15, 0.75)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          padding: '6px 16px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0, 240, 255, 0.15)',
        }}>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '14px',
            color: '#00f0ff',
            fontWeight: 800,
            letterSpacing: '3px',
            textShadow: '0 0 5px rgba(0, 240, 255, 0.5)',
          }}>NEXO GAMING NEWS</span>
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
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;800;900&family=Sora:wght@400;700;800&display=swap');
        `}
      </style>

      {/* Audio de Fondo (Soundtrack) */}
      <Audio 
        src={require('./assets/soundtrack.mp3')} 
        volume={plan.soundtrack?.volume_level || 0.12}
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
            {/* Visual de la escena */}
            <Video 
              src={require(`./assets/scene_${scene.scene_id}_visual.mp4`)} 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            
            {/* Audio de la voz (ElevenLabs TTS mock) */}
            <Audio 
              src={require(`./assets/scene_${scene.scene_id}_voice.mp3`)} 
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

            {/* Subtítulo de Narración Completa */}
            {scene.narrative_text && (
              <NarrativeSubtitles text={scene.narrative_text} />
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
