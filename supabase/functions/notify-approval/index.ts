interface WebhookPayload {
  type: 'INSERT' | 'UPDATE';
  table: string;
  record: {
    id: string;
    source_url: string;
    title: string;
    draft_content: string;
    status: string;
  };
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || '';

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const payload: WebhookPayload = await req.json();

    if (payload.record?.status !== 'draft_ready') {
      return new Response('No action needed', { status: 200 });
    }

    const { title, draft_content, source_url } = payload.record;

    const telegramMessage = `
🗺️ *Nuevo Borrador GIS Listo* 🗺️

*Título:* ${title}
*Fuente:* ${source_url}

*Borrador para LinkedIn:*
${draft_content}

¿Deseas publicar este contenido?
    `.trim();

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const telegramResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'Markdown',
      }),
    });

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();
      throw new Error(`Error enviando a Telegram: ${errorText}`);
    }

    return new Response(JSON.stringify({ message: 'Notificación enviada' }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error enviando notificación', details: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
