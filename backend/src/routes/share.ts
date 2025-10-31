import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// Превью-страница для шаринга статей с OpenGraph/Twitter мета-тегами
router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT a.*, u.name as author_name
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Not found');
    }

    const article = result.rows[0];
    const stripHtml = (html: string) => {
      const withoutTags = (html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return withoutTags;
    };

    const description = stripHtml(article.content).slice(0, 180);
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
    const hostBase = `${forwardedProto}://${forwardedHost}`;
    const frontendUrl = process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('http')
      ? process.env.FRONTEND_URL.replace(/\/$/, '')
      : hostBase.replace(/:\d+$/, '');

    // Нормализуем обложку в абсолютный URL
    const rawCover: string = article.cover_image || '/logo.png';
    const cover = rawCover.startsWith('http')
      ? rawCover
      : `${hostBase}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;

    const spaUrl = `${frontendUrl}/articles/${article.id}`;
    const pageTitle = `${article.title} — SoulSynergy`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${article.title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="${cover}">
  <meta property="og:url" content="${spaUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${article.title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${cover}">
  <meta http-equiv="refresh" content="1;url=${spaUrl}">
  <style>
    body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f6f7fb; margin:0; padding:24px;}
    .card{max-width:720px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.06)}
    .image{width:100%;height:360px;object-fit:cover;display:block}
    .content{padding:24px}
    .title{font-size:28px;margin:0 0 8px 0}
    .desc{color:#666;line-height:1.6}
    .footer{padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
    .btn{background:#6366f1;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <img class="image" src="${cover}" alt="${article.title}" />
    <div class="content">
      <h1 class="title">${article.title}</h1>
      <p class="desc">${description}</p>
    </div>
    <div class="footer">
      <span>Автор: ${article.author_name}</span>
      <a class="btn" href="${spaUrl}">Открыть статью</a>
    </div>
  </div>
</body>
</html>`);
  } catch (e) {
    console.error('Share page error', e);
    res.status(500).send('Server error');
  }
});

// Превью-страница для шаринга событий
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT e.*, u.name as organizer_name
       FROM events e
       LEFT JOIN users u ON e.organizer_id = u.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Not found');
    }

    const event = result.rows[0];
    const strip = (text: string) => (text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const description = strip(event.description).slice(0, 180);

    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
    const hostBase = `${forwardedProto}://${forwardedHost}`;
    const frontendUrl = process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('http')
      ? process.env.FRONTEND_URL.replace(/\/$/, '')
      : hostBase.replace(/:\d+$/, '');

    const rawCover: string = event.cover_image || '/logo.png';
    const cover = rawCover.startsWith('http') ? rawCover : `${hostBase}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;
    const spaUrl = `${frontendUrl}/events/${event.id}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${event.title} — Событие — SoulSynergy</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${event.title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="event">
  <meta property="og:image" content="${cover}">
  <meta property="og:url" content="${spaUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${event.title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${cover}">
  <meta http-equiv="refresh" content="1;url=${spaUrl}">
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f6f7fb;margin:0;padding:24px}
    .card{max-width:720px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.06)}
    .image{width:100%;height:360px;object-fit:cover;display:block}
    .content{padding:24px}
    .title{font-size:28px;margin:0 0 8px 0}
    .desc{color:#666;line-height:1.6}
    .footer{padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
    .btn{background:#6366f1;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <img class="image" src="${cover}" alt="${event.title}" />
    <div class="content">
      <h1 class="title">${event.title}</h1>
      <p class="desc">${description}</p>
    </div>
    <div class="footer">
      <span>Организатор: ${event.organizer_name || ''}</span>
      <a class="btn" href="${spaUrl}">Открыть событие</a>
    </div>
  </div>
</body>
</html>`);
  } catch (e) {
    console.error('Share event error', e);
    res.status(500).send('Server error');
  }
});

export default router;


