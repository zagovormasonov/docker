import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Добавить эксперта в избранное
router.post('/:id/favorite', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Проверяем есть ли уже в избранном
    const existing = await query(
      'SELECT id FROM expert_favorites WHERE expert_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length > 0) {
      // Убираем из избранного
      await query(
        'DELETE FROM expert_favorites WHERE expert_id = $1 AND user_id = $2',
        [id, req.userId]
      );
      return res.json({ favorited: false });
    }

    // Добавляем в избранное
    await query(
      'INSERT INTO expert_favorites (expert_id, user_id) VALUES ($1, $2)',
      [id, req.userId]
    );

    res.json({ favorited: true });
  } catch (error) {
    console.error('Ошибка добавления эксперта в избранное:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статус избранного для эксперта
router.get('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const favoriteResult = await query(
      'SELECT id FROM expert_favorites WHERE expert_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    res.json({
      favorited: favoriteResult.rows.length > 0
    });
  } catch (error) {
    console.error('Ошибка получения статуса эксперта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить избранных экспертов пользователя
router.get('/favorites', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.bio, u.city,
              ARRAY(
                SELECT t.name 
                FROM user_topics ut 
                JOIN topics t ON ut.topic_id = t.id 
                WHERE ut.user_id = u.id
              ) as topics,
              ef.created_at as favorited_at
       FROM users u
       JOIN expert_favorites ef ON u.id = ef.expert_id
       WHERE ef.user_id = $1 AND u.user_type = 'expert'
       ORDER BY ef.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения избранных экспертов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
