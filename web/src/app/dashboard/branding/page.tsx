"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../context";

export default function BrandingStudioPage() {
  const { activeProfile, updateActiveProfile } = useDashboard();

  // State local initialized with activeProfile values
  const [title, setTitle] = useState("");
  const [watermark, setWatermark] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8b5cf6");
  const [highlightColor, setHighlightColor] = useState("#fbff00");
  const [logoUrl, setLogoUrl] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [niche, setNiche] = useState<"gaming" | "music">("gaming");
  
  // Save confirmation notification
  const [showNotification, setShowNotification] = useState(false);

  // Sync state when activeProfile changes
  useEffect(() => {
    setTitle(activeProfile.title || "");
    setWatermark(activeProfile.watermark_text || "");
    setPrimaryColor(activeProfile.primary_color || "#8b5cf6");
    setHighlightColor(activeProfile.highlight_color || "#fbff00");
    setLogoUrl(activeProfile.logo_url || "");
    setFontFamily(activeProfile.font_family || "Inter");
    setNiche(activeProfile.niche || "gaming");
  }, [activeProfile.id]);

  // Handle Save
  const handleSave = () => {
    updateActiveProfile({
      title,
      watermark_text: watermark,
      primary_color: primaryColor,
      highlight_color: highlightColor,
      logo_url: logoUrl,
      font_family: fontFamily,
      niche: niche
    });
    
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Subtitle Live Preview word animation
  const previewWords = niche === "music" ? [
    { text: "EL", highlight: false },
    { text: "SOLO", highlight: true },
    { text: "DE", highlight: false },
    { text: "GUITARRA", highlight: true },
    { text: "FUE", highlight: false },
    { text: "GRABADO", highlight: false },
    { text: "IMPROVISANDO", highlight: true }
  ] : [
    { text: "NUEVO", highlight: false },
    { text: "REMAKE", highlight: true },
    { text: "DE", highlight: false },
    { text: "ZELDA", highlight: true },
    { text: "SE", highlight: false },
    { text: "VE", highlight: false },
    { text: "INCREÍBLE", highlight: true }
  ];

  const [activeWordIndex, setActiveWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % previewWords.length);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Branding Studio</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Personaliza el estilo visual de tus videos. Los cambios se aplicarán automáticamente a todas tus exportaciones.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-950/20 transition-all hover:scale-[1.02]"
        >
          Guardar Configuración 💾
        </button>
      </div>

      {/* Save Notification Alert */}
      {showNotification && (
        <div className="fixed top-24 right-8 z-50 bg-emerald-500 text-zinc-950 px-5 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 border border-emerald-400 animate-slide-in">
          <span>✓</span> ¡Branding de {activeProfile.name} guardado con éxito!
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Fields - left */}
        <div className="lg:col-span-7 bg-[#121215] border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-zinc-200 border-b border-zinc-800 pb-4">Detalles de Marca</h2>

          {/* Title & Watermark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Título de Canal/Outro</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. RetroZone"
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Marca de Agua / URL</label>
              <input
                type="text"
                value={watermark}
                onChange={(e) => setWatermark(e.target.value)}
                placeholder="Ej. retrozone.tv"
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">URL del Logotipo (Imagen Cuadrada)</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-[11px] text-zinc-500">Inserta la URL directa de tu avatar o marca. Se mostrará en el centro del outro y como HUD flotante.</p>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Tipografía Subtítulo</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="Sora">Sora (Gaming Tech)</option>
              <option value="Inter">Inter (Sleek Clean)</option>
              <option value="Orbitron">Orbitron (Sci-Fi Cyberpunk)</option>
              <option value="Luckiest Guy">Luckiest Guy (Comic Pop)</option>
            </select>
          </div>

          {/* Niche Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Nicho de Contenido</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value as any)}
              className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="gaming">Videojuegos (Gaming & Tech)</option>
              <option value="music">Música (Stories & Anecdotes)</option>
            </select>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/60">
            {/* Primary Color */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Color Primario / Glow</label>
                <span className="text-xs font-mono text-zinc-500">{primaryColor}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer overflow-hidden p-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 bg-[#18181c] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-zinc-500">Usado en bordes decorativos de HUD, outro y el sombreado de subtítulos.</p>
            </div>

            {/* Highlight Color */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Color de Resaltado</label>
                <span className="text-xs font-mono text-zinc-500">{highlightColor}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer overflow-hidden p-0"
                />
                <input
                  type="text"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="flex-1 bg-[#18181c] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-zinc-500">Usado para colorear palabras claves importantes que aumentan la retención.</p>
            </div>
          </div>
        </div>

        {/* Live Preview Container - right */}
        <div className="lg:col-span-5 bg-[#121215] border border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col items-center">
          <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-6 self-start w-full border-b border-zinc-800 pb-4">
            👁️ PREVISUALIZACIÓN EN VIVO
          </h2>
          
          {/* Vertical Video Frame */}
          <div className="w-64 aspect-[9/16] bg-[#0c0c0e] rounded-3xl border-2 border-zinc-800 relative overflow-hidden flex flex-col justify-between p-6 shadow-2xl">
            {/* Top HUD decoration */}
            <div className="flex justify-between items-center w-full z-10">
              <div className="text-[9px] font-mono text-zinc-500">LIVE FEED PREVIEW</div>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </div>

            {/* Simulated HUD elements */}
            <div className="absolute top-16 left-6 right-6 flex flex-col items-center z-10 pointer-events-none">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="avatar preview" 
                  className="w-11 h-11 rounded-full object-cover border"
                  style={{ borderColor: primaryColor }}
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-zinc-800 border flex items-center justify-center text-[10px] text-zinc-500" style={{ borderColor: primaryColor }}>
                  LOGO
                </div>
              )}
            </div>

            {/* Center Animated Subtitles Pop Box */}
            <div className="flex-1 flex flex-col justify-center items-center text-center px-2 z-10">
              <div 
                className="transition-all duration-150 transform scale-110 font-black uppercase text-xl leading-tight"
                style={{
                  fontFamily: fontFamily === "Sora" ? "var(--font-sora)" : fontFamily === "Orbitron" ? "Orbitron, sans-serif" : fontFamily === "Luckiest Guy" ? "'Luckiest Guy', sans-serif" : "var(--font-inter)",
                  color: previewWords[activeWordIndex].highlight ? highlightColor : "#ffffff",
                  textShadow: `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 8px 16px rgba(0,0,0,0.8), 0 0 10px ${primaryColor}4c`
                }}
              >
                {previewWords[activeWordIndex].text}
              </div>
            </div>

            {/* Bottom Outro info placeholder */}
            <div className="text-center z-10">
              <span className="text-[10px] font-mono block opacity-60 text-zinc-400">WATERMARK:</span>
              <span className="text-xs font-mono font-bold tracking-tight" style={{ color: highlightColor }}>
                @{watermark || "canaltv"}
              </span>
            </div>

            {/* HUD Neon Borders */}
            <div className="absolute inset-4 border border-zinc-800 pointer-events-none rounded-xl" style={{ borderColor: `${primaryColor}26` }} />
            <div className="absolute top-3.5 left-3.5 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: primaryColor }} />
            <div className="absolute top-3.5 right-3.5 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: primaryColor }} />
            <div className="absolute bottom-3.5 left-3.5 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: primaryColor }} />
            <div className="absolute bottom-3.5 right-3.5 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: primaryColor }} />
          </div>

          <div className="mt-6 text-center text-xs text-zinc-500 max-w-xs leading-relaxed">
            Las palabras de color resaltado representan términos clave de {niche === "music" ? "música" : "gaming"} que la IA detectará y resaltará automáticamente en tu video.
          </div>
        </div>
      </div>
    </div>
  );
}
