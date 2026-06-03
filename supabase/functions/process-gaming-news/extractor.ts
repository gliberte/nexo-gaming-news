import Parser from "https://esm.sh/rss-parser@3.13.0";

export interface GamingArticle {
  title: string;
  link: string;
  content: string;
  pubDate: string;
  platform: string;
  imageUrl?: string;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:group', 'mediaGroup'],
      ['media:thumbnail', 'mediaThumbnail']
    ]
  }
});

// Lista de feeds curados (puedes añadir o quitar según tus preferencias)
const GAMING_FEEDS = [
  { url: "https://feeds.ign.com/ign/news", platform: "IGN" },
  { url: "https://www.polygon.com/rss/index.xml", platform: "Polygon" },
  { url: "https://kotaku.com/rss", platform: "Kotaku" },
  { url: "https://www.gamespot.com/feeds/news/", platform: "GameSpot" },
  { url: "https://www.eurogamer.net/feed/news", platform: "Eurogamer" },
  // Canales de YouTube
  { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCKy1dAqELo0zrOtPkf0eTMw", platform: "IGN YouTube" },
  { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCbu2SsF-Or3Rsn3NxqODImw", platform: "GameSpot YouTube" }
];

/**
 * Lee los feeds RSS y devuelve una lista de artículos recientes.
 * @param maxItemsPerFeed Máximo número de noticias a extraer por cada feed.
 */
export async function fetchGamingNews(maxItemsPerFeed: number = 3): Promise<GamingArticle[]> {
  const articles: GamingArticle[] = [];

  for (const feedSource of GAMING_FEEDS) {
    try {
      console.log(`📡 Obteniendo noticias de ${feedSource.platform}...`);
      const feed = await parser.parseURL(feedSource.url);
      
      const recentItems = feed.items.slice(0, maxItemsPerFeed);
      
      for (const item of recentItems) {
        if (item.title && item.link) {
          let imageUrl = item.enclosure?.url;

          // Check media:content
          if (!imageUrl && item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
            imageUrl = item.mediaContent.$.url;
          }

          // Check media:thumbnail (YouTube and some feeds)
          if (!imageUrl && item.mediaGroup && item.mediaGroup['media:thumbnail']) {
            const thumbs = item.mediaGroup['media:thumbnail'];
            const thumb = Array.isArray(thumbs) ? thumbs[0] : thumbs;
            if (thumb && thumb.$ && thumb.$.url) {
              imageUrl = thumb.$.url;
            }
          }

          // Fallback regex on HTML content
          const rawContent = item.content || item.summary || "";
          if (!imageUrl) {
            const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch) imageUrl = imgMatch[1];
          }

          articles.push({
            title: item.title,
            link: item.link,
            content: item.contentSnippet || rawContent,
            pubDate: item.pubDate || new Date().toISOString(),
            platform: feedSource.platform,
            imageUrl
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error leyendo feed de ${feedSource.platform}:`, error.message);
    }
  }

  console.log(`✅ Extracción completada. ${articles.length} artículos obtenidos.`);
  return articles;
}
