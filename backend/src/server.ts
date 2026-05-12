import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDatabase, query } from './config/database';
import jwt from 'jsonwebtoken';

// Routes
import authRoutes from './routes/auth';
import expertsRoutes from './routes/experts';
import articlesRoutes from './routes/articles';
import articleInteractionsRoutes from './routes/article-interactions';
import expertInteractionsRoutes from './routes/expert-interactions';
import eventInteractionsRoutes from './routes/event-interactions';
import eventsRoutes from './routes/events';
import moderationRoutes from './routes/moderation';
import adminSetupRoutes from './routes/admin-setup';
import fixAdminRoutes from './routes/fix-admin';
import simpleAdminRoutes from './routes/simple-admin';
import activateModerationRoutes from './routes/activate-moderation';
import topicsRoutes from './routes/topics';
import chatsRoutes from './routes/chats';
import usersRoutes from './routes/users';
import citiesRoutes from './routes/cities';
import uploadRoutes from './routes/upload';
import supportRoutes from './routes/support';
import adminArticlesRoutes from './routes/admin-articles';
import adminEventsRoutes from './routes/admin-events';
import adminUsersRoutes from './routes/admin-users';
import notificationsRoutes from './routes/notifications';
import galleryRoutes from './routes/gallery';
import artworksRoutes from './routes/artworks';
import customSocialsRoutes from './routes/custom-socials';
import paymentsRoutes from './routes/payments';
import productsRoutes from './routes/products';
import testAuthRoutes from './routes/test-auth';
import refreshTokenRoutes from './routes/refresh-token';
import shareRoutes from './routes/share';
import adminLogsRoutes from './routes/adminLogs';
import bookingsRoutes, { setIO as setBookingsIO } from './routes/bookings';
import scheduleRoutes from './routes/schedule';
import subscriptionCheckerRoutes from './routes/subscription-checker';
import adminPinnedArticlesRoutes from './routes/admin-pinned-articles';
import webhooksRoutes from './routes/webhooks';
import adminSettingsRoutes from './routes/admin-settings';


dotenv.config();

// Импорт cron job для проверки подписок
import { startSubscriptionCron } from './utils/subscription-cron';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true, // Разрешаем все origin в продакшене
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: true, // Разрешаем все origin в продакшене
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы для загруженных изображений
const uploadsPath = path.join(__dirname, '../uploads');
console.log('📁 Статический сервер uploads:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/experts', expertsRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/article-interactions', articleInteractionsRoutes);
app.use('/api/expert-interactions', expertInteractionsRoutes);
app.use('/api/event-interactions', eventInteractionsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin-setup', adminSetupRoutes);
app.use('/api/fix-admin', fixAdminRoutes);
app.use('/api/simple-admin', simpleAdminRoutes);
app.use('/api/activate-moderation', activateModerationRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin/articles', adminArticlesRoutes);
app.use('/api/admin/events', adminEventsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/artworks', artworksRoutes);
app.use('/api/users/custom-socials', customSocialsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/test', testAuthRoutes);
app.use('/api/auth', refreshTokenRoutes);
app.use('/api/admin/logs', adminLogsRoutes);
app.use('/api/subscriptions', subscriptionCheckerRoutes);
app.use('/api/admin/pinned-articles', adminPinnedArticlesRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);

app.use('/api/bookings', bookingsRoutes);
app.use('/api/schedule', scheduleRoutes);
// Публичные страницы шаринга для соцсетей (с SSR OG-мета)
app.use('/share', shareRoutes);

// Вебхуки (n8n, платежи и т.д.)
app.use('/api/webhooks', webhooksRoutes);

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
    parentId?: number;
  }) => {
    try {
      const { chatId, content, parentId } = data;

      // Сохранение в БД
      const result = await query(
        `INSERT INTO messages (chat_id, sender_id, content, parent_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [chatId, userId, content, parentId || null]
      );

      const message = result.rows[0];

      // Получение информации об отправителе
      const userResult = await query(
        'SELECT name, avatar_url FROM users WHERE id = $1',
        [userId]
      );

      // Если есть ответ на сообщение, получим данные родительского сообщения
      let parentMessage = null;
      if (parentId) {
        const parentResult = await query(
          `SELECT m.content, u.name as sender_name 
           FROM messages m 
           JOIN users u ON m.sender_id = u.id 
           WHERE m.id = $1`,
          [parentId]
        );
        if (parentResult.rows.length > 0) {
          parentMessage = parentResult.rows[0];
        }
      }

      const messageWithExtra = {
        ...message,
        sender_name: userResult.rows[0].name,
        sender_avatar: userResult.rows[0].avatar_url,
        parent_content: parentMessage?.content,
        parent_sender_name: parentMessage?.sender_name
      };

      // Отправка всем в комнате
      io.to(`chat_${chatId}`).emit('new_message', messageWithExtra);
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

    // Передаем Socket.IO инстанс в модули, которым он нужен
    setBookingsIO(io);

    // Запускаем cron job для ежедневной проверки подписок
    startSubscriptionCron();

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

// Экспорт для использования в других модулях
export { io, userSockets };
