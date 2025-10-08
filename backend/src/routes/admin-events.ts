import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { query } from '../config/database';
import { createEventEditedNotification, createEventDeletedNotification } from '../utils/notifications';

const router = express.Router();

// Проверка прав администратора
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: 'Доступно только для администраторов' });
  }
  next();
};

// Получить все события с информацией об авторах
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Запрос событий для админа');
    
    // Сначала проверим, существует ли таблица events
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'events'
      );
    `);
    
    console.log('📊 Таблица events существует:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ success: true, events: [] });
    }
    
    const result = await query(`
      SELECT 
        e.*,
        u.name as author_name,
        u.email as author_email,
        CASE WHEN e.is_published = true THEN 'Опубликовано' ELSE 'На модерации' END as status
      FROM events e
      JOIN users u ON e.author_id = u.id
      ORDER BY e.created_at DESC
    `);
    
    console.log('✅ События загружены:', result.rows.length);
    res.json({ success: true, events: result.rows });
  } catch (error) {
    console.error('❌ Ошибка получения событий:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера', error: error.message });
  }
});

// Редактировать событие
router.put('/:id', authenticateToken, requireAdmin, [
  body('title').trim().isLength({ min: 5 }).withMessage('Заголовок должен содержать минимум 5 символов'),
  body('description').trim().isLength({ min: 20 }).withMessage('Описание должно содержать минимум 20 символов'),
  body('location').trim().isLength({ min: 3 }).withMessage('Место проведения должно содержать минимум 3 символа'),
  body('event_date').isISO8601().withMessage('Дата события должна быть в формате ISO8601'),
  body('is_published').isBoolean().withMessage('Статус публикации должен быть boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, location, event_date, is_published } = req.body;

    // Получаем информацию о событии и авторе
    const eventResult = await query(`
      SELECT e.*, u.name as author_name, u.email as author_email
      FROM events e
      JOIN users u ON e.author_id = u.id
      WHERE e.id = $1
    `, [id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Событие не найдено' });
    }

    const event = eventResult.rows[0];

    // Обновляем событие
    await query(`
      UPDATE events 
      SET title = $1, description = $2, location = $3, event_date = $4, is_published = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [title, description, location, event_date, is_published, id]);

    // Создаем внутреннее уведомление для автора
    await createEventEditedNotification(event.author_id, title, is_published);

    res.json({ 
      success: true, 
      message: 'Событие успешно обновлено',
      event: {
        id: parseInt(id),
        title,
        description,
        location,
        event_date,
        is_published,
        author_name: event.author_name
      }
    });

  } catch (error) {
    console.error('Ошибка обновления события:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Удалить событие
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Получаем информацию о событии и авторе
    const eventResult = await query(`
      SELECT e.*, u.name as author_name, u.email as author_email
      FROM events e
      JOIN users u ON e.author_id = u.id
      WHERE e.id = $1
    `, [id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Событие не найдено' });
    }

    const event = eventResult.rows[0];

    // Удаляем событие
    await query('DELETE FROM events WHERE id = $1', [id]);

    // Создаем внутреннее уведомление для автора
    await createEventDeletedNotification(event.author_id, event.title);

    res.json({ 
      success: true, 
      message: 'Событие успешно удалено',
      deleted_event: {
        id: parseInt(id),
        title: event.title,
        author_name: event.author_name
      }
    });

  } catch (error) {
    console.error('Ошибка удаления события:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить детали события
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        e.*,
        u.name as author_name,
        u.email as author_email
      FROM events e
      JOIN users u ON e.author_id = u.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Событие не найдено' });
    }

    res.json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('Ошибка получения события:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

export default router;
