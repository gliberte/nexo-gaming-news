"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("admin_password");
    if (savedPassword) {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() !== "") {
      sessionStorage.setItem("admin_password", passwordInput);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_password");
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  if (isChecking) {
    return <div className="h-screen w-full flex items-center justify-center text-on-surface bg-background">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center text-on-surface p-4">
        <div className="glass-panel p-8 rounded-xl cyber-border w-full max-w-[400px]">
          <h2 className="font-headline-md text-2xl text-primary mb-6 font-bold tracking-tighter">Nexo CMS</h2>
          <p className="font-label-caps text-on-surface-variant mb-6">Acceso Restringido</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Contraseña"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded p-3 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all font-body-md"
            />
            <button type="submit" className="bg-primary text-on-primary font-bold py-3 clipped-corner hover:shadow-[0_0_15px_rgba(0,219,233,0.4)] transition-all font-label-caps uppercase">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Layout normal del Admin (SideNavBar + TopAppBar)
  return (
    <div className="min-h-screen bg-background text-on-surface custom-scrollbar font-body-md flex dark">
      {/* SideNavBar Shell */}
      <aside className="fixed left-0 top-0 h-full flex flex-col z-40 bg-surface-container-low backdrop-blur-xl border-r border-outline-variant w-64">
        <div className="p-6">
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tighter">Nexo CMS</h1>
          <p className="font-label-caps text-label-caps text-on-surface-variant opacity-70 mt-1">Admin Console v1.0.4</p>
        </div>
        
        <div className="px-4 mb-6">
          <Link href="/admin/editor/new" className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary py-3 clipped-corner font-bold hover:bg-primary/20 transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label-caps text-label-caps">Nueva Noticia</span>
          </Link>
        </div>

        <div className="flex-1 px-2 space-y-1">
          <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 transition-all ${pathname === '/admin' ? 'text-primary bg-primary/10 border-r-2 border-primary scale-[0.99]' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright'}`}>
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span className="font-label-caps text-label-caps">Dashboard</span>
          </Link>
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all">
            <span className="material-symbols-outlined" data-icon="article">article</span>
            <span className="font-label-caps text-label-caps">Articles</span>
          </Link>
        </div>
        
        <div className="border-t border-outline-variant p-2 space-y-1 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-error hover:bg-surface-bright transition-all">
            <span className="material-symbols-outlined" data-icon="logout">logout</span>
            <span className="font-label-caps text-label-caps">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* TopAppBar Shell */}
      <header className="fixed top-0 right-0 left-64 h-16 flex justify-between items-center px-8 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant shadow-[0_4px_20px_rgba(0,219,233,0.05)]">
        <div className="flex items-center gap-8">
          <h2 className="font-headline-md text-[20px] font-extrabold text-primary tracking-widest hidden lg:block">Nexo Gaming News</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
              <div className="text-right hidden xl:block">
                <p className="font-label-caps text-[10px] text-on-surface-variant leading-none">Logged in as</p>
                <p className="font-body-md text-[14px] font-bold text-primary">Admin_Zero</p>
              </div>
              <div className="w-10 h-10 rounded-lg border border-primary/20 overflow-hidden bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">shield_person</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="ml-64 pt-16 flex-1 bg-background relative z-10 w-[calc(100%-16rem)]">
        {children}
      </main>
    </div>
  );
}
