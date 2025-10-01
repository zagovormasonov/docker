import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Получение текущего пользователя
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, user_type, avatar_url, bio, city, created_at 
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const dbUser = result.rows[0];

    // Преобразуем snake_case в camelCase для frontend
    const user: any = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      userType: dbUser.user_type,
      avatarUrl: dbUser.avatar_url,
      bio: dbUser.bio,
      city: dbUser.city,
      createdAt: dbUser.created_at
    };

    // Если эксперт, получить тематики
    if (user.userType === 'expert') {
      const topicsResult = await query(
        `SELECT t.id, t.name FROM topics t
         JOIN expert_topics et ON t.id = et.topic_id
         WHERE et.expert_id = $1`,
        [req.userId]
      );
      user.topics = topicsResult.rows;
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление профиля
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, bio, city, avatarUrl } = req.body;

    await query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           bio = COALESCE($2, bio), 
           city = COALESCE($3, city),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [name, bio, city, avatarUrl, req.userId]
    );

    res.json({ message: 'Профиль обновлен' });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
