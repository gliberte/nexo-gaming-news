"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "../context";
import { 
  getDashboardRssFeedsAction, 
  getCreatorNewsAction, 
  importCreatorNewsAction 
} from "../actions";

export default function FeedDiscoveryPage() {
  const router = useRouter();
  const { activeProfile } = useDashboard();

  // Tabs: "feed" (RSS Discovery) or "projects" (My Drafts)
  const [activeTab, setActiveTab] = useState<"feed" | "projects">("feed");
  
  // Data lists
  const [rssItems, setRssItems] = useState<any[]>([]);
  const [draftItems, setDraftItems] = useState<any[]>([]);
  
  // Loading states
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("ALL");

  // Source selection states
  const GAMING_SOURCES = [
    "IGN",
    "Polygon",
    "Kotaku",
    "GameSpot",
    "Eurogamer",
    "IGN YouTube",
    "GameSpot YouTube"
  ];

  const MUSIC_SOURCES = [
    "Pitchfork",
    "Stereogum",
    "Consequence"
  ];

  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState<string | null>(null);

  const isMusic = activeProfile.niche === "music";
  const tags = isMusic
    ? ["ALL", "ROCK", "POP", "HIPHOP", "INDIE", "LATIN", "RETRO", "REVIEWS"]
    : ["ALL", "RPG", "FPS", "XBOX", "NINTENDO", "PLAYSTATION", "PC", "TRAILER"];

  // Fetch Feeds for a specific source
  const fetchSourceFeed = async (sourceName: string) => {
    setLoadingFeed(true);
    setLoadingSource(sourceName);
    setSelectedSource(sourceName);
    try {
      const items = await getDashboardRssFeedsAction(12, activeProfile.niche || "gaming", sourceName);
      setRssItems(items || []);
    } catch (err) {
      console.error(`Error loading RSS feed for ${sourceName}:`, err);
    } finally {
      setLoadingFeed(false);
      setLoadingSource(null);
    }
  };

  // Fetch Projects
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const items = await getCreatorNewsAction(activeProfile.id);
      setDraftItems(items || []);
    } catch (err) {
      console.error("Error loading creator projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Trigger loading on mount or activeProfile change
  useEffect(() => {
    setRssItems([]);
    setSelectedSource(null);
    fetchProjects();
  }, [activeProfile.id]);

  // Handler to import RSS as draft
  const handleGenerateVideo = async (item: any) => {
    setGeneratingId(item.link);
    try {
      const response = await importCreatorNewsAction(
        activeProfile.id,
        item.title,
        item.link,
        item.platform || "RSS Ingestion",
        activeProfile.niche || "gaming"
      );
      
      if (response && response.success) {
        // Redirect to scene editor
        router.push(`/dashboard/editor/${response.id}`);
      }
    } catch (err) {
      alert("Error al generar el borrador de video. Inténtalo de nuevo.");
      console.error(err);
    } finally {
      setGeneratingId(null);
    }
  };

  // In-memory filter logic
  const filteredRssItems = rssItems.filter(item => {
    const matchesSearch = 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.contentSnippet?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTag === "ALL") return matchesSearch;
    const matchesTag = 
      item.title?.toUpperCase().includes(selectedTag) || 
      item.contentSnippet?.toUpperCase().includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const filteredDraftItems = draftItems.filter(item => {
    return item.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Formatting date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Reciente";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Feed Discovery</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Monitorea noticias en tiempo real e impórtalas instantáneamente como borradores de video CaaS.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar noticias o proyectos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <span className="absolute right-4 top-3 text-zinc-500 text-sm">🔍</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-zinc-800/80 gap-6">
        <button
          onClick={() => setActiveTab("feed")}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === "feed"
              ? "text-purple-400"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {isMusic ? "🎵 RSS Music Feed" : "📰 RSS Gaming Feed"}
          {activeTab === "feed" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === "projects"
              ? "text-purple-400"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          🎬 Mis Videos Creados ({draftItems.length})
          {activeTab === "projects" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>
      </div>

      {/* RSS Ingestor content */}
      {activeTab === "feed" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Column: Feed Content (col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedSource ? (
              <div className="bg-[#121215] border border-zinc-800/60 rounded-2xl p-16 text-center border-dashed border-zinc-850 flex flex-col items-center justify-center min-h-[300px]">
                <div className="text-4xl mb-4">👈</div>
                <h3 className="font-bold text-base text-zinc-300 mb-2">Selecciona una fuente a la derecha</h3>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                  Elige uno de los canales RSS o de YouTube en el panel lateral para explorar noticias recientes de {isMusic ? "música" : "videojuegos"}.
                </p>
              </div>
            ) : (
              <>
                {/* Categories / Tags Filter */}
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                        selectedTag === tag
                          ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                          : "bg-[#18181c] text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {loadingFeed ? (
                  <div className="text-center py-20 bg-[#121215] border border-zinc-800/60 rounded-2xl">
                    <div className="inline-block w-8 h-8 border-4 border-purple-500/25 border-t-purple-500 rounded-full animate-spin mb-4" />
                    <p className="text-zinc-500 text-sm font-mono">
                      Cargando noticias de {selectedSource}...
                    </p>
                  </div>
                ) : filteredRssItems.length === 0 ? (
                  <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-12 text-center">
                    <p className="text-zinc-500 text-sm">No se encontraron noticias para los filtros actuales.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredRssItems.map((item) => (
                      <div 
                        key={item.link}
                        className="bg-[#121215] border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-950/5 transition-all group"
                      >
                        <div>
                          {/* Image preview */}
                          {item.imageUrl && (
                            <div className="h-40 w-full overflow-hidden border-b border-zinc-800/60 relative">
                              <img 
                                src={item.imageUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
                            </div>
                          )}

                          <div className="p-6">
                            {/* Header: Platform & Date */}
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/20 border border-cyan-800/35">
                                {item.platform || (isMusic ? "Music Feed" : "Gaming Feed")}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-500">
                                {formatDate(item.pubDate)}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-base text-zinc-200 mb-2.5 leading-snug group-hover:text-zinc-100 transition-colors">
                              {item.title}
                            </h3>

                            {/* Description excerpt */}
                            <p className="text-zinc-400 text-xs line-clamp-3 leading-relaxed">
                              {item.contentSnippet || "Haz clic en Generar para que nuestro motor de IA analice este enlace y cree el guion."}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-zinc-800/60 p-6 pt-4 flex items-center justify-between mt-auto">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
                          >
                            Ver Fuente ↗
                          </a>

                          {item.isProcessed ? (
                            <button
                              onClick={() => router.push(`/dashboard/editor/${item.dbId}`)}
                              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#18181c] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all"
                            >
                              Abrir Editor 🎬
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGenerateVideo(item)}
                              disabled={generatingId !== null}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                generatingId === item.link
                                  ? "bg-purple-900/40 text-purple-400 cursor-not-allowed border border-purple-500/20"
                                  : "bg-purple-600 hover:bg-purple-500 text-zinc-950 hover:scale-[1.02] shadow-md shadow-purple-950/10"
                              }`}
                            >
                              {generatingId === item.link ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-purple-400/25 border-t-purple-400 rounded-full animate-spin" />
                                  Generando...
                                </>
                              ) : (
                                "Generar Video ⚡"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: News Sources Panel (col-span-1) */}
          <div className="lg:col-span-1 space-y-4 bg-[#121215] border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 font-mono">
                📡 Fuentes RSS ({isMusic ? "Música" : "Gaming"})
              </h3>
            </div>
            
            <div className="space-y-2">
              {(isMusic ? MUSIC_SOURCES : GAMING_SOURCES).map((source) => {
                const isSelected = selectedSource === source;
                const isLoading = loadingSource === source;
                return (
                  <div
                    key={source}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-purple-950/30 border-purple-500/40 text-purple-300"
                        : "bg-[#18181c] border-zinc-800/80 text-zinc-400 hover:border-zinc-755 hover:text-zinc-200"
                    }`}
                  >
                    <button
                      onClick={() => fetchSourceFeed(source)}
                      disabled={loadingFeed}
                      className="flex-1 text-left text-xs font-bold truncate focus:outline-none py-1"
                    >
                      {source}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchSourceFeed(source);
                      }}
                      disabled={loadingFeed}
                      className={`p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors flex items-center justify-center ${
                        isLoading ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                      title={`Actualizar ${source}`}
                    >
                      {isLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-purple-400/25 border-t-purple-400 rounded-full animate-spin" />
                      ) : (
                        <span className="text-xs">🔄</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Projects list content */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          {loadingProjects ? (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 border-4 border-purple-500/25 border-t-purple-500 rounded-full animate-spin mb-4" />
              <p className="text-zinc-500 text-sm font-mono">Cargando tus borradores...</p>
            </div>
          ) : filteredDraftItems.length === 0 ? (
            <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-16 text-center">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="font-bold text-base text-zinc-300 mb-2">Aún no tienes borradores</h3>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto mb-6">
                Busca noticias en el RSS Feed y haz clic en "Generar Video" para crear tu primer proyecto de marca.
              </p>
              <button
                onClick={() => setActiveTab("feed")}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-zinc-950 font-semibold transition-all"
              >
                Explorar Noticias
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDraftItems.map((project) => {
                const plan = project.production_plan?.production_plan || project.production_plan;
                const statusColor = 
                  project.status === "published" ? "text-emerald-400 bg-emerald-950/20 border-emerald-800/30" : 
                  project.status === "draft" ? "text-amber-400 bg-amber-950/20 border-amber-800/30" : 
                  "text-zinc-400 bg-zinc-950/20 border-zinc-800/30";

                return (
                  <div 
                    key={project.id}
                    className="bg-[#121215] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition-all group"
                  >
                    <div>
                      {/* Image preview */}
                      {project.image_url && (
                        <div className="h-40 w-full overflow-hidden border-b border-zinc-800/60 relative">
                          <img 
                            src={project.image_url} 
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
                        </div>
                      )}

                      <div className="p-6">
                        {/* Top bar status */}
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${statusColor}`}>
                            {project.status === "published" ? "Renderizado" : "Borrador"}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            {formatDate(project.created_at)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-base text-zinc-200 mb-2 leading-snug truncate">
                          {project.title}
                        </h3>

                        {/* Video clips count / Soundtrack name */}
                        <div className="text-[11px] text-zinc-500 font-mono space-y-1">
                          <div>🎞️ {plan?.scenes?.length || 0} Escenas de video</div>
                          <div>🎵 Soundtrack: {plan?.soundtrack?.song_title || "Por defecto"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA buttons */}
                    <div className="border-t border-zinc-800/60 p-6 pt-4 flex items-center justify-between gap-4">
                      {project.status === "published" ? (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/status/${project.id}`)}
                            className="text-xs text-purple-400 hover:underline font-mono"
                          >
                            Descargar Video ↗
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/editor/${project.id}`)}
                            className="px-3 py-1.5 rounded-lg text-xs bg-[#18181c] border border-zinc-800 hover:bg-zinc-800 text-zinc-200 transition-all"
                          >
                            Re-editar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/status/${project.id}`)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
                          >
                            Ver Estado
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/editor/${project.id}`)}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-zinc-950 transition-all hover:scale-[1.02]"
                          >
                            Editar & Renderizar ⚡
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
