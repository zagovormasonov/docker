import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { query } from '../config/database';

const router = express.Router();

// Получить все уведомления пользователя
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    
    const result = await query(`
      SELECT 
        id,
        type,
        title,
        message,
        is_read,
        created_at,
        updated_at
      FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить количество непрочитанных уведомлений
router.get('/unread-count', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    
    const result = await query(`
      SELECT COUNT(*) as count
      FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `, [userId]);
    
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Ошибка получения количества уведомлений:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Отметить уведомление как прочитанное
router.put('/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Проверяем, что уведомление принадлежит пользователю
    const checkResult = await query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Уведомление не найдено' });
    }
    
    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [id]
    );
    
    res.json({ success: true, message: 'Уведомление отмечено как прочитанное' });
  } catch (error) {
    console.error('Ошибка обновления уведомления:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Отметить все уведомления как прочитанные
router.put('/mark-all-read', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    res.json({ success: true, message: 'Все уведомления отмечены как прочитанные' });
  } catch (error) {
    console.error('Ошибка обновления уведомлений:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Удалить уведомление
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Проверяем, что уведомление принадлежит пользователю
    const checkResult = await query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Уведомление не найдено' });
    }
    
    await query('DELETE FROM notifications WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Уведомление удалено' });
  } catch (error) {
    console.error('Ошибка удаления уведомления:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

export default router;
