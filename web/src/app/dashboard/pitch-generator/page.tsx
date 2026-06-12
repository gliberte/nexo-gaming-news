"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../context";
import { getCreatorNewsAction } from "../actions";

export default function PitchGeneratorPage() {
  const { activeProfile } = useDashboard();
  
  // Data list for selector
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  // Inputs
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [targetContact, setTargetContact] = useState("");
  const [outreachTone, setOutreachTone] = useState("hype");
  const [pitchType, setPitchType] = useState("affiliate");

  // Output
  const [generatedPitch, setGeneratedPitch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch drafts to link news content
  useEffect(() => {
    const fetchDrafts = async () => {
      setLoadingDrafts(true);
      try {
        const items = await getCreatorNewsAction(activeProfile.id);
        setDrafts(items || []);
        if (items && items.length > 0) {
          setSelectedDraftId(items[0].id);
        }
      } catch (err) {
        console.error("Error fetching drafts for pitch:", err);
      } finally {
        setLoadingDrafts(false);
      }
    };
    fetchDrafts();
  }, [activeProfile.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    if (!sponsorName) {
      alert("Por favor, introduce el nombre del Sponsor/Marca.");
      return;
    }

    setGenerating(true);
    
    // Simulate smart AI compiler delay
    setTimeout(() => {
      const selectedNews = drafts.find(d => d.id === selectedDraftId);
      const topic = selectedNews ? selectedNews.title : "las últimas tendencias y lanzamientos de gaming";
      
      let template = "";
      
      if (outreachTone === "hype") {
        template = `¡Buenas ${targetContact || "gente de " + sponsorName}! 👋

Soy ${activeProfile.name}, creador de contenido de videojuegos. Acabo de publicar una pieza informativa en formato vertical que está explotando sobre "${topic}".

Nuestra comunidad de entusiastas en @${activeProfile.watermark_text} tiene un engagement altísimo. Viendo vuestras últimas campañas, creo que ${sponsorName} encaja de forma orgánica brutal para integrarse en nuestro próximo bloque de noticias semanales.

¿Os molaría que hiciéramos una mención patrocinada o un unboxing exprés en el próximo video de 30 segundos?

¡Quedo a la espera! Un saludo,
${activeProfile.name}
Propietario de ${activeProfile.title} (@${activeProfile.watermark_text})`;
      } else if (outreachTone === "professional") {
        template = `Estimado equipo de marketing de ${sponsorName},

Mi nombre es ${activeProfile.name}, director del canal informativo de tecnología y gaming ${activeProfile.title} (@${activeProfile.watermark_text}).

Nos especializamos en brindar resúmenes ágiles y cobertura técnica en tiempo real. Recientemente hemos cubierto el desarrollo de: "${topic}", alcanzando una audiencia altamente segmentada e interesada en hardware y videojuegos de última generación.

Me pongo en contacto para proponer una colaboración publicitaria estratégica a través de patrocinio en video corto (TikTok/YouTube Shorts), donde ${sponsorName} se integre orgánicamente como la recomendación oficial del día.

Podemos coordinar una llamada de 5 minutos esta semana para revisar nuestras métricas de engagement y tarifas.

Atentamente,
${activeProfile.name}
${activeProfile.title}
Canal: ${activeProfile.watermark_text}`;
      } else { // casual
        template = `Hola ${targetContact || "equipo de " + sponsorName}, ¿cómo va todo?

Soy ${activeProfile.name} de @${activeProfile.watermark_text}. Sigo muy de cerca lo que hacéis y soy consumidor habitual de vuestra marca.

Hago videos cortos con resúmenes rápidos de noticias gaming (como el último que subí analizando "${topic}"). Creo que a mis seguidores les encantaría conocer más de cerca lo que ofrecéis.

Escribo por si tenéis abierto vuestro programa de creadores o si os interesaría patrocinar una mención de 10 segundos en los videos cortos de la próxima semana. 

Si os interesa, os paso estadísticas de retención y lo comentamos tranquilos.

¡Un abrazo!
${activeProfile.name}`;
      }

      setGeneratedPitch(template);
      setGenerating(false);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Sponsor Pitch Generator</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Redacta propuestas de patrocinio instantáneas y personalizadas vinculando tus videos creados por IA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs - Left */}
        <div className="lg:col-span-5 bg-[#121215] border border-zinc-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-3">
            CONFIGURACIÓN DEL PITCH
          </h2>

          {/* Draft selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Noticia Relacionada</label>
            {loadingDrafts ? (
              <div className="text-xs text-zinc-500 font-mono animate-pulse">Cargando borradores...</div>
            ) : drafts.length === 0 ? (
              <div className="text-xs text-amber-400 font-mono">Crea primero un borrador de video en el feed.</div>
            ) : (
              <select
                value={selectedDraftId}
                onChange={(e) => setSelectedDraftId(e.target.value)}
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none"
              >
                {drafts.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Sponsor name */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Nombre del Sponsor / Marca</label>
            <input
              type="text"
              placeholder="Ej. NordVPN, ASUS ROG, Instant Gaming"
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Contact person */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Nombre del Contacto (Opcional)</label>
            <input
              type="text"
              placeholder="Ej. Carlos o Marketing Team"
              value={targetContact}
              onChange={(e) => setTargetContact(e.target.value)}
              className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Tone selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Tono del Mensaje</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Gamer Hype", val: "hype" },
                { name: "Profesional", val: "professional" },
                { name: "Casual", val: "casual" }
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setOutreachTone(t.val)}
                  className={`py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                    outreachTone === t.val
                      ? "bg-purple-600/20 text-purple-400 border-purple-500/35"
                      : "bg-[#18181c] text-zinc-400 border-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !sponsorName}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold transition-all hover:scale-[1.02] mt-4 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-purple-400/25 border-t-purple-400 rounded-full animate-spin" />
                Redactando Pitch...
              </>
            ) : (
              "Redactar Outreach Pitch ✨"
            )}
          </button>
        </div>

        {/* Generated Pitch Output - Right */}
        <div className="lg:col-span-7 bg-[#121215] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-[520px]">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
            <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-widest">
              📝 PROPUESTA REDACTADA
            </h2>
            
            {generatedPitch && (
              <button
                onClick={handleCopy}
                className="text-xs font-bold font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-950/20 px-2.5 py-1 rounded-lg border border-purple-800/40"
              >
                {copied ? "¡Copiado! ✓" : "Copiar Texto 📋"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-[#18181c] border border-zinc-800 rounded-xl p-4 font-sans text-sm text-zinc-300 leading-relaxed whitespace-pre-line focus:outline-none">
            {generatedPitch ? (
              generatedPitch
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs text-center font-mono">
                Introduce el nombre del Sponsor y haz clic en "Redactar Outreach Pitch" para compilar tu propuesta de afiliación.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
