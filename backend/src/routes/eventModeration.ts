import express from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Одобрить событие
router.post('/approve/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Обновляем статус события на опубликованное
    await query(
      `UPDATE events 
       SET is_published = true, 
           moderation_status = 'approved',
           moderated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [eventId]
    );
    
    res.json({ 
      message: 'Событие успешно одобрено и опубликовано',
      status: 'approved'
    });
  } catch (error) {
    console.error('Ошибка одобрения события:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отклонить событие
router.post('/reject/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;
    
    // Обновляем статус события на отклоненное
    await query(
      `UPDATE events 
       SET is_published = false, 
           moderation_status = 'rejected',
           moderation_reason = $2,
           moderated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [eventId, reason || 'Событие не соответствует требованиям платформы']
    );
    
    res.json({ 
      message: 'Событие отклонено',
      status: 'rejected'
    });
  } catch (error) {
    console.error('Ошибка отклонения события:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить события на модерации
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, c.name as city_name, u.name as organizer_name, u.email as organizer_email
      FROM events e
      LEFT JOIN cities c ON e.city_id = c.id
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.moderation_status = 'pending' OR e.moderation_status IS NULL
      ORDER BY e.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения событий на модерации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
