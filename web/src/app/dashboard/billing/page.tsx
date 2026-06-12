"use client";

import React, { useState } from "react";
import { useDashboard } from "../context";

export default function BillingPage() {
  const { activeProfile, updateActiveProfile } = useDashboard();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const usagePercent = Math.min(
    100,
    (activeProfile.videos_rendered / activeProfile.videos_limit) * 100
  );

  const handleUpgrade = (planName: string, limit: number) => {
    setLoadingPlan(planName);
    
    // Simulate payment api latency
    setTimeout(() => {
      updateActiveProfile({
        current_plan: planName,
        videos_limit: limit
      });
      setLoadingPlan(null);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Billing & Limits</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Gestiona los límites de tu motor de renderizado CaaS y selecciona tu nivel de facturación.
        </p>
      </div>

      {/* Quota Progress Meter Card */}
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-zinc-200 mb-6">Uso de Renderizado de este Mes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Progress ring/bars */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-zinc-400">Videos renderizados</span>
              <span className="text-zinc-100 font-bold">{activeProfile.videos_rendered} / {activeProfile.videos_limit}</span>
            </div>
            
            <div className="h-4 bg-zinc-900 rounded-full p-1 border border-zinc-800">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-cyan-500 rounded-full transition-all duration-500" 
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed">
              Tu cuota se reinicia el día 1 de cada mes. Renderizar videos de prueba o hacer previsualizaciones no consume créditos de cuotas de exportación completa.
            </p>
          </div>

          {/* Plan badge */}
          <div className="bg-[#18181c] border border-zinc-800 rounded-xl p-6 text-center flex flex-col justify-center items-center h-full">
            <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest mb-1.5">PLAN ACTUAL</div>
            <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 uppercase">
              {activeProfile.current_plan}
            </div>
            <span className="text-xs text-zinc-500 font-mono mt-2">Límite: {activeProfile.videos_limit} videos / mes</span>
          </div>
        </div>
      </div>

      {/* Plan Tiers Upgrade Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-200">Mejorar Nivel de Creador</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Tier */}
          <div className={`bg-[#121215] border rounded-2xl p-6 flex flex-col justify-between transition-all ${
            activeProfile.current_plan === "Starter" ? "border-purple-500 shadow-md shadow-purple-950/5" : "border-zinc-800"
          }`}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-zinc-200">Starter</h3>
                {activeProfile.current_plan === "Starter" && (
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-950/20 border border-purple-900 px-2 py-0.5 rounded-full uppercase">Activo</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-zinc-100">$19</span>
                <span className="text-zinc-500 text-xs">/mes</span>
              </div>
              <ul className="space-y-3 text-xs text-zinc-400 mb-8 font-mono">
                <li>• 10 videos renderizados al mes</li>
                <li>• Aspect ratio 9:16 y 16:9</li>
                <li>• Marca de agua personalizable</li>
                <li>• Subtítulos automáticos estándar</li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade("Starter", 10)}
              disabled={activeProfile.current_plan === "Starter" || loadingPlan !== null}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeProfile.current_plan === "Starter"
                  ? "bg-zinc-800/40 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              }`}
            >
              {loadingPlan === "Starter" ? "Procesando..." : "Bajar a Starter"}
            </button>
          </div>

          {/* Creator Tier */}
          <div className={`bg-[#121215] border rounded-2xl p-6 flex flex-col justify-between transition-all ${
            activeProfile.current_plan === "Creator" ? "border-purple-500 shadow-md shadow-purple-950/5" : "border-zinc-800"
          }`}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-zinc-200">Creator</h3>
                {activeProfile.current_plan === "Creator" && (
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-950/20 border border-purple-900 px-2 py-0.5 rounded-full uppercase">Activo</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-zinc-100">$49</span>
                <span className="text-zinc-500 text-xs">/mes</span>
              </div>
              <ul className="space-y-3 text-xs text-zinc-400 mb-8 font-mono">
                <li>• 30 videos renderizados al mes</li>
                <li>• Branding Studio Avanzado</li>
                <li>• Logos de outro e intro ilimitados</li>
                <li>• Generador de Pitch de afiliación</li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade("Creator", 30)}
              disabled={activeProfile.current_plan === "Creator" || loadingPlan !== null}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeProfile.current_plan === "Creator"
                  ? "bg-zinc-800/40 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-zinc-950 font-bold"
              }`}
            >
              {loadingPlan === "Creator" ? "Procesando..." : activeProfile.current_plan === "Starter" ? "Mejorar a Creator" : "Bajar a Creator"}
            </button>
          </div>

          {/* Agency/Pro Tier */}
          <div className={`bg-[#121215] border rounded-2xl p-6 flex flex-col justify-between transition-all ${
            activeProfile.current_plan === "Agency" ? "border-purple-500 shadow-md shadow-purple-950/5" : "border-zinc-800"
          }`}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-zinc-200">Agency</h3>
                {activeProfile.current_plan === "Agency" && (
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-950/20 border border-purple-900 px-2 py-0.5 rounded-full uppercase">Activo</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-zinc-100">$149</span>
                <span className="text-zinc-500 text-xs">/mes</span>
              </div>
              <ul className="space-y-3 text-xs text-zinc-400 mb-8 font-mono">
                <li>• Renderizados Ilimitados (1000/mes)</li>
                <li>• Acceso API directa del engine</li>
                <li>• Integración de múltiples marcas</li>
                <li>• Soporte 24/7 con ingenieros</li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade("Agency", 1000)}
              disabled={activeProfile.current_plan === "Agency" || loadingPlan !== null}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeProfile.current_plan === "Agency"
                  ? "bg-zinc-800/40 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              }`}
            >
              {loadingPlan === "Agency" ? "Procesando..." : "Subir a Agency"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
