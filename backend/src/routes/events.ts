import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authenticateToken, requireExpert, AuthRequest } from '../middleware/auth';
import emailjs from '@emailjs/browser';

const router = express.Router();

// Функция отправки письма модерации
const sendModerationEmail = async (event: any, organizer: any) => {
  try {
    const approveUrl = `${process.env.FRONTEND_URL || 'https://soulsynergy.ru'}/api/events/approve/${event.id}`;
    const rejectUrl = `${process.env.FRONTEND_URL || 'https://soulsynergy.ru'}/api/events/reject/${event.id}`;
    
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_MODERATION_TEMPLATE_ID!,
      {
        event_title: event.title,
        event_date: new Date(event.event_date).toLocaleString('ru-RU'),
        event_location: event.is_online ? 'Онлайн' : event.location || 'Не указано',
        organizer_name: organizer.name,
        event_price: event.price || 'Бесплатно',
        event_description: event.description || 'Описание не указано',
        approve_url: approveUrl,
        reject_url: rejectUrl
      },
      process.env.EMAILJS_PUBLIC_KEY!
    );
    
    return true;
  } catch (error) {
    console.error('Ошибка отправки письма модерации:', error);
    return false;
  }
};

// Типы событий
export const EVENT_TYPES = [
  'Ретрит',
  'Мастер-класс',
  'Тренинг',
  'Семинар',
  'Сатсанг',
  'Йога и медитация',
  'Фестиваль',
  'Конференция',
  'Выставка',
  'Концерт',
  'Экскурсия',
  'Благотворительное мероприятие'
];

// Получить список событий с фильтрами
router.get('/', async (req: AuthRequest, res) => {
  try {
    const {
      isOnline,
      cityId,
      eventTypes,
      dateFrom,
      dateTo
    } = req.query;

    let queryText = `
      SELECT 
        e.*,
        u.name as organizer_name,
        u.avatar_url as organizer_avatar,
        c.name as city_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN cities c ON e.city_id = c.id
      WHERE e.event_date >= NOW() AND e.is_published = true
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Фильтр по онлайн/офлайн
    if (isOnline !== undefined) {
      const onlineValues = Array.isArray(isOnline) ? isOnline : [isOnline];
      if (onlineValues.length === 1) {
        paramCount++;
        queryText += ` AND e.is_online = $${paramCount}`;
        params.push(onlineValues[0] === 'true');
      }
    }

    // Фильтр по городу
    if (cityId) {
      paramCount++;
      queryText += ` AND e.city_id = $${paramCount}`;
      params.push(cityId);
    }

    // Фильтр по типам событий
    if (eventTypes) {
      const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
      paramCount++;
      queryText += ` AND e.event_type = ANY($${paramCount})`;
      params.push(types);
    }

    // Фильтр по дате от
    if (dateFrom) {
      paramCount++;
      queryText += ` AND e.event_date >= $${paramCount}`;
      params.push(dateFrom);
    }

    // Фильтр по дате до
    if (dateTo) {
      paramCount++;
      queryText += ` AND e.event_date <= $${paramCount}`;
      params.push(dateTo);
    }

    // Сортировка по дате (ближайшие первыми)
    queryText += ` ORDER BY e.event_date ASC`;

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения событий:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить событие по ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        e.*,
        u.id as organizer_id,
        u.name as organizer_name,
        u.avatar_url as organizer_avatar,
        u.bio as organizer_bio,
        c.name as city_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN cities c ON e.city_id = c.id
      WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения события:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить события организатора
router.get('/organizer/:organizerId', async (req: AuthRequest, res) => {
  try {
    const { organizerId } = req.params;

    const result = await query(
      `SELECT 
        e.*,
        u.name as organizer_name,
        u.avatar_url as organizer_avatar,
        c.name as city_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN cities c ON e.city_id = c.id
      WHERE e.organizer_id = $1
      ORDER BY e.event_date DESC
      LIMIT 100`,
      [organizerId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения событий организатора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать событие (только эксперты)
router.post(
  '/',
  authenticateToken,
  requireExpert,
  [
    body('title').trim().notEmpty().withMessage('Название обязательно'),
    body('eventType').isIn(EVENT_TYPES).withMessage('Неверный тип события'),
    body('eventDate').isISO8601().withMessage('Неверный формат даты'),
    body('isOnline').isBoolean().withMessage('Укажите онлайн или офлайн'),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        title,
        description,
        coverImage,
        eventType,
        isOnline,
        cityId,
        eventDate,
        location,
        price,
        registrationLink
      } = req.body;

      // Проверка: если офлайн, город обязателен
      if (!isOnline && !cityId) {
        return res.status(400).json({ error: 'Для офлайн события город обязателен' });
      }

      const result = await query(
        `INSERT INTO events (
          title, description, cover_image, event_type, is_online, city_id,
          event_date, location, price, registration_link, organizer_id,
          is_published, moderation_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          title,
          description,
          coverImage,
          eventType,
          isOnline,
          isOnline ? null : cityId,
          eventDate,
          location,
          price,
          registrationLink,
          req.userId,
          false, // is_published = false (требует модерации)
          'pending' // moderation_status = 'pending'
        ]
      );

      const newEvent = result.rows[0];
      
      // Получаем данные организатора для письма
      const organizerResult = await query(
        'SELECT name, email FROM users WHERE id = $1',
        [req.userId]
      );
      
      if (organizerResult.rows.length > 0) {
        // Отправляем письмо модерации
        await sendModerationEmail(newEvent, organizerResult.rows[0]);
      }

      res.status(201).json({
        ...newEvent,
        message: 'Событие создано и отправлено на модерацию'
      });
    } catch (error) {
      console.error('Ошибка создания события:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Обновить событие
router.put(
  '/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        coverImage,
        eventType,
        isOnline,
        cityId,
        eventDate,
        location,
        price,
        registrationLink
      } = req.body;

      // Проверка прав доступа
      const checkResult = await query(
        'SELECT organizer_id FROM events WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }

      if (checkResult.rows[0].organizer_id !== req.userId) {
        return res.status(403).json({ error: 'Нет прав для редактирования' });
      }

      // Проверка: если офлайн, город обязателен
      if (!isOnline && !cityId) {
        return res.status(400).json({ error: 'Для офлайн события город обязателен' });
      }

      const result = await query(
        `UPDATE events SET
          title = $1,
          description = $2,
          cover_image = $3,
          event_type = $4,
          is_online = $5,
          city_id = $6,
          event_date = $7,
          location = $8,
          price = $9,
          registration_link = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING *`,
        [
          title,
          description,
          coverImage,
          eventType,
          isOnline,
          isOnline ? null : cityId,
          eventDate,
          location,
          price,
          registrationLink,
          id
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка обновления события:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Удалить событие
router.delete('/:id', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Проверка прав доступа
    const checkResult = await query(
      'SELECT organizer_id FROM events WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    if (checkResult.rows[0].organizer_id !== req.userId) {
      return res.status(403).json({ error: 'Нет прав для удаления' });
    }

    await query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ message: 'Событие удалено' });
  } catch (error) {
    console.error('Ошибка удаления события:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
