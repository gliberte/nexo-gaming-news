"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDashboard } from "../../context";
import { 
  getCreatorNewsItemAction, 
  saveCreatorSceneScriptAction, 
  renderCreatorVideoAction 
} from "../../actions";

export default function StudioEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { activeProfile } = useDashboard();
  const newsId = unwrappedParams.id;

  // State
  const [loading, setLoading] = useState(true);
  const [newsItem, setNewsItem] = useState<any | null>(null);
  const [productionPlan, setProductionPlan] = useState<any | null>(null);
  
  // Script / captions state
  const [tweet, setTweet] = useState("");
  const [instagramCaption, setInstagramCaption] = useState("");
  
  // Editor view states
  const [activeSceneId, setActiveSceneId] = useState<number | null>(null);
  const [showBrandingOverlay, setShowBrandingOverlay] = useState(true);
  const [socialTab, setSocialTab] = useState<"x" | "insta" | "tiktok">("x");

  // Renders states
  const [saving, setSaving] = useState(false);
  const [rendering, setRendering] = useState(false);

  // Load News Item
  useEffect(() => {
    const loadItem = async () => {
      setLoading(true);
      try {
        const item = await getCreatorNewsItemAction(newsId);
        if (item) {
          setNewsItem(item);
          setTweet(item.tweet || "");
          setInstagramCaption(item.instagram_caption || "");
          
          const plan = item.production_plan;
          setProductionPlan(plan);

          const innerPlan = plan?.production_plan || plan;
          if (innerPlan?.scenes && innerPlan.scenes.length > 0) {
            setActiveSceneId(innerPlan.scenes[0].scene_id);
          }
        }
      } catch (err) {
        console.error("Error loading news item:", err);
      } finally {
        setLoading(false);
      }
    };
    loadItem();
  }, [newsId]);

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="inline-block w-8 h-8 border-4 border-purple-500/25 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 text-sm font-mono">Cargando borrador del estudio...</p>
      </div>
    );
  }

  if (!newsItem || !productionPlan) {
    return (
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-12 text-center">
        <h3 className="font-bold text-lg text-zinc-300 mb-2">No se encontró el borrador</h3>
        <p className="text-zinc-500 text-sm mb-6">El video solicitado no existe o no pudo ser cargado.</p>
        <Link href="/dashboard/feed" className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300">
          Volver al Feed
        </Link>
      </div>
    );
  }

  const innerPlan = productionPlan.production_plan || productionPlan;
  const scenes = innerPlan?.scenes || [];

  // Mutations
  const handleSceneTextChange = (sceneId: number, value: string) => {
    const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
    const target = updatedPlan.production_plan || updatedPlan;
    
    const idx = target.scenes.findIndex((s: any) => s.scene_id === sceneId);
    if (idx !== -1) {
      target.scenes[idx].narrative_text = value;
      setProductionPlan(updatedPlan);
    }
  };

  const handlePresentationModeChange = (sceneId: number, mode: string) => {
    const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
    const target = updatedPlan.production_plan || updatedPlan;
    
    const idx = target.scenes.findIndex((s: any) => s.scene_id === sceneId);
    if (idx !== -1) {
      if (!target.scenes[idx].visual_resource) {
        target.scenes[idx].visual_resource = {};
      }
      target.scenes[idx].visual_resource.presentation_mode = mode;
      setProductionPlan(updatedPlan);
    }
  };

  const handleObjectPositionChange = (sceneId: number, pos: string) => {
    const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
    const target = updatedPlan.production_plan || updatedPlan;
    
    const idx = target.scenes.findIndex((s: any) => s.scene_id === sceneId);
    if (idx !== -1) {
      if (!target.scenes[idx].visual_resource) {
        target.scenes[idx].visual_resource = {};
      }
      target.scenes[idx].visual_resource.object_position = pos;
      setProductionPlan(updatedPlan);
    }
  };

  const handleUseAiVoiceChange = (checked: boolean) => {
    const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
    const target = updatedPlan.production_plan || updatedPlan;
    target.use_ai_voice = checked;
    setProductionPlan(updatedPlan);
  };

  // Save changes
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveCreatorSceneScriptAction(
        newsId,
        activeProfile.id,
        productionPlan,
        tweet,
        instagramCaption
      );
    } catch (err) {
      alert("Error al guardar borrador.");
    } finally {
      setSaving(false);
    }
  };

  // Save and Render
  const handlePublishAndExport = async () => {
    setRendering(true);
    try {
      // 1. Guardar primero
      await saveCreatorSceneScriptAction(
        newsId,
        activeProfile.id,
        productionPlan,
        tweet,
        instagramCaption
      );
      
      // 2. Ejecutar renderizado
      const res = await renderCreatorVideoAction(
        newsId,
        activeProfile.id,
        activeProfile
      );

      if (res && res.success) {
        router.push(`/dashboard/status/${newsId}`);
      }
    } catch (err) {
      alert("Error al iniciar el renderizado del video.");
      console.error(err);
    } finally {
      setRendering(false);
    }
  };

  const currentScene = scenes.find((s: any) => s.scene_id === activeSceneId) || scenes[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-1">PROYECTO DE CREACIÓN CaaS</div>
          <h1 className="text-2xl font-bold text-zinc-100 truncate max-w-3xl leading-tight">
            {newsItem.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving || rendering}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#18181c] border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold transition-all"
          >
            {saving ? "Guardando..." : "Guardar Borrador"}
          </button>
          <button
            onClick={handlePublishAndExport}
            disabled={saving || rendering}
            className="px-6 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-zinc-950 font-bold transition-all shadow-lg shadow-purple-950/20"
          >
            {rendering ? "Exportando..." : "Publicar & Exportar ⚡"}
          </button>
        </div>
      </div>

      {/* Workspace Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Aspect Ratio Video Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 flex flex-col items-center">
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4 self-start w-full border-b border-zinc-800 pb-3">
              🎬 PREVISUALIZADOR DEL MONITOR
            </h2>

            {/* Video Frame container (9:16) */}
            <div className="w-56 aspect-[9/16] bg-[#09090b] rounded-2xl border-2 border-zinc-800 relative overflow-hidden flex flex-col justify-between p-4 shadow-xl mb-4">
              
              {/* Overlay: Branding elements */}
              {showBrandingOverlay && (
                <>
                  {/* Top floating HUD Logo */}
                  <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
                    <img 
                      src={activeProfile.logo_url} 
                      alt="branding logo"
                      className="w-8 h-8 rounded-full object-cover border"
                      style={{ borderColor: activeProfile.primary_color }}
                    />
                  </div>

                  {/* Corner neon frames */}
                  <div className="absolute inset-3 border pointer-events-none rounded-lg" style={{ borderColor: `${activeProfile.primary_color}1a` }} />
                  <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l" style={{ borderColor: activeProfile.primary_color }} />
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r" style={{ borderColor: activeProfile.primary_color }} />
                  <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l" style={{ borderColor: activeProfile.primary_color }} />
                  <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r" style={{ borderColor: activeProfile.primary_color }} />
                </>
              )}

              {/* Background Mock Visuals (Based on layout selection) */}
              <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-950">
                {currentScene?.visual_resource?.presentation_mode === "blur_fit" ? (
                  <div className="w-full h-full flex flex-col relative justify-center bg-black">
                    {/* Blurred BG */}
                    <div className="absolute inset-0 bg-[#1b1b22] opacity-40 blur-md scale-110 flex items-center justify-center">
                      <div className="text-zinc-700 text-xs text-center font-mono">PANORAMIC WATERMARK BG</div>
                    </div>
                    {/* Centered video block */}
                    <div className="w-full aspect-video bg-zinc-900 border-y border-zinc-800/80 flex items-center justify-center relative z-10">
                      <span className="text-[10px] font-mono text-zinc-500">YouTube Original Clip</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-[#1c1c24] flex items-center justify-center">
                    <div className="text-center p-4">
                      <span className="text-[10px] font-mono text-purple-400 block mb-1">COVER AUTO CROP</span>
                      <span className="text-[9px] text-zinc-500 font-mono block">Align: {currentScene?.visual_resource?.object_position || "center"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic subtitle text mockup overlay */}
              {showBrandingOverlay && currentScene?.narrative_text && (
                <div className="z-10 text-center px-2 py-4 mb-2">
                  <p 
                    className="font-bold text-xs uppercase transition-all"
                    style={{
                      fontFamily: activeProfile.font_family === "Sora" ? "var(--font-sora)" : activeProfile.font_family === "Orbitron" ? "Orbitron, sans-serif" : "var(--font-inter)",
                      color: activeProfile.highlight_color,
                      textShadow: `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 4px 8px rgba(0,0,0,0.9)`
                    }}
                  >
                    {currentScene.narrative_text.split(" ").slice(0, 4).join(" ")}...
                  </p>
                </div>
              )}

              {/* Outro Watermark */}
              {showBrandingOverlay && (
                <div className="absolute bottom-4 left-0 right-0 text-center z-10 opacity-70">
                  <span className="text-[8px] font-mono text-zinc-400">@{activeProfile.watermark_text}</span>
                </div>
              )}
            </div>

            {/* Live Toggles */}
            <div className="w-full space-y-3 pt-3 border-t border-zinc-800/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Mostrar Branding de Marca</span>
                <input
                  type="checkbox"
                  checked={showBrandingOverlay}
                  onChange={(e) => setShowBrandingOverlay(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-800 text-purple-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Generar Voz de IA (ElevenLabs)</span>
                <input
                  type="checkbox"
                  checked={innerPlan?.use_ai_voice === true}
                  onChange={(e) => handleUseAiVoiceChange(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-800 text-purple-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Script Scene Editor Cards */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-5">
            <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-3">
              📝 EDICIÓN DE GUIÓN POR ESCENA ({scenes.length})
            </h2>

            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              {scenes.map((scene: any, index: number) => (
                <div
                  key={scene.scene_id}
                  onClick={() => setActiveSceneId(scene.scene_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    activeSceneId === scene.scene_id
                      ? "bg-purple-950/10 border-purple-500/35"
                      : "bg-[#18181c]/70 border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      ESCENA #{index + 1} ({scene.start_time_seconds}s - {scene.end_time_seconds}s)
                    </span>
                    
                    {/* Visual presentation buttons */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={scene.visual_resource?.presentation_mode || "cover"}
                        onChange={(e) => handlePresentationModeChange(scene.scene_id, e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 focus:outline-none"
                      >
                        <option value="cover">Cover Crop (Llenar)</option>
                        <option value="blur_fit">Blur-Fit (Original)</option>
                      </select>

                      {(scene.visual_resource?.presentation_mode || "cover") === "cover" && (
                        <select
                          value={scene.visual_resource?.object_position || "center"}
                          onChange={(e) => handleObjectPositionChange(scene.scene_id, e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 focus:outline-none"
                        >
                          <option value="center">Center</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <textarea
                    value={scene.narrative_text || ""}
                    onChange={(e) => handleSceneTextChange(scene.scene_id, e.target.value)}
                    rows={2}
                    placeholder="Locución narrada de la escena..."
                    className="w-full bg-[#121215] border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Social Copies Tabs */}
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex gap-4">
                {[
                  { id: "x", name: "𝕏 Post" },
                  { id: "insta", name: "Instagram Caption" },
                  { id: "tiktok", name: "TikTok Tags" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSocialTab(tab.id as any)}
                    className={`text-xs font-bold pb-2 transition-all relative ${
                      socialTab === tab.id
                        ? "text-purple-400"
                        : "text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    {tab.name}
                    {socialTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const val = socialTab === "x" ? tweet : socialTab === "insta" ? instagramCaption : `#gaming #noticias #nexogaming @${activeProfile.watermark_text}`;
                  navigator.clipboard.writeText(val);
                  alert("Copiado al portapapeles 📋");
                }}
                className="text-[10px] font-mono text-purple-400 hover:underline bg-purple-950/20 px-2 py-0.5 border border-purple-800/35 rounded"
              >
                Copiar 📋
              </button>
            </div>

            {socialTab === "x" && (
              <textarea
                value={tweet}
                onChange={(e) => setTweet(e.target.value)}
                rows={3}
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none"
                placeholder="Redacta la publicación para X/Twitter..."
              />
            )}

            {socialTab === "insta" && (
              <textarea
                value={instagramCaption}
                onChange={(e) => setInstagramCaption(e.target.value)}
                rows={3}
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none"
                placeholder="Redacta la publicación para Instagram..."
              />
            )}

            {socialTab === "tiktok" && (
              <div className="bg-[#18181c] border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-400 leading-relaxed">
                #gaming #noticias #videojuegos #news #{activeProfile.name.toLowerCase()} #{activeProfile.watermark_text.replace(/\./g, '')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
