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
    
    // Пробуем обновить с полями модерации, если не получается - без них
    try {
      console.log('Пробуем обновить событие с полями модерации:', id);
      await query(
        'UPDATE events SET moderation_status = $1, moderated_by = $2, moderated_at = CURRENT_TIMESTAMP, is_published = true WHERE id = $3',
        ['approved', req.userId, id]
      );
      console.log('Событие обновлено с полями модерации');
    } catch (error) {
      console.log('Поля модерации не найдены, обновляем только is_published:', error.message);
      await query(
        'UPDATE events SET is_published = true WHERE id = $1',
        [id]
      );
      console.log('Событие обновлено без полей модерации');
    }
    
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
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Необходимо указать причину отклонения' });
    }
    
    // Пробуем обновить с полями модерации, если не получается - без них
    try {
      console.log('Пробуем отклонить событие с полями модерации:', id);
      await query(
        'UPDATE events SET moderation_status = $1, moderation_reason = $2, moderated_by = $3, moderated_at = CURRENT_TIMESTAMP WHERE id = $4',
        ['rejected', reason, req.userId, id]
      );
      console.log('Событие отклонено с полями модерации');
    } catch (error) {
      console.log('Поля модерации не найдены, обновляем только is_published:', error.message);
      await query(
        'UPDATE events SET is_published = false WHERE id = $1',
        [id]
      );
      console.log('Событие отклонено без полей модерации');
    }
    
    // Получаем информацию об авторе для уведомления
    const authorResult = await query(`
      SELECT u.id, u.name, u.email, e.title
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1
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
        [chatId, req.userId, `❌ Ваше событие "${author.title}" отклонено.\n\nПричина: ${reason}`]
      );
    }
    
    res.json({ message: 'Событие отклонено' });
  } catch (error) {
    console.error('Ошибка отклонения события:', error);
    console.error('Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      eventId: req.params.id,
      userId: req.userId
    });
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: error.message,
      eventId: req.params.id
    });
  }
});

export default router;
