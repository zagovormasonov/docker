import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Получение текущего пользователя
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, user_type, avatar_url, bio, city, 
       vk_url, telegram_url, instagram_url, whatsapp, consultation_types, created_at 
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
      vkUrl: dbUser.vk_url,
      telegramUrl: dbUser.telegram_url,
      instagramUrl: dbUser.instagram_url,
      whatsapp: dbUser.whatsapp,
      consultationTypes: dbUser.consultation_types ? JSON.parse(dbUser.consultation_types) : [],
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
    console.log('Обновление профиля для пользователя:', req.userId);
    console.log('Данные запроса:', req.body);
    
    const { name, bio, city, avatarUrl, vkUrl, telegramUrl, instagramUrl, whatsapp, consultationTypes, topics } = req.body;

    // Проверка уникальности имени (если имя изменилось)
    if (name) {
      console.log('Проверка уникальности имени:', name);
      const existingUserByName = await query(
        'SELECT id FROM users WHERE name = $1 AND id != $2',
        [name, req.userId]
      );

      if (existingUserByName.rows.length > 0) {
        return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
      }
    }

    // Обновляем основные поля пользователя
    console.log('Обновление основных полей пользователя');
    await query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           bio = COALESCE($2, bio), 
           city = COALESCE($3, city),
           avatar_url = COALESCE($4, avatar_url),
           vk_url = COALESCE($5, vk_url),
           telegram_url = COALESCE($6, telegram_url),
           instagram_url = COALESCE($7, instagram_url),
           whatsapp = COALESCE($8, whatsapp),
           consultation_types = COALESCE($9, consultation_types),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10`,
      [
        name, 
        bio, 
        city, 
        avatarUrl, 
        vkUrl, 
        telegramUrl, 
        instagramUrl, 
        whatsapp,
        consultationTypes ? JSON.stringify(consultationTypes) : null,
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

    const updatedUser = userResult.rows[0];
    
    // Обрабатываем consultationTypes если это JSON строка
    if (updatedUser.consultation_types && typeof updatedUser.consultation_types === 'string') {
      try {
        updatedUser.consultationTypes = JSON.parse(updatedUser.consultation_types);
      } catch (e) {
        updatedUser.consultationTypes = [];
      }
    } else {
      updatedUser.consultationTypes = updatedUser.consultation_types || [];
    }

    res.json(updatedUser);
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
      'SELECT user_type FROM users WHERE id = $1',
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

    res.json({ 
      message: 'Поздравляем! Теперь вы эксперт!',
      userType: 'expert'
    });
  } catch (error) {
    console.error('Ошибка становления экспертом:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
