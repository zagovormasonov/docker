import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authenticateToken, requireExpert, AuthRequest } from '../middleware/auth';
import { generateUniqueSlug } from '../utils/transliterate';

const router = express.Router();

// Получение количества экспертов
router.get('/count', async (req, res) => {
  try {
    const result = await query(
      "SELECT COUNT(*) as count FROM users WHERE user_type IN ('expert', 'admin')"
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Ошибка получения количества экспертов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение списка экспертов с фильтрацией
router.get('/search', async (req, res) => {
  try {
    const { topics, city, serviceType, search, limit, order, offset } = req.query;

    let queryText = `
      SELECT u.id, u.name, u.email, u.avatar_url, u.bio, u.city, u.slug,
             ARRAY(
               SELECT t2.name 
               FROM user_topics ut2 
               JOIN topics t2 ON ut2.topic_id = t2.id 
               WHERE ut2.user_id = u.id
             ) as topics
      FROM users u
      WHERE u.user_type IN ('expert', 'admin')
    `;

    const queryParams: any[] = [];
    let paramCount = 0;

    if (topics && typeof topics === 'string' && topics.trim()) {
      const topicArray = topics.split(',').filter(t => t.trim());
      if (topicArray.length > 0) {
        paramCount++;
        queryText += ` AND EXISTS (
          SELECT 1 FROM user_topics ut3
          JOIN topics t3 ON ut3.topic_id = t3.id
          WHERE ut3.user_id = u.id AND t3.name = ANY($${paramCount}::text[])
        )`;
        queryParams.push(topicArray);
      }
    }

    if (city && typeof city === 'string' && city.trim()) {
      paramCount++;
      queryText += ` AND u.city ILIKE $${paramCount}`;
      queryParams.push(`%${city}%`);
    }

    if (search && typeof search === 'string' && search.trim()) {
      paramCount++;
      queryText += ` AND (u.name ILIKE $${paramCount} OR u.bio ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    queryText += ` ORDER BY u.created_at DESC`;

    // Добавляем LIMIT если указан
    if (limit && typeof limit === 'string') {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        queryText += ` LIMIT ${limitNum}`;
      }
    }

    // Добавляем OFFSET если указан
    if (offset && typeof offset === 'string') {
      const offsetNum = parseInt(offset, 10);
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        queryText += ` OFFSET ${offsetNum}`;
      }
    }

    const result = await query(queryText, queryParams);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка поиска экспертов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение профиля эксперта (по ID или slug)
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Определяем, это ID (число) или slug (строка)
    const isNumericId = /^\d+$/.test(idOrSlug);
    
    let userResult;
    if (isNumericId) {
      // Поиск по ID
      userResult = await query(
        `SELECT id, name, email, avatar_url, bio, city, slug,
         vk_url, telegram_url, whatsapp, consultation_types,
         created_at 
         FROM users WHERE id = $1 AND user_type IN ('expert', 'admin')`,
        [idOrSlug]
      );
    } else {
      // Поиск по slug
      userResult = await query(
        `SELECT id, name, email, avatar_url, bio, city, slug,
         vk_url, telegram_url, whatsapp, consultation_types,
         created_at 
         FROM users WHERE slug = $1 AND user_type IN ('expert', 'admin')`,
        [idOrSlug]
      );
    }

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Эксперт не найден' });
    }

    const expert = userResult.rows[0];
    const expertId = expert.id;

    // Получение тематик
    const topicsResult = await query(
      `SELECT t.id, t.name FROM topics t
       JOIN user_topics ut ON t.id = ut.topic_id
       WHERE ut.user_id = $1`,
      [expertId]
    );

    // Получение услуг
    const servicesResult = await query(
      `SELECT * FROM services WHERE expert_id = $1 ORDER BY created_at DESC`,
      [expertId]
    );

    // Получение продуктов
    const productsResult = await query(
      `SELECT * FROM products WHERE expert_id = $1 ORDER BY created_at DESC`,
      [expertId]
    );

    res.json({
      ...expert,
      topics: topicsResult.rows,
      services: servicesResult.rows,
      products: productsResult.rows
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление профиля эксперта
router.put(
  '/profile',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { name, bio, city, avatarUrl, vkUrl, telegramUrl, whatsapp, consultationTypes, topics } = req.body;
      
      // Генерируем slug если изменилось имя
      let newSlug: string | undefined;
      if (name) {
        // Функция проверки уникальности slug
        const checkSlugExists = async (slug: string, userId: number | null): Promise<boolean> => {
          const result = await query(
            'SELECT id FROM users WHERE slug = $1 AND id != $2',
            [slug, userId || 0]
          );
          return result.rows.length > 0;
        };
        
        newSlug = await generateUniqueSlug(name, req.userId!, checkSlugExists);
      }

      // Проверка уникальности имени (если имя изменилось)
      if (name) {
        const existingUserByName = await query(
          'SELECT id FROM users WHERE name = $1 AND id != $2',
          [name, req.userId]
        );

        if (existingUserByName.rows.length > 0) {
          return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
        }
      }

      await query(
        `UPDATE users 
         SET name = COALESCE($1, name), 
             bio = COALESCE($2, bio), 
             city = COALESCE($3, city),
             avatar_url = COALESCE($4, avatar_url),
             vk_url = COALESCE($5, vk_url),
             telegram_url = COALESCE($6, telegram_url),
             whatsapp = COALESCE($7, whatsapp),
             consultation_types = COALESCE($8, consultation_types),
             slug = COALESCE($9, slug),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10`,
        [
          name, 
          bio, 
          city, 
          avatarUrl, 
          vkUrl, 
          telegramUrl, 
          whatsapp,
          consultationTypes ? JSON.stringify(consultationTypes) : null,
          newSlug,
          req.userId
        ]
      );

      // Обновление тематик
      if (topics && Array.isArray(topics)) {
        await query('DELETE FROM user_topics WHERE user_id = $1', [req.userId]);

        for (const topicId of topics) {
          await query(
            'INSERT INTO user_topics (user_id, topic_id) VALUES ($1, $2)',
            [req.userId, topicId]
          );
        }
      }

      res.json({ message: 'Профиль обновлен' });
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Создание услуги
router.post(
  '/services',
  authenticateToken,
  requireExpert,
  [
    body('title').trim().isLength({ min: 3 }),
    body('description').trim().isLength({ min: 10 }),
    body('serviceType').isIn(['online', 'offline', 'both'])
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, price, duration, serviceType } = req.body;

      const result = await query(
        `INSERT INTO services (expert_id, title, description, price, duration, service_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.userId, title, description, price, duration, serviceType]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка создания услуги:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Обновление услуги
router.put(
  '/services/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, description, price, duration, serviceType } = req.body;

      const result = await query(
        `UPDATE services 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             price = COALESCE($3, price),
             duration = COALESCE($4, duration),
             service_type = COALESCE($5, service_type),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND expert_id = $7
         RETURNING *`,
        [title, description, price, duration, serviceType, id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Услуга не найдена' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка обновления услуги:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Удаление услуги
router.delete(
  '/services/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      await query(
        'DELETE FROM services WHERE id = $1 AND expert_id = $2',
        [id, req.userId]
      );

      res.json({ message: 'Услуга удалена' });
    } catch (error) {
      console.error('Ошибка удаления услуги:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Получить список клиентов эксперта
router.get('/my-clients', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        MAX(b.date) as last_booking_date,
        COUNT(b.id) as total_bookings
       FROM users u
       JOIN bookings b ON u.id = b.client_id
       WHERE b.expert_id = $1
       GROUP BY u.id, u.name, u.email, u.avatar_url
       ORDER BY MAX(b.date) DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения клиентов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить рабочие часы эксперта (для администрирования)
router.get('/working-hours', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    // Возвращаем заглушку, так как таблица рабочих часов может не существовать
    // В будущем можно создать таблицу expert_working_hours
    const defaultHours = [
      { day: 'Понедельник', start_time: '09:00', end_time: '18:00', is_active: true },
      { day: 'Вторник', start_time: '09:00', end_time: '18:00', is_active: true },
      { day: 'Среда', start_time: '09:00', end_time: '18:00', is_active: true },
      { day: 'Четверг', start_time: '09:00', end_time: '18:00', is_active: true },
      { day: 'Пятница', start_time: '09:00', end_time: '18:00', is_active: true },
      { day: 'Суббота', start_time: '10:00', end_time: '16:00', is_active: false },
      { day: 'Воскресенье', start_time: '10:00', end_time: '16:00', is_active: false }
    ];

    res.json(defaultHours);
  } catch (error) {
    console.error('Ошибка получения рабочих часов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
