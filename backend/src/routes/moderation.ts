import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

console.log('📁 Загружается файл moderation.ts');

const router = express.Router();

// Простой endpoint для проверки
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Модерация работает!',
    timestamp: new Date().toISOString()
  });
});

// Endpoint для проверки полей модерации
router.get('/check-fields', async (req, res) => {
  try {
    console.log('🔍 Проверяем поля модерации в базе данных');
    
    // Проверяем поля в таблице events
    let eventsResult;
    try {
      eventsResult = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name IN ('moderation_status', 'is_published', 'moderated_by', 'moderated_at')
      `);
    } catch (error) {
      eventsResult = { rows: [] };
    }
    
    // Проверяем поля в таблице articles
    let articlesResult;
    try {
      articlesResult = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name IN ('moderation_status', 'is_published', 'moderated_by', 'moderated_at')
      `);
    } catch (error) {
      articlesResult = { rows: [] };
    }
    
    // Проверяем события на модерацию
    let pendingEvents;
    try {
      pendingEvents = await query(`
        SELECT COUNT(*) as count 
        FROM events 
        WHERE moderation_status = 'pending'
      `);
    } catch (error) {
      pendingEvents = { rows: [{ count: 0 }] };
    }
    
    // Проверяем статьи на модерацию
    let pendingArticles;
    try {
      pendingArticles = await query(`
        SELECT COUNT(*) as count 
        FROM articles 
        WHERE moderation_status = 'pending'
      `);
    } catch (error) {
      pendingArticles = { rows: [{ count: 0 }] };
    }
    
    res.json({
      message: 'Проверка полей модерации',
      timestamp: new Date().toISOString(),
      eventsFields: eventsResult.rows,
      articlesFields: articlesResult.rows,
      pendingEvents: pendingEvents.rows[0].count,
      pendingArticles: pendingArticles.rows[0].count
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка проверки полей',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint для добавления недостающего поля is_published в events
router.get('/fix-events-published', async (req, res) => {
  try {
    console.log('🔧 Добавляем поле is_published в таблицу events');
    
    // Добавляем поле is_published в таблицу events
    await query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false
    `);
    
    // Обновляем существующие события
    await query(`
      UPDATE events 
      SET is_published = true 
      WHERE moderation_status = 'approved' OR moderation_status IS NULL
    `);
    
    // Проверяем результат
    const checkResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name IN ('moderation_status', 'is_published', 'moderated_by', 'moderated_at')
      ORDER BY column_name
    `);
    
    res.json({
      message: 'Поле is_published добавлено в таблицу events',
      timestamp: new Date().toISOString(),
      success: true,
      eventsFields: checkResult.rows
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка добавления поля is_published',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint для принудительного добавления поля is_published
router.get('/force-add-published', async (req, res) => {
  try {
    console.log('🔧 Принудительно добавляем поле is_published в таблицу events');
    
    // Сначала проверяем, существует ли поле
    const checkResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name = 'is_published'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Поле is_published не существует, добавляем...');
      
      // Добавляем поле is_published в таблицу events
      await query(`
        ALTER TABLE events 
        ADD COLUMN is_published BOOLEAN DEFAULT false
      `);
      
      console.log('Поле is_published добавлено');
      
      // Обновляем существующие события
      await query(`
        UPDATE events 
        SET is_published = true 
        WHERE moderation_status = 'approved' OR moderation_status IS NULL
      `);
      
      console.log('Существующие события обновлены');
    } else {
      console.log('Поле is_published уже существует');
    }
    
    // Проверяем результат
    const finalResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name IN ('moderation_status', 'is_published', 'moderated_by', 'moderated_at')
      ORDER BY column_name
    `);
    
    res.json({
      message: 'Поле is_published принудительно добавлено в таблицу events',
      timestamp: new Date().toISOString(),
      success: true,
      eventsFields: finalResult.rows,
      wasAdded: checkResult.rows.length === 0
    });
  } catch (error) {
    console.error('Ошибка принудительного добавления поля is_published:', error);
    res.status(500).json({
      error: 'Ошибка принудительного добавления поля is_published',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware для проверки прав администратора
const requireAdmin = async (req: AuthRequest, res: any, next: any) => {
  console.log('🔐 Проверка прав администратора для пользователя:', req.userId);
  try {
    const result = await query(
      'SELECT user_type FROM users WHERE id = $1',
      [req.userId]
    );
    console.log('👤 Тип пользователя:', result.rows[0]?.user_type);
    
    if (result.rows.length === 0 || result.rows[0].user_type !== 'admin') {
      console.log('❌ Доступ запрещен. Пользователь не является администратором');
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }
    
    console.log('✅ Пользователь является администратором');
    next();
  } catch (error) {
    console.error('Ошибка проверки прав администратора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Endpoint для тестирования отклонения события
router.post('/test-reject/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('🧪 Тестируем отклонение события:', {
      eventId: id,
      reason: reason,
      userId: req.userId,
      body: req.body
    });
    
    res.json({
      message: 'Тест отклонения события',
      debug: {
        eventId: id,
        reason: reason,
        userId: req.userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка тестирования отклонения',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint для тестирования одобрения события
router.post('/test-approve/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    console.log('🧪 Тестируем одобрение события:', {
      eventId: id,
      userId: req.userId
    });
    
    // Проверяем, существует ли событие
    const eventResult = await query('SELECT id, title, organizer_id FROM events WHERE id = $1', [id]);
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Событие не найдено',
        eventId: id
      });
    }
    
    const event = eventResult.rows[0];
    
    res.json({
      message: 'Тест одобрения события',
      debug: {
        eventId: id,
        userId: req.userId,
        event: event,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка тестирования одобрения',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Простой endpoint для проверки одобрения без аутентификации
router.get('/test-approve-simple/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🧪 Простой тест одобрения события:', id);
    
    // Проверяем, существует ли событие
    const eventResult = await query('SELECT id, title, organizer_id, is_published, moderation_status FROM events WHERE id = $1', [id]);
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Событие не найдено',
        eventId: id
      });
    }
    
    const event = eventResult.rows[0];
    
    res.json({
      message: 'Простой тест одобрения события',
      debug: {
        eventId: id,
        event: event,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка тестирования одобрения',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Получение списка статей на модерацию
router.get('/articles', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  console.log('📋 Загружаем статьи на модерацию для пользователя:', req.userId);
  try {
    // Пробуем запрос с полями модерации, если не получается - возвращаем пустой массив
    let result;
    try {
      console.log('🔍 Ищем статьи с moderation_status = pending');
      result = await query(`
        SELECT a.*, u.name as author_name, u.email as author_email
        FROM articles a
        JOIN users u ON a.author_id = u.id
        WHERE a.moderation_status = 'pending'
        ORDER BY a.created_at DESC
      `);
      console.log('📊 Найдено статей на модерацию:', result.rows.length);
    } catch (error) {
      console.log('❌ Поля модерации не найдены, возвращаем пустой список статей на модерацию:', error.message);
      result = { rows: [] };
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения статей на модерацию:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение списка событий на модерацию
router.get('/events', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  console.log('📋 Загружаем события на модерацию для пользователя:', req.userId);
  try {
    // Пробуем запрос с полями модерации, если не получается - возвращаем пустой массив
    let result;
    try {
      console.log('🔍 Ищем события с moderation_status = pending');
      result = await query(`
        SELECT e.*, u.name as author_name, u.email as author_email
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        WHERE e.moderation_status = 'pending'
        ORDER BY e.created_at DESC
      `);
      console.log('📊 Найдено событий на модерацию:', result.rows.length);
    } catch (error) {
      console.log('❌ Поля модерации не найдены, возвращаем пустой список событий на модерацию:', error.message);
      result = { rows: [] };
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения событий на модерацию:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Одобрение статьи
router.post('/articles/:id/approve', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Обновляем статус статьи и публикуем её
    await query(
      'UPDATE articles SET moderation_status = $1, moderated_by = $2, moderated_at = CURRENT_TIMESTAMP, is_published = true WHERE id = $3',
      ['approved', req.userId, id]
    );
    
    // Получаем информацию об авторе и названии статьи для уведомления
    const authorResult = await query(`
      SELECT u.id, u.name, u.email, a.title
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `, [id]);
    
    if (authorResult.rows.length > 0) {
      const author = authorResult.rows[0];
      
      // Создаем или находим чат с автором
      let chatResult = await query(
        'SELECT * FROM chats WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
        [req.userId, author.id]
      );
      
      if (chatResult.rows.length === 0) {
        chatResult = await query(
          'INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
          [req.userId, author.id]
        );
      }
      
      const chatId = chatResult.rows[0].id;
      
      // Отправляем уведомление об одобрении
      await query(
        'INSERT INTO messages (chat_id, sender_id, content, is_read) VALUES ($1, $2, $3, false)',
        [chatId, req.userId, `✅ Ваша статья "${author.title}" одобрена и опубликована!`]
      );
    }
    
    res.json({ message: 'Статья одобрена' });
  } catch (error) {
    console.error('Ошибка одобрения статьи:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отклонение статьи
router.post('/articles/:id/reject', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Необходимо указать причину отклонения' });
    }
    
    // Обновляем статус статьи
    await query(
      'UPDATE articles SET moderation_status = $1, moderation_reason = $2, moderated_by = $3, moderated_at = CURRENT_TIMESTAMP WHERE id = $4',
      ['rejected', reason, req.userId, id]
    );
    
    // Получаем информацию об авторе для уведомления
    const authorResult = await query(`
      SELECT u.id, u.name, u.email, a.title
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `, [id]);
    
    if (authorResult.rows.length > 0) {
      const author = authorResult.rows[0];
      
      // Создаем или находим чат с автором
      let chatResult = await query(
        'SELECT * FROM chats WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
        [req.userId, author.id]
      );
      
      if (chatResult.rows.length === 0) {
        chatResult = await query(
          'INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
          [req.userId, author.id]
        );
      }
      
      const chatId = chatResult.rows[0].id;
      
      // Отправляем уведомление об отклонении
      await query(
        'INSERT INTO messages (chat_id, sender_id, content, is_read) VALUES ($1, $2, $3, false)',
        [chatId, req.userId, `❌ Ваша статья "${author.title}" отклонена.\n\nПричина: ${reason}`]
      );
    }
    
    res.json({ message: 'Статья отклонена' });
  } catch (error) {
    console.error('Ошибка отклонения статьи:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Одобрение события
console.log('🎯 Регистрируем endpoint POST /events/:id/approve');
router.post('/events/:id/approve', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  console.log('🚀 Начало одобрения события:', req.params.id);
  console.log('👤 Пользователь:', req.userId);
  
  // Добавляем логи в ответ для отладки
  const debugInfo = {
    eventId: req.params.id,
    userId: req.userId,
    timestamp: new Date().toISOString(),
    step: 'start'
  };
  
  try {
    const { id } = req.params;
    console.log('📝 ID события для одобрения:', id);
    
    // Проверяем, какие колонки существуют в таблице events
    const structureCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events'
    `);
    
    const hasModerationStatus = structureCheck.rows.some(row => row.column_name === 'moderation_status');
    const hasIsPublished = structureCheck.rows.some(row => row.column_name === 'is_published');
    
    console.log('📊 moderation_status существует:', hasModerationStatus);
    console.log('📊 is_published существует:', hasIsPublished);
    
    // Строим динамический запрос UPDATE
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (hasModerationStatus) {
      updateFields.push(`moderation_status = $${paramIndex}`);
      queryParams.push('approved');
      paramIndex++;
      
      updateFields.push(`moderated_by = $${paramIndex}`);
      queryParams.push(req.userId);
      paramIndex++;
      
      updateFields.push(`moderated_at = CURRENT_TIMESTAMP`);
    }
    
    if (hasIsPublished) {
      updateFields.push(`is_published = $${paramIndex}`);
      queryParams.push(true);
      paramIndex++;
    }
    
    if (updateFields.length === 0) {
      console.log('⚠️ Нет доступных полей для обновления');
      return res.json({ success: true, message: 'Событие одобрено (нет полей для обновления)' });
    }
    
    queryParams.push(id);
    
    const updateQuery = `UPDATE events SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    console.log('🔍 Выполняем UPDATE запрос:', updateQuery);
    
    await query(updateQuery, queryParams);
    console.log('✅ Событие обновлено');
    
    // Получаем информацию об авторе и названии события для уведомления
    console.log('Получаем информацию об авторе события:', id);
    const authorResult = await query(`
      SELECT u.id, u.name, u.email, e.title
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1
    `, [id]);
    console.log('Автор события:', authorResult.rows);
    
    if (authorResult.rows.length > 0) {
      const author = authorResult.rows[0];
      
      // Создаем или находим чат с автором
      console.log('Ищем чат между администратором и автором:', req.userId, author.id);
      let chatResult = await query(
        'SELECT * FROM chats WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
        [req.userId, author.id]
      );
      console.log('Найденный чат:', chatResult.rows);
      
      if (chatResult.rows.length === 0) {
        console.log('Создаем новый чат между администратором и автором');
        chatResult = await query(
          'INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
          [req.userId, author.id]
        );
        console.log('Созданный чат:', chatResult.rows);
      }
      
      const chatId = chatResult.rows[0].id;
      console.log('ID чата для уведомления:', chatId);
      
      // Отправляем уведомление об одобрении
      console.log('Отправляем уведомление об одобрении события');
      await query(
        'INSERT INTO messages (chat_id, sender_id, content, is_read) VALUES ($1, $2, $3, false)',
        [chatId, req.userId, `✅ Ваше событие "${author.title}" одобрено и опубликовано!`]
      );
      console.log('Уведомление об одобрении отправлено');
    }
    
    res.json({ 
      message: 'Событие одобрено',
      debug: {
        ...debugInfo,
        step: 'success'
      }
    });
  } catch (error) {
    console.error('Ошибка одобрения события:', error);
    console.error('Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      eventId: req.params.id,
      userId: req.userId
    });
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: error.message,
      eventId: req.params.id,
      debug: {
        ...debugInfo,
        step: 'error',
        errorMessage: error.message,
        errorStack: error.stack
      }
    });
  }
});

// Отклонение события
router.post('/events/:id/reject', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  // Отключаем кэширование для POST запросов
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('🚫 Попытка отклонить событие:', {
      eventId: id,
      reason: reason,
      userId: req.userId,
      body: req.body
    });
    
    if (!reason || reason.trim().length === 0) {
      console.log('❌ Причина отклонения не указана');
      return res.status(400).json({ error: 'Необходимо указать причину отклонения' });
    }
    
    // Проверяем, какие колонки существуют в таблице events
    const structureCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events'
    `);
    
    const hasModerationStatus = structureCheck.rows.some(row => row.column_name === 'moderation_status');
    const hasIsPublished = structureCheck.rows.some(row => row.column_name === 'is_published');
    
    console.log('📊 moderation_status существует:', hasModerationStatus);
    console.log('📊 is_published существует:', hasIsPublished);
    
    // Строим динамический запрос UPDATE
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (hasModerationStatus) {
      updateFields.push(`moderation_status = $${paramIndex}`);
      queryParams.push('rejected');
      paramIndex++;
      
      updateFields.push(`moderation_reason = $${paramIndex}`);
      queryParams.push(reason);
      paramIndex++;
      
      updateFields.push(`moderated_by = $${paramIndex}`);
      queryParams.push(req.userId);
      paramIndex++;
      
      updateFields.push(`moderated_at = CURRENT_TIMESTAMP`);
    }
    
    if (hasIsPublished) {
      updateFields.push(`is_published = $${paramIndex}`);
      queryParams.push(false);
      paramIndex++;
    }
    
    if (updateFields.length === 0) {
      console.log('⚠️ Нет доступных полей для обновления');
      return res.json({ success: true, message: 'Событие отклонено (нет полей для обновления)' });
    }
    
    queryParams.push(id);
    
    const updateQuery = `UPDATE events SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    console.log('🔍 Выполняем UPDATE запрос:', updateQuery);
    
    await query(updateQuery, queryParams);
    console.log('✅ Событие отклонено');
    
    // Получаем информацию об авторе для уведомления
    console.log('Получаем информацию об авторе события для отклонения:', id);
    const authorResult = await query(`
      SELECT u.id, u.name, u.email, e.title
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1
    `, [id]);
    console.log('Автор события для отклонения:', authorResult.rows);
    
    if (authorResult.rows.length > 0) {
      const author = authorResult.rows[0];
      
      // Создаем или находим чат с автором
      console.log('Ищем чат между администратором и автором для отклонения:', req.userId, author.id);
      let chatResult = await query(
        'SELECT * FROM chats WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
        [req.userId, author.id]
      );
      console.log('Найденный чат для отклонения:', chatResult.rows);
      
      if (chatResult.rows.length === 0) {
        console.log('Создаем новый чат между администратором и автором для отклонения');
        chatResult = await query(
          'INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
          [req.userId, author.id]
        );
        console.log('Созданный чат для отклонения:', chatResult.rows);
      }
      
      const chatId = chatResult.rows[0].id;
      console.log('ID чата для уведомления об отклонении:', chatId);
      
      // Отправляем уведомление об отклонении
      console.log('Отправляем уведомление об отклонении события');
      await query(
        'INSERT INTO messages (chat_id, sender_id, content, is_read) VALUES ($1, $2, $3, false)',
        [chatId, req.userId, `❌ Ваше событие "${author.title}" отклонено.\n\nПричина: ${reason}`]
      );
      console.log('Уведомление об отклонении отправлено');
    } else {
      console.log('Автор события не найден для отклонения');
    }
    
    console.log('✅ Событие успешно отклонено:', id);
    res.json({ 
      message: 'Событие отклонено',
      debug: {
        eventId: id,
        userId: req.userId,
        reason: reason,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Ошибка отклонения события:', error);
    console.error('Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      eventId: req.params.id,
      userId: req.userId,
      reason: req.body.reason
    });
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: error.message,
      eventId: req.params.id,
      debug: {
        eventId: req.params.id,
        userId: req.userId,
        reason: req.body.reason,
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
