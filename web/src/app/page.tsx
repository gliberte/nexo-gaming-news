import { getSupabaseServerClient } from "../utils/supabase";
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const supabase = getSupabaseServerClient();
  
  const { data: newsItems, error } = await supabase
    .from("published_news")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching news:", error);
  }

  // Function to extract youtube video ID from youtube URL
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <main className="container">
      <header className="brand-header">
        <img 
          src="/logo.jpg" 
          alt="Nexo Gaming News Logo" 
          className="brand-logo"
        />
        <div>
          <div className="label-caps" style={{ color: 'var(--primary-container)', marginBottom: '8px' }}>Gamer Vanguard Network</div>
          <h1 style={{ margin: 0 }}>Nexo<wbr/>Gaming<wbr/>News</h1>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: '8px', marginBottom: 0 }}>La precisión técnica y el análisis más profundo de la industria de los videojuegos.</p>
        </div>
      </header>

      {(!newsItems || newsItems.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--on-surface-variant)' }}>
          <p>Sincronizando con los servidores... No hay noticias en la base de datos.</p>
        </div>
      ) : (
        <div className="bento-grid">
          {newsItems.map((item, index) => {
            const videoId = getYoutubeVideoId(item.youtube_url);
            
            return (
              <article key={item.id} className="bento-item glass-card">
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
                  <div className="card-image-container">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : null}
                
                <div className="news-content">
                  <div className="label-caps platform-tag">
                    {item.platform === "manual" ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <img src="/logo.jpg" alt="NGM Logo" style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--primary-container)' }} />
                        <span>NGM</span>
                      </span>
                    ) : (
                      item.platform
                    )}
                  </div>
                  <Link href={`/noticia/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 style={{ cursor: 'pointer' }}>{item.title}</h2>
                  </Link>
                  
                  {item.web_article && (
                    <div style={{ marginTop: '16px', color: 'var(--on-surface)' }}>
                      <p style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 3, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                      }}>
                        {/* Como ahora tenemos la página de detalle, aquí solo mostramos el primer párrafo como extracto (eliminando formato markdown básico) */}
                        {item.web_article.replace(/[#*]/g, '')}
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: '24px', display: 'flex', gap: '16px', borderTop: '1px solid var(--outline-variant)', paddingTop: '16px' }}>
                    <Link 
                      href={`/noticia/${item.id}`}
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
                      <span className="label-caps">LEER ANÁLISIS</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  );
}
