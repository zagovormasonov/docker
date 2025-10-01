import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Лайкнуть статью
router.post('/:id/like', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Проверяем есть ли уже лайк
    const existing = await query(
      'SELECT id FROM article_likes WHERE article_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length > 0) {
      // Убираем лайк
      await query(
        'DELETE FROM article_likes WHERE article_id = $1 AND user_id = $2',
        [id, req.userId]
      );
      await query(
        'UPDATE articles SET likes_count = likes_count - 1 WHERE id = $1',
        [id]
      );
      return res.json({ liked: false });
    }

    // Добавляем лайк
    await query(
      'INSERT INTO article_likes (article_id, user_id) VALUES ($1, $2)',
      [id, req.userId]
    );
    await query(
      'UPDATE articles SET likes_count = likes_count + 1 WHERE id = $1',
      [id]
    );

    res.json({ liked: true });
  } catch (error) {
    console.error('Ошибка лайка:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить в избранное
router.post('/:id/favorite', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Проверяем есть ли уже в избранном
    const existing = await query(
      'SELECT id FROM article_favorites WHERE article_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length > 0) {
      // Убираем из избранного
      await query(
        'DELETE FROM article_favorites WHERE article_id = $1 AND user_id = $2',
        [id, req.userId]
      );
      return res.json({ favorited: false });
    }

    // Добавляем в избранное
    await query(
      'INSERT INTO article_favorites (article_id, user_id) VALUES ($1, $2)',
      [id, req.userId]
    );

    res.json({ favorited: true });
  } catch (error) {
    console.error('Ошибка добавления в избранное:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статус лайка и избранного для статьи
router.get('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const likeResult = await query(
      'SELECT id FROM article_likes WHERE article_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    const favoriteResult = await query(
      'SELECT id FROM article_favorites WHERE article_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    res.json({
      liked: likeResult.rows.length > 0,
      favorited: favoriteResult.rows.length > 0
    });
  } catch (error) {
    console.error('Ошибка получения статуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить избранные статьи пользователя
router.get('/favorites', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar
       FROM articles a
       JOIN article_favorites af ON a.id = af.article_id
       JOIN users u ON a.author_id = u.id
       WHERE af.user_id = $1
       ORDER BY af.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения избранного:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

