import { getSupabaseServerClient } from "../../../utils/supabase";
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate every 60 seconds

// Helper function to extract YouTube video ID
const getYoutubeVideoId = (url: string | null | undefined) => {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
};

// Definición de Props para App Router en Next.js 15+ (params es Promise)
type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("published_news")
    .select("title, web_article, image_url, youtube_url")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: 'Noticia no encontrada' };
  }

  // Limpiar formato markdown y acortar para la descripción del previo
  const cleanDescription = data.web_article
    ? data.web_article
        .replace(/[#*`_\[\]()\-]/g, '') // Eliminar caracteres de formato markdown
        .replace(/\s+/g, ' ')           // Normalizar espacios
        .trim()
        .substring(0, 155) + '...'
    : `Detalles completos sobre: ${data.title}`;

  // Obtener imagen del artículo o miniatura de YouTube si no hay imagen propia
  let imageUrl = data.image_url;
  if (!imageUrl && data.youtube_url) {
    const videoId = getYoutubeVideoId(data.youtube_url);
    if (videoId) {
      imageUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  const titleText = `${data.title} - NexoGamingNews`;

  return {
    title: titleText,
    description: cleanDescription,
    openGraph: {
      title: titleText,
      description: cleanDescription,
      type: 'article',
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description: cleanDescription,
      images: imageUrl ? [imageUrl] : [],
    }
  };
}

export default async function NoticiaPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  
  const { data: item, error } = await supabase
    .from("published_news")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  const videoId = getYoutubeVideoId(item.youtube_url);

  return (
    <main className="container" style={{ maxWidth: '800px' }}>
      <nav style={{ marginBottom: '32px' }}>
        <Link 
          href="/" 
          style={{ 
            color: 'var(--primary-container)', 
            textDecoration: 'none', 
            fontFamily: 'var(--font-jetbrains)',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span className="label-caps">VOLVER AL INICIO</span>
        </Link>
      </nav>

      <article className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {videoId ? (
          <div className="video-container" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="YouTube video player" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
          </div>
        ) : item.image_url ? (
          <div style={{ width: '100%', height: '400px', borderBottom: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <img 
              src={item.image_url} 
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : null}
        
        <div style={{ padding: '32px' }}>
          <div className="label-caps platform-tag">{item.platform}</div>
          <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>{item.title}</h1>
          
          {item.web_article && (
            <div 
              style={{ 
                marginTop: '24px', 
                color: 'var(--on-surface)', 
                fontSize: '18px',
                lineHeight: '1.8'
              }}
              className="markdown-content"
            >
              <ReactMarkdown>{item.web_article}</ReactMarkdown>
            </div>
          )}

          <div style={{ marginTop: '48px', display: 'flex', gap: '16px', borderTop: '1px solid var(--outline-variant)', paddingTop: '24px' }}>
            <a 
              href={item.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'var(--primary)', 
                textDecoration: 'none', 
                fontFamily: 'var(--font-jetbrains)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="label-caps">LEER FUENTE ORIGINAL EN {item.platform.toUpperCase()}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>
      </article>

      <style dangerouslySetInnerHTML={{__html: `
        .markdown-content h2 { margin-top: 24px; margin-bottom: 16px; color: var(--primary-container); font-size: 24px; }
        .markdown-content p { margin-bottom: 16px; }
        .markdown-content strong { color: var(--on-surface); font-weight: 700; }
        .markdown-content ul { margin-bottom: 16px; padding-left: 24px; }
        .markdown-content li { margin-bottom: 8px; }
      `}} />
    </main>
  );
}
