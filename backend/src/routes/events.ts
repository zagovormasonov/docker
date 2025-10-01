import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authenticateToken, requireExpert, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Получение всех опубликованных событий
router.get('/', async (req, res) => {
  try {
    const { city, sort = 'date' } = req.query;

    let orderBy = 'e.event_date ASC';
    if (sort === 'new') {
      orderBy = 'e.created_at DESC';
    } else if (sort === 'popular') {
      orderBy = 'e.views DESC';
    }

    let whereClause = 'e.is_published = true';
    const params: any[] = [];
    
    if (city) {
      whereClause += ' AND e.city = $1';
      params.push(city);
    }

    const result = await query(
      `SELECT e.*, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar
       FROM events e
       JOIN users u ON e.author_id = u.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT 100`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения событий:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение события по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT e.*, u.name as author_name, u.avatar_url as author_avatar, u.id as author_id
       FROM events e
       JOIN users u ON e.author_id = u.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    // Увеличение счетчика просмотров
    await query('UPDATE events SET views = views + 1 WHERE id = $1', [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения события:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение событий пользователя
router.get('/my/events', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM events 
       WHERE author_id = $1 
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения событий пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание события
router.post(
  '/',
  authenticateToken,
  requireExpert,
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 50 }),
    body('city').notEmpty(),
    body('eventType').notEmpty(),
    body('eventDate').isISO8601()
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content, coverImage, city, eventType, eventDate, isPublished = true } = req.body;

      const result = await query(
        `INSERT INTO events (author_id, title, content, cover_image, city, event_type, event_date, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.userId, title, content, coverImage || null, city, eventType, eventDate, isPublished]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка создания события:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Обновление события
router.put(
  '/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, content, coverImage, city, eventType, eventDate, isPublished } = req.body;

      const result = await query(
        `UPDATE events 
         SET title = COALESCE($1, title),
             content = COALESCE($2, content),
             cover_image = COALESCE($3, cover_image),
             city = COALESCE($4, city),
             event_type = COALESCE($5, event_type),
             event_date = COALESCE($6, event_date),
             is_published = COALESCE($7, is_published),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 AND author_id = $9
         RETURNING *`,
        [title, content, coverImage, city, eventType, eventDate, isPublished, id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка обновления события:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Удаление события
router.delete(
  '/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const result = await query(
        'DELETE FROM events WHERE id = $1 AND author_id = $2 RETURNING id',
        [id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено или у вас нет прав' });
      }

      res.json({ message: 'Событие удалено' });
    } catch (error) {
      console.error('Ошибка удаления события:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

export default router;

