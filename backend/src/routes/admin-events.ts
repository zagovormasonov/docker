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
    
    // Сначала проверим структуру таблицы events
    const structureCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events'
    `);
    
    console.log('📊 Колонки в таблице events:', structureCheck.rows.map(r => r.column_name));
    
    // Проверяем, есть ли колонка author_id
    const hasAuthorId = structureCheck.rows.some(row => row.column_name === 'author_id');
    const hasIsPublished = structureCheck.rows.some(row => row.column_name === 'is_published');
    const hasOrganizerId = structureCheck.rows.some(row => row.column_name === 'organizer_id');
    
    console.log('📊 author_id существует:', hasAuthorId);
    console.log('📊 is_published существует:', hasIsPublished);
    console.log('📊 organizer_id существует:', hasOrganizerId);
    
    let queryString;
    let queryParams = [];
    
    if (hasAuthorId) {
      // Если есть author_id, используем JOIN с users
      if (hasIsPublished) {
        queryString = `
          SELECT 
            e.*,
            u.name as author_name,
            u.email as author_email,
            CASE WHEN e.is_published = true THEN 'Опубликовано' ELSE 'На модерации' END as status
          FROM events e
          LEFT JOIN users u ON e.author_id = u.id
          ORDER BY e.id DESC
        `;
      } else {
        queryString = `
          SELECT 
            e.*,
            u.name as author_name,
            u.email as author_email,
            'На модерации' as status
          FROM events e
          LEFT JOIN users u ON e.author_id = u.id
          ORDER BY e.id DESC
        `;
      }
    } else if (hasOrganizerId) {
      // Если нет author_id, но есть organizer_id, используем его
      console.log('⚠️ author_id не найден, используем organizer_id');
      if (hasIsPublished) {
        queryString = `
          SELECT 
            e.*,
            u.name as author_name,
            u.email as author_email,
            CASE WHEN e.is_published = true THEN 'Опубликовано' ELSE 'На модерации' END as status
          FROM events e
          LEFT JOIN users u ON e.organizer_id = u.id
          ORDER BY e.id DESC
        `;
      } else {
        queryString = `
          SELECT 
            e.*,
            u.name as author_name,
            u.email as author_email,
            'На модерации' as status
          FROM events e
          LEFT JOIN users u ON e.organizer_id = u.id
          ORDER BY e.id DESC
        `;
      }
    } else {
      // Если нет ни author_id, ни organizer_id, используем дефолтные значения
      console.log('⚠️ Нет ни author_id, ни organizer_id, используем дефолтные значения');
      if (hasIsPublished) {
        queryString = `
          SELECT 
            e.*,
            'Неизвестный автор' as author_name,
            'unknown@example.com' as author_email,
            CASE WHEN e.is_published = true THEN 'Опубликовано' ELSE 'На модерации' END as status
          FROM events e
          ORDER BY e.id DESC
        `;
      } else {
        queryString = `
          SELECT 
            e.*,
            'Неизвестный автор' as author_name,
            'unknown@example.com' as author_email,
            'На модерации' as status
          FROM events e
          ORDER BY e.id DESC
        `;
      }
    }
    
    // Выполняем запрос
    console.log('🔍 Выполняем запрос:', queryString);
    const result = await query(queryString, queryParams);
    console.log('✅ События загружены:', result.rows.length);
    
    res.json({ success: true, events: result.rows });
  } catch (error) {
    console.error('❌ Ошибка загрузки событий:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера', error: error.message });
  }
});

// Обновить событие
router.put('/:id', authenticateToken, requireAdmin, [
  body('title').trim().isLength({ min: 1 }).withMessage('Название обязательно'),
  body('description').trim().isLength({ min: 1 }).withMessage('Описание обязательно'),
  body('location').trim().isLength({ min: 1 }).withMessage('Место проведения обязательно'),
  body('event_date').isISO8601().withMessage('Дата события должна быть в формате ISO 8601'),
  body('price').optional().trim(),
  body('registration_link').optional().isURL().withMessage('Ссылка на регистрацию должна быть валидным URL'),
  body('cover_image').optional().isString().withMessage('Обложка должна быть строкой').custom((value) => {
    if (value && !value.startsWith('/uploads/')) {
      throw new Error('Обложка должна быть путем к файлу в папке uploads');
    }
    return true;
  }),
  body('is_published').optional().isBoolean().withMessage('Статус публикации должен быть boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Ошибка валидации', errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, location, event_date, price, registration_link, cover_image, is_published } = req.body;

    // Проверяем, существует ли событие
    const eventCheck = await query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Событие не найдено' });
    }

    const event = eventCheck.rows[0];

    // Проверяем структуру таблицы для динамического запроса
    const structureCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events'
    `);
    
    const hasIsPublished = structureCheck.rows.some(row => row.column_name === 'is_published');
    const hasUpdatedAt = structureCheck.rows.some(row => row.column_name === 'updated_at');
    
    // Строим динамический запрос UPDATE
    let updateFields = ['title = $2', 'description = $3', 'location = $4', 'event_date = $5', 'price = $6', 'registration_link = $7', 'cover_image = $8'];
    let queryParams = [id, title, description, location, event_date, price, registration_link, cover_image];
    let paramIndex = 9;
    
    if (hasIsPublished) {
      updateFields.push(`is_published = $${paramIndex}`);
      queryParams.push(is_published);
      paramIndex++;
    }
    
    if (hasUpdatedAt) {
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    }
    
    const updateQuery = `UPDATE events SET ${updateFields.join(', ')} WHERE id = $1 RETURNING *`;
    
    console.log('🔍 Выполняем UPDATE запрос:', updateQuery);
    const result = await query(updateQuery, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Событие не найдено' });
    }

    const updatedEvent = result.rows[0];

    // Отправляем уведомление автору о редактировании
    try {
      const authorId = event.author_id || event.organizer_id;
      if (authorId) {
        await createEventEditedNotification(authorId, updatedEvent.title, is_published);
        console.log('✅ Уведомление о редактировании отправлено автору:', authorId);
      }
    } catch (notificationError) {
      console.error('⚠️ Ошибка отправки уведомления:', notificationError);
    }

    res.json({ success: true, message: 'Событие обновлено', event: updatedEvent });
  } catch (error) {
    console.error('❌ Ошибка обновления события:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера', error: error.message });
  }
});

// Удалить событие
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Сначала получаем информацию о событии для уведомления
    const eventCheck = await query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Событие не найдено' });
    }

    const event = eventCheck.rows[0];

    // Удаляем событие
    await query('DELETE FROM events WHERE id = $1', [id]);

    // Отправляем уведомление автору об удалении
    try {
      const authorId = event.author_id || event.organizer_id;
      if (authorId) {
        await createEventDeletedNotification(authorId, event.title);
        console.log('✅ Уведомление об удалении отправлено автору:', authorId);
      }
    } catch (notificationError) {
      console.error('⚠️ Ошибка отправки уведомления:', notificationError);
    }

    res.json({ success: true, message: 'Событие удалено' });
  } catch (error) {
    console.error('❌ Ошибка удаления события:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера', error: error.message });
  }
});

export default router;