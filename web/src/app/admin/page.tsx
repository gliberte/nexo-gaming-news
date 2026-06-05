"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdminDataAction } from "./data-actions";

export default function AdminDashboard() {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("admin_password");
    if (savedPassword) {
      loadData(savedPassword);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadData = async (pass: string) => {
    try {
      const data = await getAdminDataAction(pass);
      setNews(data);
    } catch (err: any) {
      setError("Error al cargar los datos.");
      sessionStorage.removeItem("admin_password");
      // Force reload to show login screen
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  const totalArticles = news.length;
  const pendingReviews = news.filter(n => n.status === 'draft').length;
  const activePublished = news.filter(n => n.status === 'published').length;

  if (isLoading) {
    return <div className="p-8 text-on-surface">Cargando Dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-error">{error}</div>;
  }

  return (
    <div className="p-8">
      {/* Dashboard Header / Analytics Bento */}
      <section className="mb-10">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">System Overview</h3>
            <p className="font-body-md text-on-surface-variant">Real-time status of the Nexo editorial pipeline.</p>
          </div>
        </div>

        <div className="bento-grid">
          {/* Stat Card 1 */}
          <div className="col-span-12 md:col-span-4 lg:col-span-4 glass-panel p-6 cyber-border">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Total Articles</p>
            <div className="flex items-end justify-between">
              <h4 className="font-stats-num text-[32px] font-extrabold text-primary">{totalArticles}</h4>
            </div>
            <div className="mt-4 h-1 bg-outline-variant w-full overflow-hidden">
              <div className="h-full bg-primary w-full shadow-[0_0_8px_#00dbe9]"></div>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="col-span-12 md:col-span-4 lg:col-span-4 glass-panel p-6 cyber-border">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Pending / Drafts</p>
            <div className="flex items-end justify-between">
              <h4 className="font-stats-num text-[32px] font-extrabold text-secondary">{pendingReviews}</h4>
              {pendingReviews > 0 && (
                <span className="text-secondary text-[12px] font-bold flex items-center">
                  <span className="material-symbols-outlined text-[14px]">edit_note</span> Pendiente
                </span>
              )}
            </div>
            <div className="mt-4 h-1 bg-outline-variant w-full overflow-hidden">
              <div className="h-full bg-secondary shadow-[0_0_8px_#ecb2ff]" style={{ width: `${Math.max((pendingReviews/totalArticles)*100, 5)}%` }}></div>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="col-span-12 md:col-span-4 lg:col-span-4 glass-panel p-6 cyber-border">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Active Live (Published)</p>
            <div className="flex items-end gap-3">
              <h4 className="font-stats-num text-[32px] font-extrabold text-tertiary-fixed">{activePublished}</h4>
              <div className="mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-tertiary-fixed rounded-full animate-pulse"></span>
                <span className="text-[10px] text-tertiary-fixed font-bold font-label-caps">LIVE</span>
              </div>
            </div>
            <div className="mt-4 h-1 bg-outline-variant w-full overflow-hidden">
              <div className="h-full bg-tertiary-fixed shadow-[0_0_8px_#79ff5b]" style={{ width: `${Math.max((activePublished/totalArticles)*100, 5)}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Article List Table Section */}
      <section className="glass-panel overflow-hidden border border-outline-variant rounded-xl">
        {/* Filter Bar */}
        <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
          <h4 className="font-headline-md text-[20px] font-bold text-on-surface">Recent Articles</h4>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Title & Platform</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Date</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Status</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {news.map((item) => (
                <tr key={item.id} className="hover:bg-surface-bright/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-container-highest flex-shrink-0 relative overflow-hidden rounded">
                        {item.image_url ? (
                          <img 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                            src={item.image_url} 
                            alt={item.title} 
                          />
                        ) : item.youtube_url ? (
                          <div className="w-full h-full flex items-center justify-center bg-error/20 text-error">
                            <span className="material-symbols-outlined">play_circle</span>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-outline">
                            <span className="material-symbols-outlined">article</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/editor/${item.id}`}>
                          <p className="font-body-md font-bold text-primary group-hover:underline cursor-pointer line-clamp-1">{item.title}</p>
                        </Link>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary uppercase">
                            {item.platform || "GENERAL"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-body-md text-on-surface">{new Date(item.created_at).toLocaleDateString()}</p>
                    <p className="text-[12px] text-on-surface-variant opacity-60">
                      {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {item.status === 'published' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary-container/10 border border-tertiary-container/30 rounded-full">
                        <span className="w-1.5 h-1.5 bg-tertiary-container rounded-full"></span>
                        <span className="text-[11px] font-bold text-tertiary-container font-label-caps uppercase">Published</span>
                      </div>
                    )}
                    {item.status === 'draft' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-container/10 border border-secondary-container/30 rounded-full">
                        <span className="w-1.5 h-1.5 bg-secondary-container rounded-full"></span>
                        <span className="text-[11px] font-bold text-secondary-container font-label-caps uppercase">Draft</span>
                      </div>
                    )}
                    {item.status === 'archived' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-outline-variant/10 border border-outline-variant/30 rounded-full">
                        <span className="w-1.5 h-1.5 bg-outline rounded-full"></span>
                        <span className="text-[11px] font-bold text-outline font-label-caps uppercase">Archived</span>
                      </div>
                    )}
                    {!['published', 'draft', 'archived'].includes(item.status) && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        <span className="text-[11px] font-bold text-primary font-label-caps uppercase">{item.status || "Unknown"}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/editor/${item.id}`} className="text-on-surface-variant hover:text-primary transition-colors p-2 inline-block">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {news.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">
                    No articles found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-6 bg-surface-container-lowest flex justify-between items-center border-t border-outline-variant">
          <p className="font-label-caps text-[11px] text-on-surface-variant">Showing {news.length} Articles</p>
        </div>
      </section>
    </div>
  );
}
