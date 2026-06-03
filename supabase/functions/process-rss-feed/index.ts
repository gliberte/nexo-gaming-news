import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Parser from 'rss-parser';

interface RssItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
}

interface ContentRecord {
  source_url: string;
  title: string;
  draft_content: string;
  status: 'draft_ready';
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

// Array de feeds por defecto con las principales fuentes GIS
const defaultFeeds = [
  'https://www.esri.com/arcgis-blog/feed/',
  'https://www.gislounge.com/feed/',
  'https://blog.qgis.org/feed/',
  'https://medium.com/feed/google-earth',
  'https://blog.mapbox.com/feed'
];

// Soporte para leer desde entorno separando por comas (por si a futuro quieres cambiarlo desde el dashboard)
const RSS_FEED_URLS_ENV = Deno.env.get('RSS_FEED_URLS');
const feeds = RSS_FEED_URLS_ENV ? RSS_FEED_URLS_ENV.split(',').map(s => s.trim()) : defaultFeeds;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

Deno.serve(async (req: Request) => {
  try {
    const processedItems = [];
    const executionErrors = [];
    let processedCount = 0;
    const MAX_ITEMS_PER_RUN = 3; 

    for (const feedUrl of feeds) {
      if (processedCount >= MAX_ITEMS_PER_RUN) break;

      try {
        const feed = await parser.parseURL(feedUrl);
        if (!feed.items || feed.items.length === 0) {
          executionErrors.push({ feed: feedUrl, error: 'Feed vacío o bloqueado' });
          continue;
        }

        const itemsToProcess = feed.items.slice(0, 3) as RssItem[];

        for (const item of itemsToProcess) {
          if (processedCount >= MAX_ITEMS_PER_RUN) break;
          
          const { title, link, contentSnippet } = item;
          if (!link || !title) continue;

          try {
            const { data: existingRecord, error: searchError } = await supabase
              .from('content_pipeline')
              .select('id')
              .eq('source_url', link)
              .maybeSingle();

            if (searchError) {
              executionErrors.push({ link, step: 'db_search', error: searchError.message });
              continue;
            }
            if (existingRecord) continue; // Ya existe

            const prompt = `Actúa como un experto en GIS. Resume este artículo en un post de LinkedIn de 3 párrafos, en español, con un tono analítico. Destaca herramientas o plataformas mencionadas.\n\nTítulo: ${title}\nEnlace: ${link}\nResumen original: ${contentSnippet || ''}`;

            // Pequeña pausa de 2.5s para no saturar el Tier Gratuito de Gemini (5 per minute)
            await new Promise(resolve => setTimeout(resolve, 2500));
            const response = await model.generateContent(prompt);
            const draftContent = response.response.text();
            
            if (!draftContent) {
              executionErrors.push({ link, step: 'gemini', error: 'Gemini devolvió contenido vacío' });
              continue;
            }

            const newRecord: ContentRecord = {
              source_url: link,
              title: title,
              draft_content: draftContent,
              status: 'draft_ready',
            };

            const { error: insertError } = await supabase
              .from('content_pipeline')
              .insert(newRecord);

            if (!insertError) {
              processedItems.push({ feed: feedUrl, title, link });
              processedCount++;
            } else {
              executionErrors.push({ link, step: 'db_insert', error: insertError.message });
            }
          } catch (itemError) {
            executionErrors.push({ link, step: 'processing_item', error: (itemError as Error).message });
          }
        }
      } catch (feedError) {
        executionErrors.push({ feed: feedUrl, step: 'fetching_rss', error: (feedError as Error).message });
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Procesamiento completado', 
      processed_count: processedCount,
      items: processedItems,
      errors: executionErrors
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
