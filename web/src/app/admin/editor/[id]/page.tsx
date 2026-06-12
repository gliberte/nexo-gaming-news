"use client";
 
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { submitNewsAction, generateProductionPlanAction, triggerVideoRenderAction, sendCuratedContentToTelegramAction } from "../../actions";
import { getAdminNewsItemAction } from "../../data-actions";

const textStylesMap: any = {
  glitch: '#ff0055',
  neon_cyan: '#00f0ff',
  warning_red: '#ff0033',
  bright_yellow: '#fbff00'
};
 
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
  const [tags, setTags] = useState<string[]>(["CYBERPUNK2077", "CDPROJEKTRED", "UPDATE2.1"]);
  const [tagInput, setTagInput] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // TikTok & Production Plan State
  const [tiktokScript, setTiktokScript] = useState("");
  const [productionPlan, setProductionPlan] = useState<any | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  
  // Video render state
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [videoRenderSuccess, setVideoRenderSuccess] = useState<boolean | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);

  // Curated Content state
  const [tweet, setTweet] = useState("");
  const [instagramCaption, setInstagramCaption] = useState("");

  // Telegram state
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramSendSuccess, setTelegramSendSuccess] = useState<boolean | null>(null);
 
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize title and content textareas
  useEffect(() => {
    if (!isInitializing && titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = titleRef.current.scrollHeight + "px";
    }
  }, [title, isInitializing]);

  useEffect(() => {
    if (!isInitializing && contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = contentRef.current.scrollHeight + "px";
    }
  }, [content, isInitializing]);

  const loadData = async (pass: string, id: string) => {
    try {
      const result = await getAdminNewsItemAction(pass, id);
      if (result && !result.success) {
        setError(result.error || "Error al cargar la noticia.");
        return;
      }
      
      const data = result.data;
      if (data) {
        setTitle(data.title || "");
        setContent(data.web_article || "");
        setYoutubeUrl(data.youtube_url || "");
        setExistingImageUrl(data.image_url || null);
        setStatus(data.status || "draft");
        setTiktokScript(data.tiktok_script || "");
        setProductionPlan(data.production_plan || null);
        if (data.production_plan) {
          setShowPlan(true);
        }
        setTweet(data.tweet || "");
        setInstagramCaption(data.instagram_caption || "");
        if (data.tags) {
          try {
            setTags(JSON.parse(data.tags));
          } catch {
            if (typeof data.tags === "string") {
              setTags(data.tags.split(",").map((t: string) => t.trim().toUpperCase()));
            }
          }
        }
      }
    } catch (err: any) {
      setError("Error al cargar la noticia. Verifica tu sesión o conexión.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cleanTag = tagInput.trim().toUpperCase().replace(/#/g, "");
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
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
    formData.append("tags", JSON.stringify(tags));
    formData.append("tiktokScript", tiktokScript);
    formData.append("productionPlan", productionPlan ? JSON.stringify(productionPlan) : "");
    formData.append("tweet", tweet);
    formData.append("instagramCaption", instagramCaption);

    try {
      await submitNewsAction(formData);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar.");
      setIsSubmitting(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!tiktokScript) {
      setError("Por favor, escribe un guion de TikTok primero.");
      return;
    }
    setIsGeneratingPlan(true);
    setError(null);
    try {
      const planData = await generateProductionPlanAction(password, tiktokScript, isNew ? undefined : unwrappedParams.id);
      setProductionPlan(planData);
      setShowPlan(true);
    } catch (err: any) {
      setError("Error al generar el plan de producción. Inténtalo de nuevo.");
      console.error(err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleResolutionChange = (res: string) => {
    if (!productionPlan) return;
    const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
    if (!updatedPlan.production_plan) {
      updatedPlan.production_plan = {};
    }
    if (!updatedPlan.production_plan.render_specifications) {
      updatedPlan.production_plan.render_specifications = {};
    }
    updatedPlan.production_plan.render_specifications.resolution = res;
    setProductionPlan(updatedPlan);
  };

  const handleSceneTextChange = (sceneId: number, field: 'narrative_text' | 'screen_text_overlay', value: string) => {
    if (!productionPlan) return;
    const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
    if (!updatedPlan.production_plan || !updatedPlan.production_plan.scenes) return;
    
    const sceneIndex = updatedPlan.production_plan.scenes.findIndex((s: any) => s.scene_id === sceneId);
    if (sceneIndex === -1) return;
    
    if (field === 'narrative_text') {
      updatedPlan.production_plan.scenes[sceneIndex].narrative_text = value;
    } else if (field === 'screen_text_overlay') {
      if (!updatedPlan.production_plan.scenes[sceneIndex].hook_settings) {
        updatedPlan.production_plan.scenes[sceneIndex].hook_settings = {};
      }
      updatedPlan.production_plan.scenes[sceneIndex].hook_settings.screen_text_overlay = value;
    }
    
    setProductionPlan(updatedPlan);
  };

  const handleScenePresentationModeChange = (sceneId: number, mode: string) => {
    if (!productionPlan) return;
    const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
    if (!updatedPlan.production_plan || !updatedPlan.production_plan.scenes) return;
    
    const sceneIndex = updatedPlan.production_plan.scenes.findIndex((s: any) => s.scene_id === sceneId);
    if (sceneIndex === -1) return;
    
    if (!updatedPlan.production_plan.scenes[sceneIndex].visual_resource) {
      updatedPlan.production_plan.scenes[sceneIndex].visual_resource = {};
    }
    updatedPlan.production_plan.scenes[sceneIndex].visual_resource.presentation_mode = mode;
    
    setProductionPlan(updatedPlan);
  };

  const handleSceneObjectPositionChange = (sceneId: number, pos: string) => {
    if (!productionPlan) return;
    const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
    if (!updatedPlan.production_plan || !updatedPlan.production_plan.scenes) return;
    
    const sceneIndex = updatedPlan.production_plan.scenes.findIndex((s: any) => s.scene_id === sceneId);
    if (sceneIndex === -1) return;
    
    if (!updatedPlan.production_plan.scenes[sceneIndex].visual_resource) {
      updatedPlan.production_plan.scenes[sceneIndex].visual_resource = {};
    }
    updatedPlan.production_plan.scenes[sceneIndex].visual_resource.object_position = pos;
    
    setProductionPlan(updatedPlan);
  };

  const handleUseAiVoiceChange = (checked: boolean) => {
    if (!productionPlan) return;
    const updatedPlan = JSON.parse(JSON.stringify(productionPlan));
    const target = updatedPlan.production_plan || updatedPlan;
    target.use_ai_voice = checked;
    setProductionPlan(updatedPlan);
  };

  const handleRenderVideo = async () => {
    if (isNew) {
      setError("Guarda la noticia primero antes de renderizar un video.");
      return;
    }
    setIsRenderingVideo(true);
    setVideoRenderSuccess(null);
    setVideoPath(null);
    setError(null);
    try {
      const result = await triggerVideoRenderAction(password, unwrappedParams.id);
      if (result && result.success) {
        setVideoRenderSuccess(true);
        setVideoPath(`/news_${unwrappedParams.id}.mp4`);
      }
    } catch (err: any) {
      setError("Error al renderizar: " + (err.message || "Fallo en el script de renderizado."));
      setVideoRenderSuccess(false);
      console.error(err);
    } finally {
      setIsRenderingVideo(false);
    }
  };

  const handleSendToTelegram = async () => {
    if (isNew) {
      setError("Guarda la noticia primero antes de enviar a Telegram.");
      return;
    }
    setIsSendingTelegram(true);
    setTelegramSendSuccess(null);
    setError(null);
    try {
      const result = await sendCuratedContentToTelegramAction(password, unwrappedParams.id);
      if (result && result.success) {
        setTelegramSendSuccess(true);
        if (result.tweet) setTweet(result.tweet);
        if (result.instagramCaption) setInstagramCaption(result.instagramCaption);
        alert("¡Contenidos curados enviados a Telegram con éxito!");
      }
    } catch (err: any) {
      setError("Error al enviar a Telegram: " + (err.message || "Fallo en la comunicación."));
      setTelegramSendSuccess(false);
      console.error(err);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
    
    // Fallback for short links youtu.be
    const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
    return shortMatch ? shortMatch[1] : null;
  };

  const insertMarkdown = (type: string) => {
    if (!contentRef.current) return;
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    let replacement = "";

    switch (type) {
      case "bold":
        replacement = `**${selected || "texto"}**`;
        break;
      case "italic":
        replacement = `*${selected || "texto"}*`;
        break;
      case "underline":
        replacement = `<u>${selected || "texto"}</u>`;
        break;
      case "bullet":
        replacement = `\n- ${selected || "elemento"}\n`;
        break;
      case "number":
        replacement = `\n1. ${selected || "elemento"}\n`;
        break;
      case "code":
        replacement = `\`${selected || "código"}\``;
        break;
      case "link":
        replacement = `[${selected || "texto"}](url)`;
        break;
      case "image":
        replacement = `![${selected || "descripción"}](url_imagen)`;
        break;
      default:
        return;
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);
    
    // Focus back on the textarea and select the text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      
      // Auto resize height
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }, 0);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#0e0e0f] flex flex-col items-center justify-center gap-4 text-on-surface">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
        <p className="font-label-caps text-xs tracking-widest text-on-surface-variant">Cargando editor...</p>
      </div>
    );
  }

  const activeCoverUrl = imagePreviewUrl || existingImageUrl;
  const youtubeVideoId = getYoutubeVideoId(youtubeUrl);

  return (
    <div className="flex-1 p-8 grid grid-cols-12 gap-6 overflow-y-auto relative">
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-error/90 backdrop-blur text-on-error rounded-xl shadow-2xl font-bold flex items-center gap-2 border border-error/30">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="col-span-12 grid grid-cols-12 gap-6">
        {/* ================== LEFT COLUMN (EDITOR CANVAS) ================== */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-6 pr-4 pb-8">
          
          {isPreview ? (
            /* PREVIEW OVERLAY */
            <div className="glass-panel p-8 md:p-12 rounded-2xl border border-white/5 shadow-2xl bg-surface-container-lowest/40 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <h3 className="font-headline text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">visibility</span>
                  Article Preview
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsPreview(false)} 
                  className="text-xs bg-white/5 hover:bg-white/10 text-white font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  Edit Content
                </button>
              </div>
              
              {youtubeVideoId ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/5 mb-8 bg-black">
                  <iframe 
                    width="100%" height="100%"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`}
                    title="YouTube video" 
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : activeCoverUrl ? (
                <div className="w-full aspect-[21/9] rounded-xl overflow-hidden shadow-2xl border border-white/5 mb-8 relative">
                  <img src={activeCoverUrl} alt={title} className="w-full h-full object-cover" />
                </div>
              ) : null}
              
              <h1 className="font-headline-lg text-3xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                {title || 'Untitled Article'}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-white/5">
                {tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] bg-white/5 text-on-surface-variant border border-white/10 rounded px-2 py-0.5 font-bold font-mono">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="font-body-lg text-[16px] text-on-surface/90 leading-relaxed prose prose-invert max-w-none">
                <ReactMarkdown>{content || "*No content written yet.*"}</ReactMarkdown>
              </div>
            </div>
          ) : (
            /* STANDARD EDITOR VIEW */
            <>
              {/* Article Title Area */}
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">edit_note</span>
                  ARTICLE TITLE
                </label>
                
                <textarea 
                  ref={titleRef}
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-headline-lg text-headline-lg text-on-surface placeholder:text-on-surface-variant/30 transition-all outline-none py-2 resize-none overflow-hidden" 
                  placeholder="Enter headline here..." 
                  rows={1}
                  required
                />
              </div>

              {/* Rich Text Editor Mockup */}
              <div className="flex-1 flex flex-col bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden min-h-[300px]">
                <div className="flex items-center gap-4 px-4 py-3 bg-surface-container-high border-b border-outline-variant">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => insertMarkdown('bold')} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
                      <span className="material-symbols-outlined">format_bold</span>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('italic')} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
                      <span className="material-symbols-outlined">format_italic</span>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('underline')} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
                      <span className="material-symbols-outlined">format_underlined</span>
                    </button>
                  </div>
                  
                  <div className="w-[1px] h-6 bg-outline-variant"></div>
                  
                  <div className="flex gap-2">
                    <button type="button" onClick={() => insertMarkdown('bullet')} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
                      <span className="material-symbols-outlined">format_list_bulleted</span>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('number')} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
                      <span className="material-symbols-outlined">format_list_numbered</span>
                    </button>
                  </div>
                  
                  <div className="w-[1px] h-6 bg-outline-variant"></div>
                  
                  <div className="flex gap-2">
                    <button type="button" onClick={() => insertMarkdown('link')} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
                      <span className="material-symbols-outlined">link</span>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('image')} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
                      <span className="material-symbols-outlined">image</span>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('code')} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
                      <span className="material-symbols-outlined">code</span>
                    </button>
                  </div>
                  
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-label-caps text-[10px] text-on-surface-variant/40">AUTOSAVED 2M AGO</span>
                  </div>
                </div>
                
                <textarea 
                  ref={contentRef}
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full bg-transparent p-6 font-body-lg text-body-lg text-on-surface leading-relaxed border-none focus:ring-0 resize-none placeholder:text-on-surface-variant/20 custom-scrollbar" 
                  placeholder="Start typing the next big story in gaming..."
                  required
                />
              </div>

              {/* TikTok Script Area */}
              <div className="space-y-3">
                <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">movie</span>
                  TIKTOK SCRIPT / VIDEO SCRIPT
                </label>
                <textarea 
                  name="tiktokScript"
                  value={tiktokScript}
                  onChange={(e) => setTiktokScript(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-4 font-body-md text-on-surface placeholder:text-on-surface-variant/20 outline-none resize-y min-h-[150px] custom-scrollbar" 
                  placeholder="Insert script here with [Visual cues]..."
                />
              </div>

              {/* X / Twitter Copy Area */}
              <div className="space-y-3">
                <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">share</span>
                  X / TWITTER COPY (CURADO)
                </label>
                <textarea 
                  name="tweet"
                  value={tweet}
                  onChange={(e) => setTweet(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-4 font-body-md text-on-surface placeholder:text-on-surface-variant/20 outline-none resize-y min-h-[100px] custom-scrollbar" 
                  placeholder="Escribe el copy curado para X aquí..."
                />
              </div>

              {/* Instagram Copy Area */}
              <div className="space-y-3">
                <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  INSTAGRAM COPY (CURADO)
                </label>
                <textarea 
                  name="instagramCaption"
                  value={instagramCaption}
                  onChange={(e) => setInstagramCaption(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-4 font-body-md text-on-surface placeholder:text-on-surface-variant/20 outline-none resize-y min-h-[120px] custom-scrollbar" 
                  placeholder="Escribe el copy curado para Instagram aquí..."
                />
              </div>

              {/* Video Production Plan Visualizer */}
              {productionPlan && (
                <div className="glass-panel p-6 rounded-lg border border-[#ecb2ff]/20 bg-surface-container/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                    <h3 className="font-headline text-[16px] font-bold text-secondary flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">movie_filter</span>
                      Video Production Plan
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setShowPlan(!showPlan)}
                      className="text-xs bg-white/5 hover:bg-white/10 text-white font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                    >
                      {showPlan ? 'Hide Plan' : 'Show Plan'}
                    </button>
                  </div>
                  
                  {showPlan && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-on-surface-variant bg-surface-container-low/50 p-4 rounded-lg border border-outline-variant/50">
                        <div>
                          <p><span className="text-secondary">VOICE TONE:</span> {productionPlan.production_plan?.voice_over?.voice_settings?.intonation_description}</p>
                          <p className="mt-1.5"><span className="text-secondary">SOUNDTRACK:</span> {productionPlan.production_plan?.soundtrack?.music_style} ({productionPlan.production_plan?.soundtrack?.tempo})</p>
                        </div>
                        <div>
                          <p><span className="text-secondary">RESOLUTION:</span> {productionPlan.production_plan?.render_specifications?.resolution} @ {productionPlan.production_plan?.render_specifications?.fps || 30}fps</p>
                          <p className="mt-1.5"><span className="text-secondary">COMPOSER:</span> {productionPlan.production_plan?.render_specifications?.composition_library}</p>
                        </div>
                      </div>

                      {/* Aspect Ratio Selector */}
                      <div className="space-y-2 border-t border-outline-variant pt-4">
                        <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">aspect_ratio</span>
                          VIDEO ASPECT RATIO
                        </label>
                        <div className="relative">
                          <select 
                            value={productionPlan.production_plan?.render_specifications?.resolution || "1080x1920"}
                            onChange={(e) => handleResolutionChange(e.target.value)}
                            className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-4 py-3 appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer font-body-md"
                          >
                            <option value="1080x1920">9:16 (TikTok, Shorts, Reels)</option>
                            <option value="1920x1080">16:9 (YouTube, Web)</option>
                            <option value="1080x1080">1:1 (Instagram)</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                        </div>
                      </div>

                      {/* AI Voice Toggle Switch */}
                      <div className="space-y-2 border-t border-outline-variant pt-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">record_voice_over</span>
                            VOZ DE IA (ELEVENLABS)
                          </label>
                          <p className="text-xs text-on-surface-variant/60">Generar locución de voz sintetizada automáticamente</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!(productionPlan.production_plan?.use_ai_voice || productionPlan.use_ai_voice)}
                            onChange={(e) => handleUseAiVoiceChange(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-black"></div>
                        </label>
                      </div>

                      <div className="space-y-4 border-t border-outline-variant pt-4">
                        <p className="font-label-caps text-[11px] text-on-surface-variant">SCENES SEQUENCE ({productionPlan.production_plan?.scenes?.length || 0} scenes)</p>
                        <div className="space-y-3">
                          {productionPlan.production_plan?.scenes?.map((scene: any) => (
                            <div key={scene.scene_id} className="p-4 bg-surface-container-low border border-outline-variant rounded-lg space-y-4">
                              <div className="flex justify-between text-xs font-mono text-primary font-bold">
                                <span>Scene {scene.scene_id}</span>
                                <span>{scene.start_time_seconds}s - {scene.end_time_seconds}s</span>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="font-label-caps text-[10px] text-on-surface-variant/70 block mb-1">NARRATIVE TEXT (SUBTITLES & VOICE)</label>
                                  <textarea
                                    value={scene.narrative_text || ""}
                                    onChange={(e) => handleSceneTextChange(scene.scene_id, 'narrative_text', e.target.value)}
                                    rows={2}
                                    className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded p-2 text-sm text-on-surface outline-none resize-y custom-scrollbar font-sans"
                                    placeholder="Enter scene script..."
                                  />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/20">
                                    <div className="space-y-3 text-xs text-on-surface-variant">
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-[10px] uppercase text-on-surface-variant/70">Visual Resource:</p>
                                        <p>{scene.visual_resource?.resource_type}</p>
                                        <p className="text-[10px] font-mono text-primary/80">Search: "{scene.visual_resource?.youtube_search_query}"</p>
                                        <div>
                                          <label className="font-label-caps text-[10px] text-on-surface-variant/70 block mb-1">PRESENTATION MODE</label>
                                          <select
                                            value={scene.visual_resource?.presentation_mode || "cover"}
                                            onChange={(e) => handleScenePresentationModeChange(scene.scene_id, e.target.value)}
                                            className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 text-xs outline-none text-on-surface font-sans cursor-pointer"
                                          >
                                            <option value="cover">Smart Crop (Fill)</option>
                                            <option value="blur_fit">Split Screen (Blur Fit)</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="font-label-caps text-[10px] text-on-surface-variant/70 block mb-1">FOCUS AREA (CROP ALIGNMENT)</label>
                                          <select
                                            value={scene.visual_resource?.object_position || 'center'}
                                            onChange={(e) => handleSceneObjectPositionChange(scene.scene_id, e.target.value)}
                                            className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 text-xs outline-none text-on-surface font-sans cursor-pointer"
                                          >
                                            <option value="center">Center (Default)</option>
                                            <option value="left">Left (Streamers / HUD)</option>
                                            <option value="right">Right (Action / HUD)</option>
                                            <option value="top">Top (Heads / Skylines)</option>
                                            <option value="bottom">Bottom (Controls / Ground)</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="font-label-caps text-[10px] text-on-surface-variant/70 block mb-1">OVERLAY HOOK TEXT</label>
                                      <input
                                        type="text"
                                        value={scene.hook_settings?.screen_text_overlay || ""}
                                        onChange={(e) => handleSceneTextChange(scene.scene_id, 'screen_text_overlay', e.target.value)}
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 text-xs outline-none font-bold"
                                        style={{ color: textStylesMap[scene.hook_settings?.text_style] || '#fbff00' }}
                                        placeholder="No overlay text"
                                      />
                                      <p className="text-[9px] font-mono text-on-surface-variant/60 mt-1">Pos: {scene.hook_settings?.dynamic_subtitles_placement} | Style: {scene.hook_settings?.text_style}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Media Upload Zone */}
              <div className="space-y-3">
                <label className="font-label-caps text-label-caps text-on-surface-variant">HERO MEDIA &amp; GALLERY</label>
                <div className="relative group cursor-pointer border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-xl p-8 bg-surface-container-lowest transition-all min-h-[200px] flex items-center justify-center" id="drop-zone">
                  {activeCoverUrl ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-8 w-full h-full relative">
                      <img src={activeCoverUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-10 transition-all duration-500 rounded-lg" alt="cover preview" />
                      <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl z-10">
                        <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                      </div>
                      <div className="text-center z-10">
                        <p className="font-headline-md text-on-surface font-bold">Image Cover Loaded</p>
                        {selectedFileName && (
                          <p className="font-body-md text-primary mt-1 font-mono text-xs">{selectedFileName}</p>
                        )}
                      </div>
                      <button type="button" className="z-10 mt-2 px-6 py-2 border border-outline-variant text-on-surface font-bold hover:bg-surface-bright transition-colors rounded cursor-pointer">Change File</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                      <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
                      </div>
                      <div className="text-center">
                        <p className="font-headline-md text-on-surface">Drag and drop assets here</p>
                        <p className="font-body-md text-on-surface-variant/60">Supports PNG, JPG, MP4 (Max 50MB)</p>
                      </div>
                      <button type="button" className="mt-2 px-6 py-2 border border-outline-variant text-on-surface font-bold hover:bg-surface-bright transition-colors rounded">Browse Files</button>
                    </div>
                  )}
                  <input 
                    type="file" 
                    name="image" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                  />
                </div>
              </div>

              {/* YouTube Link container (Auxiliary) */}
              <div className="space-y-3">
                <label className="font-label-caps text-label-caps text-on-surface-variant">YOUTUBE VIDEO LINK (OPTIONAL)</label>
                <div className="flex flex-wrap items-center gap-3 p-4 bg-surface-container border border-outline-variant rounded-lg">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">smart_display</span>
                  <input 
                    name="youtubeUrl"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-on-surface-variant/40 py-1 min-w-[250px] flex-1 outline-none" 
                    placeholder="https://youtube.com/watch?v=..." 
                    type="url"
                  />
                  {youtubeVideoId && (
                    <span className="material-symbols-outlined text-[#33fb0a] text-[18px]">check_circle</span>
                  )}
                </div>
              </div>

              {/* Hashtag Input */}
              <div className="space-y-3 pb-8">
                <label className="font-label-caps text-label-caps text-on-surface-variant">TAGGING &amp; CATEGORIES</label>
                <div className="flex flex-wrap items-center gap-3 p-4 bg-surface-container border border-outline-variant rounded-lg">
                  {tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-label-caps text-[11px] font-mono">
                      #{tag}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag)}
                        className="hover:text-error transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add hashtag..."
                    className="bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-on-surface-variant/40 py-1 min-w-[120px] outline-none"
                  />
                </div>
              </div>
            </>
          )}

        </section>

        {/* ================== RIGHT COLUMN (SIDEBAR PANELS) ================== */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-6 pr-2 pb-8">
          
          {/* Publication Card */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <h3 className="font-headline-md text-[20px] text-on-surface">Publishing</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_#33fb0a]"></span>
                <span className="font-label-caps text-[10px] text-tertiary">LIVE PREVIEW READY</span>
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
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant">PUBLISH DATE</label>
              <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3">
                <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
                <input 
                  type="datetime-local"
                  name="publishDate"
                  defaultValue="2023-10-24T14:00"
                  className="bg-transparent text-on-surface font-body-md border-none focus:ring-0 p-0 cursor-pointer w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="w-full py-4 px-6 border border-primary text-primary font-bold clipped-corner hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined">visibility</span>
                {isPreview ? 'EDIT CONTENT' : 'PREVIEW ARTICLE'}
              </button>
              
              <button 
                type="button"
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan || !tiktokScript}
                className="w-full py-4 px-6 border border-secondary text-secondary font-bold clipped-corner hover:bg-secondary/5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGeneratingPlan ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    GENERANDO PLAN...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">video_settings</span>
                    {productionPlan ? 'REGENERAR PLAN DE VIDEO' : 'GENERAR PLAN DE VIDEO'}
                  </>
                )}
              </button>
              
              {productionPlan && (
                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={handleRenderVideo}
                    disabled={isRenderingVideo}
                    className="w-full py-4 px-6 border font-bold clipped-corner transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: '#ff0055', color: '#ff0055', background: 'rgba(255, 0, 85, 0.02)' }}
                  >
                    {isRenderingVideo ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        RENDERIZANDO VIDEO...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">movie_filter</span>
                        RENDERIZAR VIDEO MP4
                      </>
                    )}
                  </button>
                  
                  {!isNew && (
                    <a 
                      href={`/news_${unwrappedParams.id}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 text-center text-xs text-primary font-mono hover:underline block"
                    >
                      [ VER VIDEO RENDERIZADO ]
                    </a>
                  )}
                </div>
              )}
              
              {!isNew && (
                <button 
                  type="button"
                  onClick={handleSendToTelegram}
                  disabled={isSendingTelegram}
                  className="w-full py-4 px-6 border font-bold clipped-corner transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: '#00f0ff', color: '#00f0ff', background: 'rgba(0, 240, 255, 0.02)' }}
                >
                  {isSendingTelegram ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      ENVIANDO A TELEGRAM...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      ENVIAR A TELEGRAM
                    </>
                  )}
                </button>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-primary text-on-primary font-extrabold clipped-corner hover:shadow-[0_0_20px_rgba(0,219,233,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    UPDATING...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">publish</span>
                    UPDATE CONTENT
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SEO & Metadata */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6 space-y-4">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant">METADATA SCORE</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Hexagon Score */}
                <svg className="absolute inset-0 w-full h-full rotate-90" viewBox="0 0 100 100">
                  <polygon fill="none" points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="#ffffff1a" strokeWidth="8"></polygon>
                  <polygon className="transition-all duration-1000" fill="none" points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="#33fb0a" strokeDasharray="300" strokeDashoffset="40" strokeWidth="8"></polygon>
                </svg>
                <span className="font-stats-num text-stats-num text-tertiary z-10">8.2</span>
              </div>
              
              <div className="flex-1 space-y-1">
                <p className="font-body-md text-on-surface font-bold">SEO Optimization High</p>
                <p className="font-label-caps text-[10px] text-on-surface-variant/60">3 Issues Detected • 12 Keywords found</p>
              </div>
            </div>
            
            <Link href="/admin" className="w-full text-left p-3 hover:bg-surface-bright rounded border border-transparent hover:border-outline-variant transition-all flex items-center justify-between font-bold">
              <span className="font-body-md">View SEO Recommendations</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </div>

          {/* Live Update Badge */}
          <div className="p-4 bg-error/5 border border-error/20 rounded-lg flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
            </span>
            <span className="font-label-caps text-[11px] text-error font-bold">LIVE EVENT BROADCASTING MODE ACTIVE</span>
          </div>

        </section>
      </form>
    </div>
  );
}
