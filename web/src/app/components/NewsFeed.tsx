'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Clock, ExternalLink } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  web_article?: string;
  image_url?: string;
  youtube_url?: string;
  video_url?: string;
  platform?: string;
  created_at: string;
  source_url?: string;
  status: string;
}

interface NewsFeedProps {
  initialNewsItems: NewsItem[];
}

export default function NewsFeed({ initialNewsItems }: NewsFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');

  // Extract YouTube video ID
  const getYoutubeVideoId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  };

  // Extract existing platforms dynamically (filtering out empty ones) to keep tabs 100% functional
  const platforms = useMemo(() => {
    const list = new Set<string>();
    initialNewsItems.forEach(item => {
      if (item.platform) {
        list.add(item.platform.toUpperCase());
      }
    });
    return Array.from(list).sort();
  }, [initialNewsItems]);

  // Format platform name for display
  const formatPlatform = (platform?: string) => {
    if (!platform) return 'General';
    if (platform.toLowerCase() === 'manual') return 'Editorial NGM';
    return platform;
  };

  // Filter items based on search query and platform selection
  const filteredItems = useMemo(() => {
    return initialNewsItems.filter(item => {
      const matchesPlatform = 
        selectedPlatform === 'ALL' || 
        (item.platform && item.platform.toUpperCase() === selectedPlatform);

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        item.title.toLowerCase().includes(searchLower) || 
        (item.web_article && item.web_article.toLowerCase().includes(searchLower));

      return matchesPlatform && matchesSearch;
    });
  }, [initialNewsItems, searchQuery, selectedPlatform]);

  // The first item in the filtered list will be the "Hero" (featured) article
  const heroItem = filteredItems[0];
  const gridItems = filteredItems.slice(1);

  // Helper to format date
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Estimate reading time based on word count
  const getReadingTime = (text?: string) => {
    if (!text) return '2 min';
    const words = text.split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min`;
  };

  return (
    <div className="space-y-8">
      {/* Controls Bar: Search & Filter Tabs */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 glass-card bg-surface-container/40" style={{ clipPath: 'none', borderRadius: '8px' }}>
        {/* Dynamic platform selector tabs */}
        <div className="filter-tabs-container">
          <button 
            onClick={() => setSelectedPlatform('ALL')}
            className={`filter-tab ${selectedPlatform === 'ALL' ? 'active' : ''}`}
          >
            Todos
          </button>
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`filter-tab ${selectedPlatform === platform ? 'active' : ''}`}
            >
              {formatPlatform(platform)}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="cyber-search-container">
          <span className="cyber-search-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cyber-search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-on-surface-variant hover:text-primary-container text-xs font-mono"
            >
              [X]
            </button>
          )}
        </div>
      </section>

      {/* No results state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16 glass-card" style={{ padding: '64px' }}>
          <p className="text-on-surface-variant mb-4">No se encontraron artículos que coincidan con tu búsqueda.</p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedPlatform('ALL'); }}
            className="filter-tab active"
            style={{ display: 'inline-block' }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* news content rendering */}
      {filteredItems.length > 0 && (
        <div className="space-y-10">
          
          {/* Featured Article: HERO SECTION */}
          {heroItem && (
            <section className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Media Side */}
                <div className="lg:col-span-7 relative min-h-[300px] md:min-h-[400px] bg-black">
                  {getYoutubeVideoId(heroItem.youtube_url) ? (
                    <div className="w-full h-full relative aspect-video lg:absolute lg:top-0 lg:left-0 lg:w-full lg:h-full">
                      <iframe 
                        src={`https://www.youtube.com/embed/${getYoutubeVideoId(heroItem.youtube_url)}?rel=0&modestbranding=1`}
                        title={heroItem.title}
                        className="w-full h-full border-none absolute top-0 left-0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : heroItem.image_url ? (
                    <img 
                      src={heroItem.image_url} 
                      alt={heroItem.title}
                      className="w-full h-full object-cover lg:absolute lg:top-0 lg:left-0"
                      style={{ transition: 'transform 0.5s ease' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest text-on-surface-variant">
                      <span>Nexo Gaming News</span>
                    </div>
                  )}
                </div>

                {/* Content Side */}
                <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-br from-surface-container-high/90 to-surface-container-lowest">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="platform-tag" style={{ margin: 0 }}>
                        {formatPlatform(heroItem.platform)}
                      </span>
                      <div className="flex items-center gap-4 text-xs text-on-surface-variant font-mono">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {getReadingTime(heroItem.web_article)}
                        </span>
                        <span>{formatDate(heroItem.created_at)}</span>
                      </div>
                    </div>

                    <Link href={`/noticia/${heroItem.id}`}>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-white hover:text-primary-container transition-colors mb-4 line-clamp-3 leading-tight" style={{ cursor: 'pointer' }}>
                        {heroItem.title}
                      </h2>
                    </Link>

                    {heroItem.web_article && (
                      <p className="text-on-surface-variant text-sm md:text-base line-clamp-4 mb-6 leading-relaxed">
                        {heroItem.web_article.replace(/[#*`]/g, '')}
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-outline-variant flex items-center justify-between">
                    <Link 
                      href={`/noticia/${heroItem.id}`}
                      className="text-primary-container hover:text-primary transition-colors flex items-center gap-2 font-mono text-sm group"
                    >
                      <span className="label-caps tracking-widest">LEER ANÁLISIS DETALLADO</span>
                      <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {heroItem.source_url && (
                      <a 
                        href={heroItem.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-on-surface-variant hover:text-white flex items-center gap-1 transition-colors font-mono"
                      >
                        Fuente <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Rest of the articles: BENTO GRID */}
          {gridItems.length > 0 && (
            <section className="bento-grid">
              {gridItems.map((item) => {
                const videoId = getYoutubeVideoId(item.youtube_url);
                return (
                  <article key={item.id} className="bento-item glass-card flex flex-col justify-between">
                    <div>
                      {/* Media Header */}
                      {videoId ? (
                        <div className="video-container" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <iframe 
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                            title={item.title} 
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : item.image_url ? (
                        <div className="card-image-container relative">
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}

                      {/* Card Body */}
                      <div className="news-content">
                        <div className="flex items-center justify-between mb-3">
                          <span className="platform-tag" style={{ margin: 0 }}>
                            {formatPlatform(item.platform)}
                          </span>
                          <span className="text-xs text-on-surface-variant font-mono">
                            {getReadingTime(item.web_article)}
                          </span>
                        </div>

                        <Link href={`/noticia/${item.id}`}>
                          <h3 className="text-lg md:text-xl font-bold text-white hover:text-primary-container transition-colors mb-3 line-clamp-2 leading-snug" style={{ cursor: 'pointer' }}>
                            {item.title}
                          </h3>
                        </Link>

                        {item.web_article && (
                          <p className="text-on-surface-variant text-sm line-clamp-3 leading-relaxed mb-4">
                            {item.web_article.replace(/[#*`]/g, '')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 md:p-6 pt-0 border-t border-outline-variant/40 flex items-center justify-between">
                      <Link 
                        href={`/noticia/${item.id}`}
                        className="text-primary-container hover:text-primary transition-colors flex items-center gap-1 font-mono text-xs group"
                      >
                        <span className="label-caps">LEER ANÁLISIS</span>
                        <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <span className="text-[11px] text-on-surface-variant font-mono">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

        </div>
      )}
    </div>
  );
}
