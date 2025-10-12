import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

// Получить кастомные соцсети пользователя
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    
    const result = await pool.query(
      'SELECT id, name, url, created_at FROM custom_socials WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения кастомных соцсетей:', error);
    res.status(500).json({ error: 'Ошибка получения кастомных соцсетей' });
  }
});

// Получить кастомные соцсети конкретного пользователя (для просмотра профиля)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT id, name, url, created_at FROM custom_socials WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения кастомных соцсетей пользователя:', error);
    res.status(500).json({ error: 'Ошибка получения кастомных соцсетей пользователя' });
  }
});

// Добавить кастомную соцсеть
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Название и ссылка обязательны' });
    }
    
    const result = await pool.query(
      'INSERT INTO custom_socials (user_id, name, url) VALUES ($1, $2, $3) RETURNING id, name, url, created_at',
      [userId, name, url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления кастомной соцсети:', error);
    res.status(500).json({ error: 'Ошибка добавления кастомной соцсети' });
  }
});

// Обновить кастомную соцсеть
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Название и ссылка обязательны' });
    }
    
    const result = await pool.query(
      'UPDATE custom_socials SET name = $1, url = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING id, name, url, updated_at',
      [name, url, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Кастомная соцсеть не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления кастомной соцсети:', error);
    res.status(500).json({ error: 'Ошибка обновления кастомной соцсети' });
  }
});

// Удалить кастомную соцсеть
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM custom_socials WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Кастомная соцсеть не найдена' });
    }
    
    res.json({ message: 'Кастомная соцсеть удалена' });
  } catch (error) {
    console.error('Ошибка удаления кастомной соцсети:', error);
    res.status(500).json({ error: 'Ошибка удаления кастомной соцсети' });
  }
});

export default router;
