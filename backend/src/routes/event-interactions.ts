import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Добавить событие в избранное
router.post('/:id/favorite', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Проверяем есть ли уже в избранном
    const existing = await query(
      'SELECT id FROM event_favorites WHERE event_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length > 0) {
      // Убираем из избранного
      await query(
        'DELETE FROM event_favorites WHERE event_id = $1 AND user_id = $2',
        [id, req.userId]
      );
      return res.json({ favorited: false });
    }

    // Добавляем в избранное
    await query(
      'INSERT INTO event_favorites (event_id, user_id) VALUES ($1, $2)',
      [id, req.userId]
    );

    res.json({ favorited: true });
  } catch (error) {
    console.error('Ошибка добавления события в избранное:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статус избранного для события
router.get('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const favoriteResult = await query(
      'SELECT id FROM event_favorites WHERE event_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    res.json({
      favorited: favoriteResult.rows.length > 0
    });
  } catch (error) {
    console.error('Ошибка получения статуса события:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить избранные события пользователя
router.get('/favorites', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT e.*, u.name as organizer_name, u.avatar_url as organizer_avatar,
              c.name as city_name, ef.created_at as favorited_at
       FROM events e
       JOIN event_favorites ef ON e.id = ef.event_id
       LEFT JOIN users u ON e.organizer_id = u.id
       LEFT JOIN cities c ON e.city_id = c.id
       WHERE ef.user_id = $1
       ORDER BY ef.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения избранных событий:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
