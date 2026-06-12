"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Profile {
  id: string;
  name: string;
  logo_url: string;
  primary_color: string;
  highlight_color: string;
  watermark_text: string;
  title: string;
  font_family: string;
  current_plan: string;
  videos_rendered: number;
  videos_limit: number;
  niche?: 'gaming' | 'music';
}

const DEFAULT_PROFILES: Profile[] = [
  {
    id: "gamervanguard",
    name: "GamerVanguard",
    logo_url: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=200&auto=format&fit=crop",
    primary_color: "#8b5cf6",
    highlight_color: "#fbff00",
    watermark_text: "gamervanguard.gg",
    title: "Gamer Vanguard",
    font_family: "Orbitron",
    current_plan: "Starter",
    videos_rendered: 7,
    videos_limit: 10,
    niche: "gaming"
  },
  {
    id: "retrozone",
    name: "RetroZone",
    logo_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop",
    primary_color: "#00f0ff",
    highlight_color: "#ff0055",
    watermark_text: "retrozone.tv",
    title: "Retro Zone",
    font_family: "Sora",
    current_plan: "Creator",
    videos_rendered: 12,
    videos_limit: 30,
    niche: "gaming"
  },
  {
    id: "acordesocultos",
    name: "AcordesOcultos",
    logo_url: "/music-logo.png",
    primary_color: "#ff007f",
    highlight_color: "#00f0ff",
    watermark_text: "acordesocultos.tv",
    title: "Acordes Ocultos",
    font_family: "Luckiest Guy",
    current_plan: "Creator",
    videos_rendered: 0,
    videos_limit: 30,
    niche: "music"
  },
  {
    id: "default-creator",
    name: "Default Creator",
    logo_url: "/logo.jpg",
    primary_color: "#10b981",
    highlight_color: "#fbff00",
    watermark_text: "nexogaming.news",
    title: "Nexo Gaming",
    font_family: "Inter",
    current_plan: "Agency",
    videos_rendered: 45,
    videos_limit: 1000,
    niche: "gaming"
  }
];

interface DashboardContextType {
  profiles: Profile[];
  activeProfile: Profile;
  setActiveProfileById: (id: string) => void;
  updateActiveProfile: (updates: Partial<Profile>) => void;
  resetProfiles: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("gamervanguard");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("caas_profiles");
    const savedActive = localStorage.getItem("caas_active_profile_id");
    
    let loadedProfiles = DEFAULT_PROFILES;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Si falta el perfil de acordesocultos, lo inyectamos de DEFAULT_PROFILES
          const hasMusic = parsed.some((p: any) => p.id === "acordesocultos");
          if (!hasMusic) {
            const musicProfile = DEFAULT_PROFILES.find(p => p.id === "acordesocultos");
            if (musicProfile) {
              parsed.push(musicProfile);
              localStorage.setItem("caas_profiles", JSON.stringify(parsed));
            }
          }
          loadedProfiles = parsed;
        }
      } catch (e) {
        loadedProfiles = DEFAULT_PROFILES;
      }
    } else {
      localStorage.setItem("caas_profiles", JSON.stringify(DEFAULT_PROFILES));
    }

    setProfiles(loadedProfiles);

    if (savedActive) {
      setActiveProfileId(savedActive);
    }
  }, []);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];

  const setActiveProfileById = (id: string) => {
    setActiveProfileId(id);
    localStorage.setItem("caas_active_profile_id", id);
  };

  const updateActiveProfile = (updates: Partial<Profile>) => {
    const updatedProfiles = profiles.map(p => {
      if (p.id === activeProfile.id) {
        const next = { ...p, ...updates };
        return next;
      }
      return p;
    });
    setProfiles(updatedProfiles);
    localStorage.setItem("caas_profiles", JSON.stringify(updatedProfiles));
  };

  const resetProfiles = () => {
    setProfiles(DEFAULT_PROFILES);
    setActiveProfileId("gamervanguard");
    localStorage.setItem("caas_profiles", JSON.stringify(DEFAULT_PROFILES));
    localStorage.setItem("caas_active_profile_id", "gamervanguard");
  };

  return (
    <DashboardContext.Provider value={{
      profiles,
      activeProfile,
      setActiveProfileById,
      updateActiveProfile,
      resetProfiles
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
