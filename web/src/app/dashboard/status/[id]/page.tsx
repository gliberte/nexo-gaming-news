"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useDashboard } from "../../context";
import { getCreatorNewsItemAction } from "../../actions";

export default function RenderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { activeProfile, updateActiveProfile } = useDashboard();
  const newsId = unwrappedParams.id;

  const [newsItem, setNewsItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Iniciando motor de renderizado...");
  const [isFinished, setIsFinished] = useState(false);

  // Poll database for rendering completion
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const item = await getCreatorNewsItemAction(newsId);
        if (item) {
          setNewsItem(item);
          if (item.status === "published" && item.video_url) {
            setIsFinished(true);
            setProgress(100);
            setStatusText("¡Video renderizado con éxito!");
            
            // Increment videos_rendered in context to update usage quota!
            // Only increment if we just found out it completed in this session
            const hasMarked = sessionStorage.getItem(`rendered_${newsId}`);
            if (!hasMarked) {
              sessionStorage.setItem(`rendered_${newsId}`, "true");
              updateActiveProfile({
                videos_rendered: Math.min(activeProfile.videos_limit, activeProfile.videos_rendered + 1)
              });
            }

            if (pollInterval) clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error("Error polling news item status:", err);
      } finally {
        setLoading(false);
      }
    };

    // First check
    checkStatus();

    // Poll every 3 seconds
    pollInterval = setInterval(checkStatus, 3000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [newsId, activeProfile.videos_rendered]);

  // Smooth progress simulation while rendering
  useEffect(() => {
    if (isFinished) return;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setStatusText("Fase 1: Ensamblando secuencias y clips de videojuegos...");
          return prev + Math.floor(Math.random() * 3) + 1;
        } else if (prev < 65) {
          setStatusText("Fase 2: Generando voz artificial y pista de sonido de fondo...");
          return prev + Math.floor(Math.random() * 2) + 1;
        } else if (prev < 90) {
          setStatusText("Fase 3: Renderizando video Remotion a 60 FPS...");
          return prev + 1;
        } else if (prev < 98) {
          setStatusText("Fase 4: Subiendo archivo MP4 a la nube R2 Storage...");
          return prev + 0.5;
        }
        return prev;
      });
    }, 450);

    return () => clearInterval(progressTimer);
  }, [isFinished]);

  if (loading && progress === 0) {
    return (
      <div className="text-center py-24">
        <div className="inline-block w-8 h-8 border-4 border-purple-500/25 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 text-sm font-mono">Cargando estado de exportación...</p>
      </div>
    );
  }

  // Calculate SVG circle progress
  const radius = 80;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.round(progress)) / 100) * circumference;

  const currentStep = 
    progress < 30 ? 1 :
    progress < 65 ? 2 :
    progress < 90 ? 3 : 4;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-1">PROCESO DE RENDERIZACIÓN</div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-100 max-w-2xl mx-auto leading-tight truncate">
          {newsItem?.title || "Renderizando video..."}
        </h1>
      </div>

      {/* Circle HUD Visualizer */}
      <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute w-64 h-64 rounded-full bg-purple-600/5 blur-[80px] pointer-events-none" />

        {/* Circular Progress Meter */}
        <div className="relative flex items-center justify-center mb-6">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            {/* Background ring */}
            <circle
              stroke="rgba(39, 39, 42, 0.4)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Active Progress Ring */}
            <circle
              stroke={isFinished ? "#10b981" : "url(#purpleGradient)"}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center percentage */}
          <div className="absolute flex flex-col items-center justify-center">
            {isFinished ? (
              <span className="text-4xl text-emerald-400">✓</span>
            ) : (
              <span className="text-3xl font-extrabold text-zinc-100 font-mono">
                {Math.round(progress)}%
              </span>
            )}
          </div>
        </div>

        {/* Status Text Description */}
        <div className="text-center space-y-2 max-w-md">
          <div className="text-sm font-semibold text-zinc-200">{statusText}</div>
          {!isFinished && (
            <div className="text-xs text-zinc-500 font-mono animate-pulse">
              Esto suele tomar entre 20 y 45 segundos. No cierres esta pestaña.
            </div>
          )}
        </div>

        {/* Download Button (shows on complete) */}
        {isFinished && newsItem?.video_url && (
          <div className="mt-8 animate-bounce">
            <a
              href={newsItem.video_url}
              download={`news_${newsId}.mp4`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold transition-all shadow-xl shadow-emerald-950/20 hover:scale-[1.03] inline-flex items-center gap-2.5"
            >
              📥 DESCARGAR VIDEO (.MP4)
            </a>
          </div>
        )}
      </div>

      {/* Progress Steps Checklist */}
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-3">
          LISTA DE VERIFICACIÓN DE FASES
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              id: 1,
              title: "Ensamblado de Secuencias",
              desc: "Importación de assets y cortes visuales de clips.",
            },
            {
              id: 2,
              title: "Generación de Audiovoz & Música",
              desc: "Locución artificial premium en Google AI Studio.",
            },
            {
              id: 3,
              title: "Renderizado Remotion",
              desc: "Compilación de animaciones, marcos y subtítulos.",
            },
            {
              id: 4,
              title: "Finalización & Despliegue",
              desc: "Subida al CDN de R2 Storage para descarga.",
            }
          ].map((step) => {
            const completed = isFinished || currentStep > step.id;
            const active = !isFinished && currentStep === step.id;

            return (
              <div 
                key={step.id} 
                className={`p-4 rounded-xl border flex gap-3.5 transition-all ${
                  completed ? "bg-emerald-950/5 border-emerald-800/20" :
                  active ? "bg-purple-950/5 border-purple-500/30 shadow-[0_0_10px_rgba(139,92,246,0.05)]" :
                  "bg-zinc-900/40 border-zinc-800/80 opacity-55"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {completed ? (
                    <span className="text-emerald-400 font-bold">✓</span>
                  ) : active ? (
                    <span className="inline-block w-4 h-4 border-2 border-purple-400/20 border-t-purple-400 rounded-full animate-spin" />
                  ) : (
                    <span className="text-zinc-600 font-mono text-xs">0{step.id}</span>
                  )}
                </div>
                
                <div>
                  <h4 className={`text-xs font-bold ${completed ? "text-emerald-400" : active ? "text-purple-400" : "text-zinc-400"}`}>
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Back to feed navigation */}
      <div className="text-center pt-4">
        <Link 
          href="/dashboard/feed" 
          className="text-xs text-zinc-500 hover:text-zinc-300 underline font-mono"
        >
          ← Volver al Feed de Noticias
        </Link>
      </div>
    </div>
  );
}
