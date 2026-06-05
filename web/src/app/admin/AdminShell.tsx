"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Sync initial search value from URL on mount
    const searchParam = new URLSearchParams(window.location.search).get("search") || "";
    setSearchValue(searchParam);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    const params = new URLSearchParams(window.location.search);
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    // Perform push to update the query param
    router.push(`${window.location.pathname}?${params.toString()}`);
  };


  if (isChecking) {
    return <div className="h-screen w-full flex items-center justify-center text-on-surface bg-background">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div 
        className="h-screen w-full bg-background flex items-center justify-center text-on-surface p-4 relative overflow-hidden"
        style={{
          backgroundImage: 'url("https://gemxczyelscmzgrftghf.supabase.co/storage/v1/object/public/product_images/public/fh6stadiummap.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay para oscurecer la imagen y darle un toque más elegante */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0"></div>
        
        <div className="glass-panel p-10 rounded-2xl border border-white/10 shadow-2xl w-full max-w-[420px] relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6 border border-primary/40 shadow-[0_0_20px_rgba(0,219,233,0.3)]">
            <span className="material-symbols-outlined text-3xl text-primary" data-icon="lock">lock</span>
          </div>
          
          <h2 className="font-headline-md text-3xl text-white mb-2 font-black tracking-tighter text-center">NEXO CMS</h2>
          <p className="font-label-caps text-on-surface-variant mb-8 text-center text-sm uppercase tracking-widest">Acceso Restringido</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-5 w-full">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">key</span>
              <input
                type="password"
                placeholder="Ingresa la contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-surface-container-highest/50 border border-outline-variant/50 rounded-xl py-4 pl-12 pr-4 text-white focus:border-primary focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body-md placeholder:text-on-surface-variant"
              />
            </div>
            
            <button 
              type="submit" 
              className="mt-2 w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,219,233,0.2)] hover:shadow-[0_0_30px_rgba(0,219,233,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-label-caps uppercase tracking-wider"
            >
              Autenticar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface dark font-body-md">
      
      {/* SideNavBar Shell */}
      <aside className="fixed left-0 top-0 h-full w-64 z-40 border-r border-outline-variant bg-surface-container-low dark:bg-surface-container-low backdrop-blur-xl flex flex-col justify-between">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex flex-col items-start gap-1">
            <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter">Nexo CMS</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant/60">Admin Console v1.0.4</span>
          </div>
          
          {/* Create Button */}
          <div className="px-4 mb-6">
            <Link 
              href="/admin/editor/new" 
              className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary py-3 clipped-corner font-bold hover:bg-primary/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">add</span>
              Create New Article
            </Link>
          </div>

          {/* Links */}
          <nav className="flex-1 space-y-1">
            <Link 
              href="/admin" 
              className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-bright dark:hover:bg-surface-bright hover:text-primary"
            >
              <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
              <span className="font-body-md text-body-md">Dashboard</span>
            </Link>
            
            <Link 
              href="/admin" 
              className={`flex items-center gap-3 px-4 py-3 transition-all scale-[0.99] ${
                pathname === '/admin' || pathname.includes('/admin/editor')
                  ? 'text-primary bg-primary/10 border-r-2 border-primary' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright dark:hover:bg-surface-bright hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined" data-icon="article">article</span>
              <span className="font-body-md text-body-md">Articles</span>
            </Link>
            
            <Link 
              href="/admin" 
              className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-bright dark:hover:bg-surface-bright hover:text-primary"
            >
              <span className="material-symbols-outlined" data-icon="perm_media">perm_media</span>
              <span className="font-body-md text-body-md">Media Library</span>
            </Link>
            
            <Link 
              href="/admin" 
              className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-bright dark:hover:bg-surface-bright hover:text-primary"
            >
              <span className="material-symbols-outlined" data-icon="monitoring">monitoring</span>
              <span className="font-body-md text-body-md">Analytics</span>
            </Link>
          </nav>
        </div>
        
        {/* Bottom Panel */}
        <div className="mt-auto border-t border-outline-variant p-2 flex flex-col gap-1">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span className="font-label-caps text-label-caps">Settings</span>
          </Link>
          
          <Link 
            href="/admin" 
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined" data-icon="help_center">help_center</span>
            <span className="font-label-caps text-label-caps">Support</span>
          </Link>
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined" data-icon="logout">logout</span>
            <span className="font-label-caps text-label-caps text-xs">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* TopAppBar Shell */}
      <header 
        className="fixed top-0 right-0 h-16 flex justify-between items-center px-8 z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-outline-variant shadow-[0_4px_20px_rgba(0,219,233,0.05)]"
        style={{ left: "256px" }}
      >
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-widest">Nexo Gaming News</span>
          <nav className="hidden md:flex gap-6">
            <Link className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200" href="/admin">Overview</Link>
            <Link className="text-primary font-bold border-b-2 border-primary pb-1" href="/admin">Recent Updates</Link>
            <Link className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200" href="/admin">Editorial Guidelines</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative group hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              value={searchValue}
              onChange={handleSearchChange}
              className="bg-surface-container-high border-none border-b border-outline-variant focus:ring-0 focus:border-primary text-on-surface font-label-caps text-[12px] pl-10 pr-4 py-2 w-48 lg:w-64 transition-all focus:shadow-[0_0_15px_rgba(0,219,233,0.2)] focus:outline-none" 
              placeholder="Search entries..." 
              type="text"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors cursor-pointer">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full animate-pulse"></span>
            </div>
            
            <button className="bg-primary px-4 py-1.5 text-on-primary font-bold clipped-corner hover:shadow-[0_0_10px_rgba(0,219,233,0.3)] transition-all cursor-pointer">
              Publish All
            </button>
            
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
              <img 
                alt="Administrator Profile" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwgp-MA3wuFGUkOBsNRrlsYZEaK4afVeK0OJBej1ZnLthUMcD8wfFSwK2IYI2qz1ZcfoGKmmWXQz3jTv9eDZPXOmG5seeUKGaexJH289Xr98iWCWUkwt2YBBALLOnX-ydb0ZkenK3FXxdPZctFWa68s-SOiOfZQQTPhTd47GG0BLDFXEupHjVWhsTHDnQsrSqSj3f0qWEbZ3VuM6JRgyV0zD14euOPqbyzcPHblQTLsshRvWC3r-v5dDaBE2XLsOf1atPoc_L6PBQ" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 h-screen flex flex-col bg-background" style={{ marginLeft: "256px" }}>
        {children}
      </main>

    </div>
  );
}
