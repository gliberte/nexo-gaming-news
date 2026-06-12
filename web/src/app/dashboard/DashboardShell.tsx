"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard, Profile } from "./context";

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profiles, activeProfile, setActiveProfileById } = useDashboard();
  const pathname = usePathname();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const navItems = [
    { name: "Discovery Feed", href: "/dashboard/feed", icon: "📰" },
    { name: "Branding Studio", href: "/dashboard/branding", icon: "🎨" },
    { name: "Pitch Generator", href: "/dashboard/pitch-generator", icon: "✍️" },
    { name: "Billing & Limits", href: "/dashboard/billing", icon: "💳" },
  ];

  // Helper to determine if link is active
  const isActive = (href: string) => {
    if (href === "/dashboard/feed" && pathname.startsWith("/dashboard/editor")) {
      return true; // Keep feed active when editing
    }
    return pathname === href;
  };

  const usagePercent = Math.min(
    100,
    (activeProfile.videos_rendered / activeProfile.videos_limit) * 100
  );

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Hidden on mobile */}
      <aside className="w-80 bg-[#121215] border-r border-zinc-800/80 flex-shrink-0 hidden md:flex flex-col justify-between sticky top-0 h-screen p-6">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-800/50">
            <img 
              src="/logo.jpg" 
              alt="Nexo Gaming" 
              className="w-10 h-10 rounded-full border border-purple-500/40"
            />
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-purple-400">caas dashboard</div>
              <div className="font-bold text-lg text-zinc-100 leading-tight">Nexo Video Engine</div>
            </div>
          </div>

          {/* Profile Switcher Card */}
          <div className="bg-[#18181c] border border-zinc-800 rounded-xl p-4 mb-8 relative">
            <div className="flex items-center gap-3">
              <img 
                src={activeProfile.logo_url} 
                alt={activeProfile.name}
                className="w-10 h-10 rounded-full object-cover border border-purple-500/50"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-zinc-500 font-mono">active creator</div>
                <div className="font-bold text-sm text-zinc-200 truncate">{activeProfile.name}</div>
              </div>
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
                title="Switch Profile"
              >
                ▼
              </button>
            </div>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute left-0 right-0 mt-2 bg-[#1b1b22] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-zinc-800/55 bg-zinc-950/45 text-[10px] font-mono text-zinc-500 px-3">
                  SELECT CREATOR ACCOUNT
                </div>
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProfileById(p.id);
                      setShowProfileDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-800/70 transition-colors ${
                      p.id === activeProfile.id ? "bg-purple-900/15 border-l-2 border-purple-500" : ""
                    }`}
                  >
                    <img 
                      src={p.logo_url} 
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-zinc-200">{p.name}</div>
                      <div className="text-xs text-zinc-500 font-mono">{p.current_plan} Plan</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Video usage meter */}
            <div className="mt-4 pt-3 border-t border-zinc-800/60">
              <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                <span>Monthly Quota</span>
                <span>{activeProfile.videos_rendered} / {activeProfile.videos_limit} videos</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" 
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(item.href)
                    ? "bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-zinc-800/50 flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
          >
            ← Back to Home Page
          </Link>
          <div className="text-[10px] font-mono text-zinc-600">
            NexoGaming CaaS v1.0.0
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#121215] border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img 
            src={activeProfile.logo_url} 
            alt={activeProfile.name}
            className="w-8 h-8 rounded-full object-cover border border-purple-500/50"
          />
          <div>
            <span className="font-bold text-sm block">{activeProfile.name}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{activeProfile.current_plan} Plan</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick select dropdown */}
          <select
            value={activeProfile.id}
            onChange={(e) => setActiveProfileById(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-xs px-2 py-1 rounded font-mono text-zinc-300 focus:outline-none"
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-[#121215]/40 backdrop-blur border-b border-zinc-800/60 h-20 items-center justify-between px-8 z-30">
          <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs">
            <span>DASHBOARD</span>
            <span>/</span>
            <span className="text-zinc-100 uppercase tracking-wider font-bold">
              {pathname.split("/").pop() || "FEED"}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Server Connection Indicator */}
            <div className="flex items-center gap-2 bg-[#18181c] px-3.5 py-1.5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Engine Online</span>
            </div>

            {/* Quick stats */}
            <div className="text-right text-xs border-r border-zinc-800/80 pr-6">
              <div className="text-zinc-500">Render Limit</div>
              <div className="font-bold text-zinc-200 font-mono">
                {activeProfile.videos_rendered} / {activeProfile.videos_limit}
              </div>
            </div>

            {/* Logout/Back Button */}
            <Link 
              href="/"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </header>

        {/* Content Children */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121215] border-t border-zinc-800 h-16 flex items-center justify-around z-40 px-2 shadow-2xl">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors ${
              isActive(item.href)
                ? "text-purple-400 font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="text-lg mb-0.5">{item.icon}</span>
            <span className="text-[10px] tracking-tight truncate max-w-[80px]">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};
