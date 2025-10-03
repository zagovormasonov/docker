import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Получение списка чатов пользователя
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT c.*, 
              CASE 
                WHEN c.user1_id = $1 THEN u2.id
                ELSE u1.id
              END as other_user_id,
              CASE 
                WHEN c.user1_id = $1 THEN u2.name
                ELSE u1.name
              END as other_user_name,
              CASE 
                WHEN c.user1_id = $1 THEN u2.avatar_url
                ELSE u1.avatar_url
              END as other_user_avatar,
              CASE 
                WHEN c.user1_id = $1 THEN u2.is_online
                ELSE u1.is_online
              END as other_user_online,
              (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
              (SELECT sender_id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_sender_id
       FROM chats c
       JOIN users u1 ON c.user1_id = u1.id
       JOIN users u2 ON c.user2_id = u2.id
       WHERE c.user1_id = $1 OR c.user2_id = $1
       ORDER BY last_message_time DESC NULLS LAST`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение или создание чата
router.post('/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Не указан ID собеседника' });
    }

    // Проверка существования чата
    let result = await query(
      `SELECT * FROM chats 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [req.userId, otherUserId]
    );

    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    }

    // Создание нового чата
    result = await query(
      `INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *`,
      [req.userId, otherUserId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания чата:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение количества непрочитанных сообщений
router.get('/unread-count', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM messages m
       JOIN chats c ON m.chat_id = c.id
       WHERE m.sender_id != $1 
       AND m.is_read = false
       AND (c.user1_id = $1 OR c.user2_id = $1)`,
      [req.userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Ошибка получения количества непрочитанных сообщений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отметить все сообщения как прочитанные
router.post('/mark-all-read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(
      `UPDATE messages SET is_read = true 
       FROM chats c
       WHERE messages.chat_id = c.id 
       AND messages.sender_id != $1
       AND (c.user1_id = $1 OR c.user2_id = $1)`,
      [req.userId]
    );

    res.json({ message: 'Все сообщения отмечены как прочитанные' });
  } catch (error) {
    console.error('Ошибка отметки сообщений как прочитанных:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение сообщений чата
router.get('/:chatId/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;

    // Проверка доступа к чату
    const chatCheck = await query(
      `SELECT * FROM chats WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [chatId, req.userId]
    );

    if (chatCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Нет доступа к этому чату' });
    }

    const result = await query(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = $1
       ORDER BY m.created_at ASC`,
      [chatId]
    );

    // Отметить сообщения как прочитанные
    await query(
      `UPDATE messages SET is_read = true 
       WHERE chat_id = $1 AND sender_id != $2`,
      [chatId, req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
