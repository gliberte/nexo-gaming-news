"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { submitNewsAction } from "../../actions";
import { getAdminNewsItemAction } from "../../data-actions";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const isNew = unwrappedParams.id === "new";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("admin_password");
    if (!savedPassword) {
      router.push("/admin");
      return;
    }
    setPassword(savedPassword);

    if (!isNew) {
      loadData(savedPassword, unwrappedParams.id);
    } else {
      setIsInitializing(false);
    }
  }, [unwrappedParams.id, isNew, router]);

  const loadData = async (pass: string, id: string) => {
    try {
      const data = await getAdminNewsItemAction(pass, id);
      if (data) {
        setTitle(data.title || "");
        setContent(data.web_article || "");
        setYoutubeUrl(data.youtube_url || "");
        setExistingImageUrl(data.image_url || null);
        setStatus(data.status || "draft");
      }
    } catch (err: any) {
      setError("Error al cargar la noticia. Verifica tu sesión.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("password", password);
    if (!isNew) formData.append("id", unwrappedParams.id);
    if (existingImageUrl) formData.append("existingImage", existingImageUrl);
    formData.append("status", status);

    try {
      await submitNewsAction(formData);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar.");
      setIsSubmitting(false);
    }
  };

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  };

  if (isInitializing) {
    return <div className="p-8 text-on-surface">Cargando editor...</div>;
  }

  // Si estamos en modo previsualización, mostramos la vista renderizada en el main canvas
  if (isPreview) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
          <h2 className="font-headline-md text-2xl text-on-surface">Modo Previsualización</h2>
          <button 
            onClick={() => setIsPreview(false)}
            className="px-6 py-2 border border-outline-variant text-on-surface font-bold hover:bg-surface-bright transition-colors rounded"
          >
            Volver a Editar
          </button>
        </div>

        <div className="max-w-[800px] mx-auto">
          <article className="glass-card" style={{ padding: "0", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", backgroundColor: "rgba(30,30,30,0.5)" }}>
            {getYoutubeVideoId(youtubeUrl) ? (
              <div className="video-container" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <iframe 
                  width="100%" height="400"
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(youtubeUrl)}?rel=0&modestbranding=1`}
                  title="YouTube video player" 
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
              </div>
            ) : existingImageUrl ? (
              <div style={{ width: "100%", height: "400px", borderBottom: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                <img src={existingImageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : null}
            
            <div style={{ padding: "32px" }}>
              <div className="label-caps platform-tag" style={{ display: "inline-block", padding: "4px 8px", backgroundColor: "rgba(255,255,255,0.1)", fontSize: "12px", borderRadius: "4px", marginBottom: "16px" }}>PREVIEW</div>
              <h1 style={{ fontSize: "32px", marginBottom: "24px" }} className="font-headline-lg text-primary">{title || "Sin Título"}</h1>
              
              <div className="markdown-content" style={{ marginTop: "24px", fontSize: "18px", lineHeight: "1.8", color: "var(--on-surface)" }}>
                <ReactMarkdown>{content || "*Contenido vacío*"}</ReactMarkdown>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      {error && <div className="mb-6 p-4 bg-error/10 border border-error/30 text-error rounded">{error}</div>}
      
      <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-12 gap-6 h-full">
        {/* Editor Column (Left) */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="space-y-2 neon-glow">
            <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              ARTICLE TITLE
            </label>
            <input 
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-headline-lg text-[32px] font-bold text-on-surface placeholder:text-on-surface-variant/30 transition-all outline-none py-2" 
              placeholder="Enter headline here..." 
              type="text"
              required
            />
          </div>

          {/* Markdown Editor */}
          <div className="flex-1 flex flex-col bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden neon-glow min-h-[400px]">
            <div className="flex items-center gap-4 px-4 py-3 bg-surface-container-high border-b border-outline-variant">
              <div className="flex gap-2">
                <span className="font-label-caps text-[12px] text-on-surface-variant">Markdown Supported</span>
              </div>
              <div className="w-[1px] h-6 bg-outline-variant"></div>
              <div className="ml-auto flex items-center gap-2">
                <span className="font-label-caps text-[10px] text-on-surface-variant/40">{title.length} CHARS</span>
              </div>
            </div>
            <textarea 
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full h-full bg-transparent p-6 font-body-lg text-[18px] text-on-surface leading-relaxed border-none focus:ring-0 resize-none placeholder:text-on-surface-variant/20 custom-scrollbar outline-none" 
              placeholder="Start typing the next big story in gaming..."
              required
            ></textarea>
          </div>

          {/* Media Zone */}
          <div className="space-y-3">
            <label className="font-label-caps text-label-caps text-on-surface-variant">HERO MEDIA (IMAGE)</label>
            <div className="border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-xl p-8 bg-surface-container-lowest transition-all">
              <div className="flex flex-col items-center justify-center gap-4">
                {existingImageUrl && (
                  <div className="w-full max-w-sm mb-4">
                    <img src={existingImageUrl} alt="Current hero" className="w-full rounded-lg border border-outline-variant" />
                    <p className="text-center text-[12px] mt-2 text-on-surface-variant">Current image. Upload new to replace.</p>
                  </div>
                )}
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
                </div>
                <div className="text-center">
                  <p className="font-headline-md text-on-surface text-lg">Select file</p>
                  <p className="font-body-md text-on-surface-variant/60 text-sm">Supports PNG, JPG</p>
                </div>
                <input type="file" name="image" accept="image/*" className="text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:font-label-caps file:bg-surface-bright file:text-primary hover:file:bg-surface-bright/80 cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pb-8 neon-glow">
            <label className="font-label-caps text-label-caps text-on-surface-variant">YOUTUBE URL (OVERRIDES IMAGE IF SET)</label>
            <input 
              name="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant focus:border-primary focus:ring-0 text-on-surface p-3 rounded transition-all outline-none" 
              placeholder="https://www.youtube.com/watch?v=..." 
              type="url"
            />
          </div>
        </section>

        {/* Controls Sidebar (Right) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Publication Card */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6 space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <h3 className="font-headline-md text-[20px] text-on-surface">Publishing</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_#33fb0a]"></span>
                <span className="font-label-caps text-[10px] text-tertiary">READY</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant">STATUS</label>
              <div className="relative">
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-4 py-3 appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                >
                  <option value="draft">Draft (Borrador)</option>
                  <option value="published">Published (Público)</option>
                  <option value="archived">Archived (Descatalogado)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
              <button 
                type="button"
                onClick={() => setIsPreview(true)}
                className="w-full py-4 px-6 border border-primary text-primary font-bold clipped-corner hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">visibility</span>
                PREVIEW ARTICLE
              </button>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 ${status === 'published' ? 'bg-primary text-on-primary' : 'bg-secondary text-on-secondary'} font-extrabold clipped-corner hover:shadow-[0_0_20px_rgba(0,219,233,0.4)] transition-all flex items-center justify-center gap-2`}
              >
                <span className="material-symbols-outlined">{isSubmitting ? "hourglass_empty" : "publish"}</span>
                {isSubmitting ? "GUARDANDO..." : (status === 'published' ? "PUBLISH NOW" : "SAVE " + status.toUpperCase())}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
