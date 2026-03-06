import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authenticateToken, requireExpert, AuthRequest } from '../middleware/auth';
// import emailjs from '@emailjs/browser'; // НЕ используем EmailJS на сервере

const router = express.Router();

// Функция отправки письма модерации (отключена на сервере)
const sendModerationEmail = async (event: any, organizer: any) => {
  console.log('📧 EmailJS отключен на сервере - используем только уведомления в чат');
  return true;
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
  'Благотворительное мероприятие',
  'Ярмарка'
];

// Получение событий пользователя (должен быть перед /:id)
router.get('/my/events', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT e.*, c.name as city_name 
       FROM events e
       LEFT JOIN cities c ON e.city_id = c.id
       WHERE e.organizer_id = $1 
       ORDER BY e.event_date DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения событий пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить список событий с фильтрами
router.get('/', async (req: AuthRequest, res) => {
  try {
    console.log('🔍 Запрос событий:', req.query);

    const {
      isOnline,
      cityId,
      eventTypes,
      dateFrom,
      dateTo
    } = req.query;

    // Сначала проверим, какие колонки существуют в таблице events
    const structureCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events'
    `);

    const hasModerationStatus = structureCheck.rows.some(row => row.column_name === 'moderation_status');
    const hasIsPublished = structureCheck.rows.some(row => row.column_name === 'is_published');

    console.log('📊 moderation_status существует:', hasModerationStatus);
    console.log('📊 is_published существует:', hasIsPublished);

    let queryText = `
      SELECT 
        e.*,
        u.name as organizer_name,
        u.avatar_url as organizer_avatar,
        c.name as city_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN cities c ON e.city_id = c.id
      WHERE e.event_date >= NOW()
    `;

    // Добавляем фильтр по статусу в зависимости от доступных колонок
    if (hasModerationStatus) {
      queryText += ` AND (e.moderation_status = 'approved' OR e.moderation_status IS NULL)`;
    } else if (hasIsPublished) {
      queryText += ` AND e.is_published = true`;
    }
    // Если нет ни moderation_status, ни is_published, показываем все события

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
      let types: string[] = [];
      if (Array.isArray(eventTypes)) {
        types = eventTypes as string[];
      } else {
        types = String(eventTypes).split(',').map(s => s.trim()).filter(s => s !== '');
      }

      if (types.length > 0) {
        paramCount++;
        queryText += ` AND e.event_type = ANY($${paramCount})`;
        params.push(types);
      }
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

    console.log('📝 SQL запрос:', queryText);
    console.log('📝 Параметры:', params);

    const result = await query(queryText, params);
    console.log('✅ Найдено событий:', result.rows.length);

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
    console.log('🎯 Создание события, пользователь:', req.userId);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Ошибки валидации:', errors.array());
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
        console.log('❌ Для офлайн события город обязателен');
        return res.status(400).json({ error: 'Для офлайн события город обязателен' });
      }

      console.log('📝 Создаем событие:', { title, eventType, isOnline, cityId, eventDate });

      // Создаем событие с полями модерации
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
      console.log('✅ Событие создано:', newEvent.id);

      // Упрощенная версия - только создание события без уведомлений
      console.log('✅ Событие успешно создано');

      res.status(201).json({
        ...newEvent,
        message: 'Событие создано и отправлено на модерацию'
      });
    } catch (error) {
      console.error('❌ Ошибка создания события:', error);
      console.error('❌ Детали ошибки:', {
        message: error.message,
        stack: error.stack,
        userId: req.userId,
        body: req.body
      });
      res.status(500).json({
        error: 'Ошибка сервера',
        details: error.message,
        userId: req.userId
      });
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

      console.log('📝 Обновление события:', { id, title, userId: req.userId });

      // Проверка прав доступа и получение текущего события
      const checkResult = await query(
        'SELECT * FROM events WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }

      if (checkResult.rows[0].organizer_id !== req.userId) {
        return res.status(403).json({ error: 'Нет прав для редактирования' });
      }

      const currentEvent = checkResult.rows[0];
      console.log('📄 Текущее событие:', {
        id: currentEvent.id,
        moderation_status: currentEvent.moderation_status,
        is_published: currentEvent.is_published
      });

      // Проверка: если офлайн, город обязателен
      if (!isOnline && !cityId) {
        return res.status(400).json({ error: 'Для офлайн события город обязателен' });
      }

      // Обновляем событие и сбрасываем статус модерации
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
          is_published = false,
          moderation_status = 'pending',
          moderation_reason = NULL,
          moderated_by = NULL,
          moderated_at = NULL,
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

      const updatedEvent = result.rows[0];
      console.log('✅ Событие обновлено и отправлено на модерацию:', updatedEvent.id);

      // Отправляем уведомление администратору о повторной модерации
      try {
        // Находим администратора
        const adminResult = await query(
          'SELECT id, name FROM users WHERE user_type = $1 AND email = $2',
          ['admin', 'samyrize77777@gmail.com']
        );

        if (adminResult.rows.length > 0) {
          const admin = adminResult.rows[0];

          // Создаем или находим чат с администратором
          let chatResult = await query(
            'SELECT * FROM chats WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
            [req.userId, admin.id]
          );

          if (chatResult.rows.length === 0) {
            chatResult = await query(
              'INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
              [req.userId, admin.id]
            );
          }

          const chatId = chatResult.rows[0].id;

          // Отправляем уведомление о повторной модерации
          await query(
            `INSERT INTO messages (chat_id, sender_id, content, is_read) 
             VALUES ($1, $2, $3, false)`,
            [chatId, req.userId, `🔄 Событие отредактировано и отправлено на повторную модерацию:\n\n📌 Название: ${title}\n\n📅 Дата: ${new Date(eventDate).toLocaleDateString('ru-RU')}\n\n🔗 ID события: ${updatedEvent.id}`]
          );

          console.log('📨 Уведомление администратору отправлено');
        }
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления администратору:', notificationError);
        // Не прерываем обновление события из-за ошибки уведомления
      }

      res.json({
        ...updatedEvent,
        message: 'Событие обновлено и отправлено на повторную модерацию'
      });
    } catch (error) {
      console.error('Ошибка обновления события:', error);
      res.status(500).json({ error: 'Ошибка сервера', details: error.message });
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
