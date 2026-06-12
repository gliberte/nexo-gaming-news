import { getSupabaseServerClient } from "../../../utils/supabase";
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import ReadingProgress from "../../components/ReadingProgress";

export const revalidate = 60; // Revalidate every 60 seconds

// Helper function to extract YouTube video ID
const getYoutubeVideoId = (url: string | null | undefined) => {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
};

// Props definition for App Router
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

  const cleanDescription = data.web_article
    ? data.web_article
        .replace(/[#*`_\[\]()\-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 155) + '...'
    : `Detalles completos sobre: ${data.title}`;

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
  const videoFileName = `news_${id}.mp4`;
  const videoLocalPath = path.join(process.cwd(), 'public', videoFileName);
  const hasLocalVideo = fs.existsSync(videoLocalPath);
  const hasVerticalVideo = !!item.video_url || hasLocalVideo;
  const videoSrc = item.video_url || `/${videoFileName}`;

  // Estimate reading time
  const getReadingTime = (text?: string) => {
    if (!text) return '2 min';
    const words = text.split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min`;
  };

  return (
    <main className="container" style={{ maxWidth: hasVerticalVideo ? '1150px' : '800px', transition: 'max-width 0.3s ease-in-out' }}>
      {/* Visual scroll reading progress bar */}
      <ReadingProgress />

      <nav style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
          <img src="/logo.jpg" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--primary-container)', flexShrink: 0 }} />
          <span className="label-caps" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>NEXO GAMING NEWS</span>
        </Link>
      </nav>

      <div className="article-layout" style={{ 
        display: 'grid', 
        gridTemplateColumns: hasVerticalVideo ? '1fr 340px' : '1fr', 
        gap: '32px',
        alignItems: 'start'
      }}>
        <article className="glass-card" style={{ padding: '0', overflow: 'hidden', margin: 0 }}>
          {videoId ? (
            <div className="video-container" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe 
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={item.title} 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>
          ) : item.image_url ? (
            <div className="article-image-container">
              <img 
                src={item.image_url} 
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : null}
          
          <div className="article-body">
            <div className="flex items-center justify-between mb-4">
              <div className="label-caps platform-tag" style={{ margin: 0 }}>
                {item.platform?.toLowerCase() === "manual" ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <img src="/logo.jpg" alt="NGM Logo" style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--primary-container)' }} />
                    <span>Editorial NGM</span>
                  </span>
                ) : (
                  item.platform
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant font-mono">
                <span>Tiempo de lectura: {getReadingTime(item.web_article)}</span>
                <span>{new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
            <h1 className="article-title">{item.title}</h1>
            
            {item.web_article && (
              <div className="markdown-content">
                <ReactMarkdown>{item.web_article}</ReactMarkdown>
              </div>
            )}

            <div style={{ marginTop: '48px', display: 'flex', gap: '16px', borderTop: '1px solid var(--outline-variant)', paddingTop: '24px' }}>
              {item.source_url && (
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
                  <span className="label-caps">LEER FUENTE ORIGINAL</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              )}
            </div>
          </div>
        </article>

        {hasVerticalVideo && (
          <aside className="video-aside retro-monitor sticky top-8 space-y-4">
            <div className="monitor-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="monitor-led"></span>
                <span className="label-caps" style={{ fontSize: '10px', color: 'var(--primary-container)' }}>VIDEO VERTICAL</span>
              </div>
              <span className="label-caps" style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.4)' }}>[ONLINE]</span>
            </div>
            
            <div className="relative rounded-lg overflow-hidden border border-outline-variant/60 shadow-2xl" style={{ aspectRatio: '9/16' }}>
              <video 
                src={videoSrc}
                controls
                autoPlay
                muted
                loop
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </aside>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .markdown-content h2 { margin-top: 24px; margin-bottom: 16px; color: var(--primary-container); font-size: 24px; }
        .markdown-content p { margin-bottom: 16px; }
        .markdown-content strong { color: var(--on-surface); font-weight: 700; }
        .markdown-content ul { margin-bottom: 16px; padding-left: 24px; }
        .markdown-content li { margin-bottom: 8px; }
        
        .retro-monitor {
          background: rgba(14, 14, 15, 0.85);
          border: 1px solid rgba(0, 240, 255, 0.3);
          padding: 16px;
          border-radius: 8px;
        }
        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.2);
          padding-bottom: 8px;
        }
        .monitor-led {
          width: 8px; height: 8px; background: #00ff00; border-radius: 50%;
          margin-right: 8px; box-shadow: 0 0 5px #00ff00;
        }
        
        @media (max-width: 900px) {
          .article-layout {
            grid-template-columns: 1fr !important;
          }
          .video-aside {
            position: static !important;
            max-width: 340px;
            margin: 0 auto 32px auto !important;
          }
        }
      `}} />
    </main>
  );
}
