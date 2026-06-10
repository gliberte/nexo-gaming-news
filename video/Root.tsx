import { Composition, registerRoot } from 'remotion';
import { NexoGamingVideo, NexoGamingCover } from './Composition';

export const Root = () => {
  return (
    <>
      <Composition
        id="NexoGamingVideo"
        component={NexoGamingVideo}
        durationInFrames={900} // Valor por defecto (30s @ 30fps), se calcula dinámicamente en el renderizador
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          plan: {
            soundtrack: {
              music_style: "Industrial oscuro",
              tempo: "Fast",
              volume_level: 0.12
            },
            scenes: []
          }
        }}
      />
      <Composition
        id="NexoGamingCover"
        component={NexoGamingCover}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: "¡TU BUILD ESTÁ ROTA!",
          imageUrl: ""
        }}
      />
    </>
  );
};

registerRoot(Root);
