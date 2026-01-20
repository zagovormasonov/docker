import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { generateUniqueSlug } from '../utils/transliterate';

const router = express.Router();

// Получение текущего пользователя
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, user_type, slug, avatar_url, bio, city, 
       vk_url, telegram_url, whatsapp, consultation_types, referral_code, bonuses, referred_by_id, tabs_order, created_at 
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
      slug: dbUser.slug,
      avatarUrl: dbUser.avatar_url,
      bio: dbUser.bio,
      city: dbUser.city,
      vkUrl: dbUser.vk_url,
      telegramUrl: dbUser.telegram_url,
      whatsapp: dbUser.whatsapp,
      consultationTypes: dbUser.consultation_types ? (typeof dbUser.consultation_types === 'string' ? JSON.parse(dbUser.consultation_types) : dbUser.consultation_types) : [],
      referralCode: dbUser.referral_code,
      bonuses: dbUser.bonuses || 0,
      referredById: dbUser.referred_by_id,
      tabsOrder: dbUser.tabs_order || ['photos', 'gallery'],
      createdAt: dbUser.created_at
    };

    // Получаем тематики для всех пользователей
    try {
      const topicsResult = await query(
        `SELECT t.id, t.name FROM topics t
         JOIN user_topics ut ON t.id = ut.topic_id
         WHERE ut.user_id = $1`,
        [req.userId]
      );
      user.topics = topicsResult.rows;
    } catch (topicsError) {
      console.error('Ошибка загрузки тематик:', topicsError);
      user.topics = []; // Если таблица не существует, возвращаем пустой массив
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
    console.log('Обновление профиля для пользователя:', req.userId);
    console.log('Данные запроса:', req.body);

    const { name, bio, city, avatarUrl, vkUrl, telegramUrl, whatsapp, consultationTypes, topics, tabsOrder } = req.body;

    // Генерируем slug если изменилось имя
    let newSlug: string | undefined;
    if (name) {
      console.log('Проверка уникальности имени:', name);
      const existingUserByName = await query(
        'SELECT id FROM users WHERE name = $1 AND id != $2',
        [name, req.userId]
      );

      if (existingUserByName.rows.length > 0) {
        return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
      }

      // Генерируем уникальный slug
      const checkSlugExists = async (slug: string, userId: number | null): Promise<boolean> => {
        const result = await query(
          'SELECT id FROM users WHERE slug = $1 AND id != $2',
          [slug, userId || 0]
        );
        return result.rows.length > 0;
      };

      newSlug = await generateUniqueSlug(name, req.userId!, checkSlugExists);
      console.log('Сгенерирован новый slug:', newSlug);
    }

    // Получаем текущие данные пользователя для слияния
    const currentUserResult = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const currentUser = currentUserResult.rows[0];

    // Обновляем основные поля пользователя
    console.log('Обновление основных полей пользователя');
    await query(
      `UPDATE users 
       SET name = $1, 
           bio = $2, 
           city = $3,
           avatar_url = $4,
           vk_url = $5,
           telegram_url = $6,
           whatsapp = $7,
           consultation_types = $8,
           slug = $9,
           tabs_order = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11`,
      [
        name !== undefined ? name : currentUser.name,
        bio !== undefined ? bio : currentUser.bio,
        city !== undefined ? city : currentUser.city,
        avatarUrl !== undefined ? avatarUrl : currentUser.avatar_url,
        vkUrl !== undefined ? vkUrl : currentUser.vk_url,
        telegramUrl !== undefined ? telegramUrl : currentUser.telegram_url,
        whatsapp !== undefined ? whatsapp : currentUser.whatsapp,
        consultationTypes !== undefined ? JSON.stringify(consultationTypes) : currentUser.consultation_types,
        newSlug !== undefined ? newSlug : currentUser.slug,
        tabsOrder !== undefined ? JSON.stringify(tabsOrder) : currentUser.tabs_order,
        req.userId
      ]
    );
    console.log('Основные поля обновлены успешно');

    // Создаем таблицу user_topics если она не существует
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_topics (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, topic_id)
        )
      `);
      console.log('Таблица user_topics создана или уже существует');
    } catch (createError) {
      console.error('Ошибка создания таблицы user_topics:', createError);
    }

    // Обновляем тематики если они переданы
    if (topics && Array.isArray(topics)) {
      console.log('Обновление тематик:', topics);
      try {
        // Удаляем старые тематики
        await query('DELETE FROM user_topics WHERE user_id = $1', [req.userId]);
        console.log('Старые тематики удалены');

        // Добавляем новые тематики
        for (const topicId of topics) {
          await query(
            'INSERT INTO user_topics (user_id, topic_id) VALUES ($1, $2)',
            [req.userId, topicId]
          );
        }
        console.log('Новые тематики добавлены');
      } catch (topicsError) {
        console.error('Ошибка обновления тематик:', topicsError);
        // Не прерываем выполнение, просто логируем ошибку
      }
    } else {
      console.log('Тематики не переданы или не являются массивом');
    }

    // Получаем обновленные данные пользователя с тематиками
    const userResult = await query(`
      SELECT 
        u.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', t.id,
              'name', t.name
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::json
        ) as topics
      FROM users u
      LEFT JOIN user_topics ut ON u.id = ut.user_id
      LEFT JOIN topics t ON ut.topic_id = t.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [req.userId]);

    const dbUser = userResult.rows[0];

    // Преобразуем snake_case в camelCase для frontend
    const user: any = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      userType: dbUser.user_type,
      slug: dbUser.slug,
      avatarUrl: dbUser.avatar_url,
      bio: dbUser.bio,
      city: dbUser.city,
      vkUrl: dbUser.vk_url,
      telegramUrl: dbUser.telegram_url,
      whatsapp: dbUser.whatsapp,
      consultationTypes: dbUser.consultation_types ? (typeof dbUser.consultation_types === 'string' ? JSON.parse(dbUser.consultation_types) : dbUser.consultation_types) : [],
      topics: dbUser.topics || [],
      referralCode: dbUser.referral_code,
      bonuses: dbUser.bonuses || 0,
      referredById: dbUser.referred_by_id,
      tabsOrder: dbUser.tabs_order || ['photos', 'gallery'],
      createdAt: dbUser.created_at
    };

    res.json(user);
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    console.error('Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// Стать экспертом
router.post('/become-expert', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Проверяем, что пользователь еще не эксперт
    const userResult = await query(
      'SELECT id, email, name, user_type FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];

    if (user.user_type === 'expert') {
      return res.status(400).json({ error: 'Пользователь уже является экспертом' });
    }

    // Обновляем тип пользователя на эксперта
    await query(
      'UPDATE users SET user_type = $1 WHERE id = $2',
      ['expert', req.userId]
    );

    // Генерируем новый токен с обновленным userType
    const newToken = jwt.sign(
      { userId: user.id, userType: 'expert' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Поздравляем! Теперь вы эксперт!',
      userType: 'expert',
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: 'expert'
      }
    });
  } catch (error) {
    console.error('Ошибка становления экспертом:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
