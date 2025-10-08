import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authenticateToken, requireExpert, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Получение статей пользователя (должен быть перед /:id)
router.get('/my/articles', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM articles 
       WHERE author_id = $1 
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения статей пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение статей конкретного автора
router.get('/author/:authorId', async (req, res) => {
  try {
    const { authorId } = req.params;
    
    const result = await query(
      `SELECT a.*, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
       COALESCE(a.likes_count, 0) as likes_count
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.author_id = $1 AND a.is_published = true
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [authorId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения статей автора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Поиск статей по заголовку
router.get('/search', async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || typeof search !== 'string' || !search.trim()) {
      return res.json([]);
    }

    const result = await query(
      `SELECT a.*, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
       COALESCE(a.likes_count, 0) as likes_count
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.is_published = true AND a.title ILIKE $1
       ORDER BY a.created_at DESC
       LIMIT 10`,
      [`%${search.trim()}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка поиска статей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех опубликованных статей
router.get('/', async (req, res) => {
  try {
    const { sort = 'new' } = req.query;

    let orderBy = 'a.created_at DESC';
    if (sort === 'popular') {
      orderBy = 'a.views DESC, a.created_at DESC';
    }

    // Пробуем запрос с полями модерации, если не получается - без них
    let result;
    try {
      result = await query(
        `SELECT a.*, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
         COALESCE(a.likes_count, 0) as likes_count
         FROM articles a
         JOIN users u ON a.author_id = u.id
         WHERE a.is_published = true 
         AND (a.moderation_status = 'approved' OR a.moderation_status IS NULL)
         ORDER BY ${orderBy}
         LIMIT 100`
      );
    } catch (error) {
      // Если поля модерации не существуют, делаем запрос без них
      console.log('Поля модерации не найдены, загружаем все опубликованные статьи');
      result = await query(
        `SELECT a.*, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
         COALESCE(a.likes_count, 0) as likes_count
         FROM articles a
         JOIN users u ON a.author_id = u.id
         WHERE a.is_published = true
         ORDER BY ${orderBy}
         LIMIT 100`
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения статей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение статьи по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.*, u.name as author_name, u.avatar_url as author_avatar, u.id as author_id,
       COALESCE(a.likes_count, 0) as likes_count
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    // Увеличение счетчика просмотров
    await query('UPDATE articles SET views = views + 1 WHERE id = $1', [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения статьи:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание статьи
router.post(
  '/',
  authenticateToken,
  requireExpert,
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 50 })
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content, coverImage } = req.body;
      console.log('📝 Создание статьи:', { title, userId: req.userId });

      // Создаем статью (пробуем с полями модерации, если не получается - без них)
      let result;
      try {
        console.log('🔍 Пробуем создать статью с полями модерации');
        result = await query(
          `INSERT INTO articles (author_id, title, content, cover_image, is_published, moderation_status)
           VALUES ($1, $2, $3, $4, false, 'pending')
           RETURNING *`,
          [req.userId, title, content, coverImage || null]
        );
        console.log('✅ Статья создана с полями модерации');
      } catch (error) {
        // Если поля модерации не существуют, создаем без них
        console.log('⚠️ Поля модерации не найдены, создаем статью без них:', error.message);
        result = await query(
          `INSERT INTO articles (author_id, title, content, cover_image, is_published)
           VALUES ($1, $2, $3, $4, true)
           RETURNING *`,
          [req.userId, title, content, coverImage || null]
        );
        console.log('✅ Статья создана без полей модерации');
      }

      const article = result.rows[0];

      // Отправляем уведомление администратору только если есть поля модерации
      if (article.hasOwnProperty('moderation_status') && article.moderation_status === 'pending') {
        try {
          console.log('📨 Отправляем уведомление администратору');
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
            
            // Отправляем уведомление о новой статье на модерацию
            await query(
              `INSERT INTO messages (chat_id, sender_id, content, is_read) 
               VALUES ($1, $2, $3, false)`,
              [chatId, req.userId, `📝 Новая статья на модерацию от ${req.body.authorName || 'эксперта'}:\n\n📌 Заголовок: ${title}\n\n📄 Содержание:\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n\n🔗 ID статьи: ${article.id}`]
            );
          }
        } catch (notificationError) {
          console.error('Ошибка отправки уведомления администратору:', notificationError);
          // Не прерываем создание статьи из-за ошибки уведомления
        }
      }

      // Возвращаем статью с информацией о модерации
      const response = {
        ...article,
        message: article.hasOwnProperty('moderation_status') && article.moderation_status === 'pending' 
          ? 'Статья отправлена на модерацию. В ближайшее время вы получите ответ в чате.'
          : 'Статья создана и опубликована'
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Ошибка создания статьи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Обновление статьи
router.put(
  '/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, content, coverImage, isPublished } = req.body;

      console.log('📝 Обновление статьи:', { id, title, userId: req.userId });

      // Сначала получаем текущую статью, чтобы проверить статус модерации
      const currentArticle = await query(
        'SELECT * FROM articles WHERE id = $1 AND author_id = $2',
        [id, req.userId]
      );

      if (currentArticle.rows.length === 0) {
        return res.status(404).json({ error: 'Статья не найдена' });
      }

      const article = currentArticle.rows[0];
      console.log('📄 Текущая статья:', { 
        id: article.id, 
        moderation_status: article.moderation_status, 
        is_published: article.is_published 
      });

      // Обновляем статью и сбрасываем статус модерации
      const result = await query(
        `UPDATE articles 
         SET title = COALESCE($1, title),
             content = COALESCE($2, content),
             cover_image = COALESCE($3, cover_image),
             is_published = false,
             moderation_status = 'pending',
             moderation_reason = NULL,
             moderated_by = NULL,
             moderated_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND author_id = $5
         RETURNING *`,
        [title, content, coverImage, id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Статья не найдена' });
      }

      const updatedArticle = result.rows[0];
      console.log('✅ Статья обновлена и отправлена на модерацию:', updatedArticle.id);

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
            [chatId, req.userId, `🔄 Статья отредактирована и отправлена на повторную модерацию:\n\n📌 Название: ${title}\n\n🔗 ID статьи: ${updatedArticle.id}`]
          );
          
          console.log('📨 Уведомление администратору отправлено');
        }
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления администратору:', notificationError);
        // Не прерываем обновление статьи из-за ошибки уведомления
      }

      res.json({
        ...updatedArticle,
        message: 'Статья обновлена и отправлена на повторную модерацию'
      });
    } catch (error) {
      console.error('Ошибка обновления статьи:', error);
      res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
  }
);

// Удаление статьи
router.delete(
  '/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const result = await query(
        'DELETE FROM articles WHERE id = $1 AND author_id = $2 RETURNING id',
        [id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Статья не найдена или у вас нет прав' });
      }

      res.json({ message: 'Статья удалена' });
    } catch (error) {
      console.error('Ошибка удаления статьи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

export default router;
