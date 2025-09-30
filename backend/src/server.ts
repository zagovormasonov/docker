import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDatabase, query } from './config/database';
import jwt from 'jsonwebtoken';

// Routes
import authRoutes from './routes/auth';
import expertsRoutes from './routes/experts';
import articlesRoutes from './routes/articles';
import topicsRoutes from './routes/topics';
import chatsRoutes from './routes/chats';
import usersRoutes from './routes/users';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/experts', expertsRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/users', usersRoutes);

// Socket.IO для чатов
const userSockets = new Map<number, string>();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Требуется авторизация'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Недействительный токен'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.data.userId;
  console.log(`Пользователь ${userId} подключился`);

  userSockets.set(userId, socket.id);

  // Обновление статуса онлайн
  await query('UPDATE users SET is_online = true WHERE id = $1', [userId]);

  // Присоединение к комнатам чатов
  socket.on('join_chat', (chatId: number) => {
    socket.join(`chat_${chatId}`);
  });

  // Отправка сообщения
  socket.on('send_message', async (data: {
    chatId: number;
    content: string;
  }) => {
    try {
      const { chatId, content } = data;

      // Сохранение в БД
      const result = await query(
        `INSERT INTO messages (chat_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [chatId, userId, content]
      );

      const message = result.rows[0];

      // Получение информации об отправителе
      const userResult = await query(
        'SELECT name, avatar_url FROM users WHERE id = $1',
        [userId]
      );

      const messageWithSender = {
        ...message,
        sender_name: userResult.rows[0].name,
        sender_avatar: userResult.rows[0].avatar_url
      };

      // Отправка всем в комнате
      io.to(`chat_${chatId}`).emit('new_message', messageWithSender);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      socket.emit('error', { message: 'Ошибка отправки сообщения' });
    }
  });

  // Typing индикатор
  socket.on('typing', (data: { chatId: number; isTyping: boolean }) => {
    socket.to(`chat_${data.chatId}`).emit('user_typing', {
      userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', async () => {
    console.log(`Пользователь ${userId} отключился`);
    userSockets.delete(userId);
    await query('UPDATE users SET is_online = false WHERE id = $1', [userId]);
  });
});

// Инициализация
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await initDatabase();
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📊 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

startServer();
