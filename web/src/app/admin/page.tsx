"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdminDataAction } from "./data-actions";
import { updateNewsStatusAction, processManualNewsAction, fetchRssFeedsAction } from "./actions";

// Simulación determinista de autores basada en el ID del artículo
const AUTHORS = [
  { 
    name: "Admin_Zero", 
    role: "Lead Editor", 
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfUtj2db14KoRFBdUU10tOAvENkF_Y_uUUYRdPzSNhfeBigwnMsCuNfiTRPFGJFX7kDB3nnVgbegOlVwhv3tgV_Q7Yeq2wrULWd4fOTBUEn4A9vRogRBZ5Mm6tzRaG_MKY3HYgsLGt7sXNi-1HJPyBnSbQc-WDjBkCrPpAj5SCb29Lf9Fs0zxtsqQJ1Y9MrgELu9TGZS4R391D4CKZSis11NtWDZc-7lqEwgvDEw8ivkDrDRTIWNgPsraB9W5Oy2h6k5IH6zrbxlM" 
  },
  { 
    name: "H. Gibson", 
    role: "Staff Writer", 
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWvrRow-Hox-6H5WBwTxh5cMPNtqXsLFNuRxq95aA0gjK2V0ytvfqDr3-3lbc0VXiYZz_qfQrxiF0pbLcFSw1Dmn9sBuSdWsz_BFJJ2xIn55gfUudidryjUicLxjIhMaHrOOpNBpyotTxBty37cw9qwF6Wm5ujiWIEXO95JJRkBIFkDSshLw2u8mXssT6PmNNeJvqtXs6zQF9hPgSXi_fmNnu_uHXCuUcrHV0wK3NhB-Xr8fE-rX5kQj-tLwCKgNVDmc3yWo838hE" 
  },
  { 
    name: "K. Dick", 
    role: "Tech Analyst", 
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCxzKWeW17E6N9hUZ-QD40nhr5AH_zUJVZU5WyeOZ0eZpnRJUtYHcJb8l7Nm0mOnRYYUnVs7_4w3-ra7PssYq6dwubNrrr-tOodC7j-4lizOYM7ncaRX3RCKGfjMf619UWshNaCGM6nAKouXZsq5u787NdhdNDMnSkiDN8az1-V5IV9MRtGEDS97UcG-2iewYcUr4zoMa2eYZgk_X7n64wyF60Q71Z6QjsvWgDg5c7-ZjvklYDlS87_SIZppU_ALDuohNUFRK7I95s" 
  }
];

const getArticleAuthor = (id: string) => {
  if (!id) return AUTHORS[0];
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return AUTHORS[sum % AUTHORS.length];
};

export default function AdminDashboard() {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros del lado del cliente
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [authorFilter, setAuthorFilter] = useState("All Authors");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para procesamiento manual
  const [manualTitle, setManualTitle] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualNiche, setManualNiche] = useState("music");
  const [isProcessingManual, setIsProcessingManual] = useState(false);
  const [manualSuccessMessage, setManualSuccessMessage] = useState<string | null>(null);
  const [manualErrorMessage, setManualErrorMessage] = useState<string | null>(null);


  // Estados para feeds RSS
  const [rssArticles, setRssArticles] = useState<any[]>([]);
  const [isLoadingRss, setIsLoadingRss] = useState(false);
  const [rssError, setRssError] = useState<string | null>(null);
  const [processingRssLink, setProcessingRssLink] = useState<string | null>(null);

  const handleManualProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = sessionStorage.getItem("admin_password");
    if (!pass) {
      setManualErrorMessage("Error de sesión. Por favor, vuelve a ingresar la contraseña.");
      return;
    }
    
    setIsProcessingManual(true);
    setManualSuccessMessage(null);
    setManualErrorMessage(null);
    
    try {
      const result = await processManualNewsAction(pass, manualTitle, manualUrl, "Manual", manualNiche);
      if (result && result.success) {
        setManualSuccessMessage("¡Noticia/Anécdota procesada y guardada con éxito! Revisa la notificación en Telegram.");
        setManualTitle("");
        setManualUrl("");
        loadData(pass);
      }
    } catch (err: any) {
      setManualErrorMessage("Error al procesar la noticia: " + (err.message || "Fallo en la comunicación."));
      console.error(err);
    } finally {
      setIsProcessingManual(false);
    }
  };

  const loadRssFeeds = async (pass: string) => {
    setIsLoadingRss(true);
    setRssError(null);
    try {
      const result = await fetchRssFeedsAction(pass, 8); // Cargar las últimas 8 noticias
      if (result && result.success) {
        setRssArticles(result.articles || []);
      }
    } catch (err: any) {
      console.error("Error cargando feeds RSS:", err);
      setRssError(err.message || "Fallo al conectar con la Edge Function para obtener feeds.");
    } finally {
      setIsLoadingRss(false);
    }
  };

  const handleImportRssArticle = async (article: any) => {
    const pass = sessionStorage.getItem("admin_password");
    if (!pass) return;

    setProcessingRssLink(article.link);
    setManualSuccessMessage(null);
    setManualErrorMessage(null);

    try {
      const result = await processManualNewsAction(pass, article.title, article.link, article.platform);
      if (result && result.success) {
        setManualSuccessMessage(`¡Noticia "${article.title}" importada y procesada con éxito!`);
        // Marcar la noticia local como procesada
        setRssArticles(prev => prev.map(item => 
          item.link === article.link ? { ...item, isProcessed: true } : item
        ));
        loadData(pass); // recargar listado principal
      }
    } catch (err: any) {
      setManualErrorMessage(`Error al importar "${article.title}": ` + (err.message || "Fallo en la Edge Function"));
    } finally {
      setProcessingRssLink(null);
    }
  };

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("admin_password");
    if (savedPassword) {
      loadData(savedPassword);
      loadRssFeeds(savedPassword);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Escuchar cambios en la barra de búsqueda global del header
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get("search") || "");
      setCurrentPage(1);
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);

    // También creamos un intervalo corto para detectar cambios en pushState
    const interval = setInterval(handleUrlChange, 500);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      clearInterval(interval);
    };
  }, []);

  const loadData = async (pass: string) => {
    try {
      const result = await getAdminDataAction(pass);
      if (result && !result.success) {
        setError(result.error || "Error desconocido.");
        if (result.error === "Contraseña incorrecta.") {
          sessionStorage.removeItem("admin_password");
        }
        return;
      }
      setNews(result.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar los datos: " + (err.message || "Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const pass = sessionStorage.getItem("admin_password");
    if (!pass) return;
    try {
      await updateNewsStatusAction(pass, id, newStatus);
      loadData(pass);
    } catch (err: any) {
      alert("Error al actualizar el estado: " + err.message);
    }
  };

  const handlePublishAll = () => {
    alert("Publishing all drafts...");
  };

  // Métricas generales dinámicas
  const totalArticles = news.length;
  const pendingReviews = news.filter(n => n.status === "draft").length;
  const activePublished = news.filter(n => n.status === "published").length;

  // Filtrado de noticias del lado del cliente
  const filteredNews = news.filter((item) => {
    // Filtro por Estado
    if (statusFilter !== "All Status") {
      if (item.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
    }
    // Filtro por Autor
    if (authorFilter !== "All Authors") {
      const author = getArticleAuthor(item.id);
      if (author.name !== authorFilter) {
        return false;
      }
    }
    // Filtro por Búsqueda (Título)
    if (searchQuery.trim() !== "") {
      if (!item.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  // Cálculos de Paginación
  const totalItems = filteredNews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

  if (isLoading) {
    return <div className="p-8 text-on-surface">Cargando Dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-error">{error}</div>;
  }

  return (
    <div className="p-8">
      {/* Dashboard Header / Analytics Bento */}
      <section className="mb-10">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">System Overview</h3>
            <p className="font-body-md text-on-surface-variant">Real-time status of the Nexo editorial pipeline.</p>
          </div>
          <button 
            onClick={handlePublishAll}
            className="px-6 py-2 bg-primary text-on-primary font-bold text-label-caps font-label-caps hover:bg-primary/80 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">publish</span>
            Publish All
          </button>
        </div>

        <div className="bento-grid">
          {/* Stat Card 1 */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 glass-panel p-6 cyber-border">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Total Articles</p>
            <div className="flex items-end justify-between">
              <h4 className="font-stats-num text-[32px] font-extrabold text-primary">{totalArticles}</h4>
              <span className="text-tertiary-fixed text-[12px] font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
              </span>
            </div>
            <div className="mt-4 h-1 bg-outline-variant w-full overflow-hidden">
              <div className="h-full bg-primary w-full shadow-[0_0_8px_#00dbe9]"></div>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 glass-panel p-6 cyber-border">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Pending Reviews</p>
            <div className="flex items-end justify-between">
              <h4 className="font-stats-num text-[32px] font-extrabold text-secondary">{pendingReviews}</h4>
              <span className="text-error text-[12px] font-bold flex items-center gap-0.5 animate-pulse">
                <span className="material-symbols-outlined text-[14px]">warning</span> High Priority
              </span>
            </div>
            <div className="mt-4 h-1 bg-outline-variant w-full overflow-hidden">
              <div className="h-full bg-secondary shadow-[0_0_8px_#ecb2ff]" style={{ width: `${Math.max((pendingReviews / (totalArticles || 1)) * 100, 15)}%` }}></div>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 glass-panel p-6 cyber-border">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Active Live Feeds</p>
            <div className="flex items-end gap-3">
              <h4 className="font-stats-num text-[32px] font-extrabold text-tertiary-fixed">
                {activePublished < 10 ? `0${activePublished}` : activePublished}
              </h4>
              <div className="mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-error rounded-full animate-pulse-red"></span>
                <span className="text-[10px] text-error font-bold font-label-caps">LIVE</span>
              </div>
            </div>
            <div className="mt-4 h-1 bg-outline-variant w-full overflow-hidden">
              <div className="h-full bg-tertiary-fixed shadow-[0_0_8px_#79ff5b]" style={{ width: `${Math.max((activePublished / (totalArticles || 1)) * 100, 15)}%` }}></div>
            </div>
          </div>

          {/* Stat Card 4 (Traffic Load / Chart) */}
          <div className="col-span-12 lg:col-span-3 glass-panel p-6 cyber-border overflow-hidden relative">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Traffic Load</p>
            <div className="h-12 flex items-end gap-1">
              <div className="flex-1 bg-primary/20 h-[40%]" style={{ boxShadow: "0 0 10px rgba(0,219,233,0.1)" }}></div>
              <div className="flex-1 bg-primary/30 h-[60%]"></div>
              <div className="flex-1 bg-primary/40 h-[90%]"></div>
              <div className="flex-1 bg-primary/50 h-[70%]"></div>
              <div className="flex-1 bg-primary/60 h-[100%] shadow-[0_0_10px_#00dbe9]"></div>
              <div className="flex-1 bg-primary/40 h-[80%]"></div>
            </div>
            <p className="text-[10px] font-label-caps text-on-surface-variant mt-2 text-right">99.9% Uptime</p>
          </div>
        </div>
      </section>

      {/* RSS Ingestion and Selection Panel */}
      <section className="mb-10 glass-panel p-6 rounded-xl border border-outline-variant bg-surface-container-lowest/30">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-headline-md text-[18px] font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">rss_feed</span>
            Feeds de Ingesta Recientes (Curación)
          </h4>
          <button
            onClick={() => {
              const pass = sessionStorage.getItem("admin_password");
              if (pass) loadRssFeeds(pass);
            }}
            disabled={isLoadingRss}
            className="px-4 py-1.5 border border-outline-variant text-on-surface-variant font-label-caps text-[12px] hover:border-primary hover:text-primary transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoadingRss ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {isLoadingRss ? 'Cargando Feeds...' : 'Sincronizar Feeds'}
          </button>
        </div>

        {rssError && (
          <div className="p-4 mb-4 bg-error/10 border border-error/20 rounded text-xs text-error font-bold flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {rssError}
          </div>
        )}

        {isLoadingRss ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-panel p-4 border border-outline-variant/30 animate-pulse flex flex-col gap-3 h-[280px]">
                <div className="w-full h-32 bg-outline-variant/20 rounded"></div>
                <div className="h-4 bg-outline-variant/20 rounded w-1/3"></div>
                <div className="h-6 bg-outline-variant/20 rounded w-full"></div>
                <div className="mt-auto h-8 bg-outline-variant/20 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : rssArticles.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant font-body-md">
            No se encontraron noticias en los feeds. Haz clic en Sincronizar para reintentar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rssArticles.map((article, index) => {
              // Estilo de colores determinista para las plataformas/fuentes
              const platformColors: Record<string, string> = {
                IGN: "bg-red-500/10 border-red-500/30 text-red-400",
                Polygon: "bg-pink-500/10 border-pink-500/30 text-pink-400",
                Kotaku: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
                GameSpot: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
                Eurogamer: "bg-orange-500/10 border-orange-500/30 text-orange-400",
              };
              const colorClass = platformColors[article.platform] || "bg-primary/10 border-primary/30 text-primary-light";

              return (
                <div 
                  key={index} 
                  className="glass-panel border border-outline-variant/30 hover:border-primary/50 transition-all flex flex-col h-[320px] rounded overflow-hidden bg-surface-container-low/20 group"
                >
                  {/* Thumbnail / Image Section */}
                  <div className="w-full h-32 bg-surface-container-highest relative overflow-hidden flex-shrink-0 border-b border-outline-variant/20">
                    {article.imageUrl ? (
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-outline opacity-40 bg-surface-container-highest">
                        <span className="material-symbols-outlined text-[36px]">photo_library</span>
                      </div>
                    )}
                    {/* Platform Tag */}
                    <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 border rounded uppercase ${colorClass}`}>
                      {article.platform}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex flex-col flex-grow gap-2">
                    <p className="text-[9px] text-on-surface-variant/60 font-mono">
                      {new Date(article.pubDate).toLocaleDateString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-bold font-body-md text-on-surface hover:text-primary transition-colors line-clamp-3 leading-snug outline-none"
                    >
                      {article.title}
                    </a>
                  </div>

                  {/* Actions / Footer */}
                  <div className="p-4 pt-0 mt-auto flex items-center justify-between border-t border-outline-variant/10">
                    {article.isProcessed ? (
                      <div className="w-full py-1.5 bg-outline-variant/10 border border-outline-variant/20 text-center rounded text-[10px] font-bold text-on-surface-variant/40 font-label-caps uppercase flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        Procesada
                      </div>
                    ) : (
                      <button
                        onClick={() => handleImportRssArticle(article)}
                        disabled={processingRssLink !== null}
                        className="w-full py-1.5 bg-primary/20 hover:bg-primary/35 text-primary-light border border-primary/30 hover:border-primary/50 text-center rounded text-[10px] font-bold font-label-caps uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span className={`material-symbols-outlined text-[14px] ${processingRssLink === article.link ? 'animate-spin' : ''}`}>
                          {processingRssLink === article.link ? 'refresh' : 'bolt'}
                        </span>
                        {processingRssLink === article.link ? 'Importando...' : 'Importar con IA'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Import Manual News Form */}
      <section className="mb-10 glass-panel p-6 rounded-xl border border-outline-variant bg-surface-container-lowest/30">
        <h4 className="font-headline-md text-[18px] font-bold text-primary flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[20px]">dynamic_feed</span>
          Procesar Noticia Manualmente (IA)
        </h4>
        <form onSubmit={handleManualProcess} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider block">TÍTULO O NÚCLEO</label>
            <input 
              type="text" 
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Ej: La trompeta torcida de Dizzy..."
              className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded p-2 text-sm text-on-surface outline-none transition-colors h-[38px]"
              required
            />
          </div>
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider block">URL / ANÉCDOTA (TEXTO Y PROMPTS)</label>
            <textarea 
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Pega aquí la URL de la noticia o escribe directamente la anécdota y sus instrucciones..."
              className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded p-2 text-sm text-on-surface outline-none transition-colors h-[38px] min-h-[38px] max-h-[120px] resize-y custom-scrollbar"
              required
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider block">NICHO</label>
            <select
              value={manualNiche}
              onChange={(e) => setManualNiche(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded px-3 py-1.5 text-sm text-on-surface outline-none transition-colors h-[38px] cursor-pointer"
            >
              <option value="music">Música</option>
              <option value="gaming">Gaming</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button 
              type="submit"
              disabled={isProcessingManual}
              className="w-full py-2 bg-secondary hover:bg-secondary/80 text-on-secondary font-bold text-label-caps font-label-caps disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer h-[38px] rounded border border-[#ecb2ff]/20 shadow-[0_0_8px_rgba(236,178,255,0.15)]"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              {isProcessingManual ? 'Procesando...' : 'Procesar con IA'}
            </button>
          </div>
        </form>
        {manualSuccessMessage && (
          <p className="mt-3 text-xs text-tertiary-fixed font-bold flex items-center gap-1.5 animate-pulse">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            {manualSuccessMessage}
          </p>
        )}
        {manualErrorMessage && (
          <p className="mt-3 text-xs text-error font-bold flex items-center gap-1.5 animate-pulse">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {manualErrorMessage}
          </p>
        )}
      </section>

      {/* Article List Table Section */}
      <section className="glass-panel overflow-hidden border border-outline-variant rounded-xl">
        {/* Filter Bar */}
        <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
          <h4 className="font-headline-md text-[20px] font-bold text-on-surface">Recent Articles</h4>
          
          <div className="flex flex-wrap gap-3">
            {/* Status Selector */}
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface-container border border-outline-variant text-on-surface-variant font-label-caps text-[12px] px-4 py-2 rounded-sm focus:border-primary focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {/* Author Selector */}
            <select 
              value={authorFilter}
              onChange={(e) => { setAuthorFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface-container border border-outline-variant text-on-surface-variant font-label-caps text-[12px] px-4 py-2 rounded-sm focus:border-primary focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="All Authors">All Authors</option>
              <option value="Admin_Zero">Admin_Zero</option>
              <option value="H. Gibson">H. Gibson</option>
              <option value="K. Dick">K. Dick</option>
            </select>

            <button 
              onClick={() => alert("Extra filters placeholder")}
              className="px-4 py-2 border border-outline-variant text-on-surface-variant font-label-caps text-[12px] hover:border-primary hover:text-primary transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              More Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Title & Platform</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Author</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Date</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Status</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {currentItems.map((item) => {
                const author = getArticleAuthor(item.id);
                return (
                  <tr key={item.id} className="hover:bg-surface-bright/30 transition-colors group">
                    {/* Title & Platform */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-container-highest flex-shrink-0 relative overflow-hidden rounded border border-outline-variant/20">
                          {item.image_url ? (
                            <img 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                              src={item.image_url} 
                              alt={item.title} 
                            />
                          ) : item.youtube_url ? (
                            <div className="w-full h-full flex items-center justify-center bg-error/20 text-error">
                              <span className="material-symbols-outlined">play_circle</span>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline">
                              <span className="material-symbols-outlined">article</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Link href={`/admin/editor/${item.id}`}>
                            <p className="font-body-md font-bold text-primary group-hover:underline cursor-pointer line-clamp-1">{item.title}</p>
                          </Link>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary uppercase">
                              {item.platform?.toLowerCase() === "manual" ? "GENERAL" : (item.platform || "GENERAL")}
                            </span>
                            {item.status === "published" && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-secondary/10 border border-secondary/20 text-secondary uppercase">
                                WEB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Author (Deterministic mapping) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <img 
                          className="w-6 h-6 rounded-full border border-primary/25 object-cover" 
                          src={author.avatar} 
                          alt={author.name}
                        />
                        <div>
                          <p className="font-body-md text-on-surface leading-none">{author.name}</p>
                          <p className="text-[11px] text-on-surface-variant/70 mt-0.5">{author.role}</p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <p className="font-body-md text-on-surface">
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-[12px] text-on-surface-variant opacity-60">
                        {new Date(item.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {item.status === "published" && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary-container/10 border border-tertiary-container/30 rounded-full">
                          <span className="w-1.5 h-1.5 bg-tertiary-container rounded-full"></span>
                          <span className="text-[11px] font-bold text-tertiary-container font-label-caps uppercase">Published</span>
                        </div>
                      )}
                      {item.status === "draft" && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-container/10 border border-secondary-container/30 rounded-full">
                          <span className="w-1.5 h-1.5 bg-secondary-container rounded-full"></span>
                          <span className="text-[11px] font-bold text-secondary-container font-label-caps uppercase">Draft</span>
                        </div>
                      )}
                      {item.status === "archived" && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-outline-variant/10 border border-outline-variant/30 rounded-full">
                          <span className="w-1.5 h-1.5 bg-outline rounded-full"></span>
                          <span className="text-[11px] font-bold text-outline font-label-caps uppercase">Archived</span>
                        </div>
                      )}
                      {!["published", "draft", "archived"].includes(item.status) && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          <span className="text-[11px] font-bold text-primary font-label-caps uppercase">{item.status || "Unknown"}</span>
                        </div>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {item.status === "archived" ? (
                          <>
                            <button 
                              title="Restaurar artículo"
                              onClick={() => handleUpdateStatus(item.id, "draft")}
                              className="text-on-surface-variant hover:text-primary transition-colors p-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">history</span>
                            </button>
                            <Link href={`/admin/editor/${item.id}`} className="text-on-surface-variant hover:text-primary transition-colors p-2 inline-block cursor-pointer">
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link href={`/admin/editor/${item.id}`} className="text-on-surface-variant hover:text-primary transition-colors p-2 inline-block cursor-pointer">
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </Link>
                            <button 
                              title="Archivar artículo"
                              onClick={() => handleUpdateStatus(item.id, "archived")}
                              className="text-on-surface-variant hover:text-error transition-colors p-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    No articles found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination bar */}
        <div className="p-6 bg-surface-container-lowest flex justify-between items-center border-t border-outline-variant">
          <p className="font-label-caps text-[11px] text-on-surface-variant">
            Showing {totalItems > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} Articles
          </p>

          {totalPages > 1 && (
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center border transition-all font-label-caps text-[12px] cursor-pointer ${
                    currentPage === page 
                      ? "bg-primary text-on-primary border-primary font-bold shadow-[0_0_8px_rgba(0,219,233,0.3)]" 
                      : "border-outline-variant text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
