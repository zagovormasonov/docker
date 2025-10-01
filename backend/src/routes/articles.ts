import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authenticateToken, requireExpert, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Получение статей пользователя (должен быть перед /:id)
router.get('/my/articles', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM articles 
       WHERE author_id = $1 
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения статей пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение статей конкретного автора
router.get('/author/:authorId', async (req, res) => {
  try {
    const { authorId } = req.params;
    
    const result = await query(
      `SELECT a.*, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
       COALESCE(a.likes_count, 0) as likes_count
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.author_id = $1 AND a.is_published = true
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [authorId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения статей автора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех опубликованных статей
router.get('/', async (req, res) => {
  try {
    const { sort = 'new' } = req.query;

    let orderBy = 'a.created_at DESC';
    if (sort === 'popular') {
      orderBy = 'a.views DESC, a.created_at DESC';
    }

    const result = await query(
      `SELECT a.*, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
       COALESCE(a.likes_count, 0) as likes_count
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.is_published = true
       ORDER BY ${orderBy}
       LIMIT 100`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения статей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение статьи по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.*, u.name as author_name, u.avatar_url as author_avatar, u.id as author_id,
       COALESCE(a.likes_count, 0) as likes_count
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    // Увеличение счетчика просмотров
    await query('UPDATE articles SET views = views + 1 WHERE id = $1', [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения статьи:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание статьи
router.post(
  '/',
  authenticateToken,
  requireExpert,
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 50 })
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content, coverImage, isPublished = true } = req.body;

      const result = await query(
        `INSERT INTO articles (author_id, title, content, cover_image, is_published)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.userId, title, content, coverImage || null, isPublished]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка создания статьи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Обновление статьи
router.put(
  '/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, content, coverImage, isPublished } = req.body;

      const result = await query(
        `UPDATE articles 
         SET title = COALESCE($1, title),
             content = COALESCE($2, content),
             cover_image = COALESCE($3, cover_image),
             is_published = COALESCE($4, is_published),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 AND author_id = $6
         RETURNING *`,
        [title, content, coverImage, isPublished, id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Статья не найдена' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка обновления статьи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Удаление статьи
router.delete(
  '/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const result = await query(
        'DELETE FROM articles WHERE id = $1 AND author_id = $2 RETURNING id',
        [id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Статья не найдена или у вас нет прав' });
      }

      res.json({ message: 'Статья удалена' });
    } catch (error) {
      console.error('Ошибка удаления статьи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

export default router;
