import { getSupabaseServerClient } from "../utils/supabase";
import Link from 'next/link';
import NewsFeed from './components/NewsFeed';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const supabase = getSupabaseServerClient();
  
  // Obtener los creadores cuyo nicho es "music" para excluirlos del feed principal de gaming
  const { data: musicCreators } = await supabase
    .from("creator_settings")
    .select("user_id")
    .eq("niche", "music");

  const musicUserIds = musicCreators?.map((c) => c.user_id) || [];

  let query = supabase
    .from("published_news")
    .select("*")
    .eq("status", "published");

  if (musicUserIds.length > 0) {
    query = query.not("user_id", "in", `(${musicUserIds.join(",")})`);
  }

  const { data: newsItems, error } = await query
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching news:", error);
  }

  return (
    <main className="container">
      <header className="brand-header" style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Link href="/" style={{ display: 'flex', gap: '20px', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <img 
            src="/logo.jpg" 
            alt="Nexo Gaming News Logo" 
            className="brand-logo"
          />
          <div>
            <div className="label-caps" style={{ color: 'var(--primary-container)', marginBottom: '4px' }}>Gamer Vanguard Network</div>
            <h1 style={{ margin: 0, fontSize: '32px' }}>NexoGamingNews</h1>
          </div>
        </Link>
        
        {/* Enlace al Dashboard de Creador (CaaS) */}
        <div>
          <Link 
            href="/dashboard/feed" 
            className="platform-tag" 
            style={{ 
              textDecoration: 'none', 
              background: 'rgba(139, 92, 246, 0.15)', 
              color: '#a78bfa', 
              borderColor: '#8b5cf6',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            Panel de Creador CaaS ⚡
          </Link>
        </div>
      </header>

      <NewsFeed initialNewsItems={newsItems || []} />
    </main>
  );
}
