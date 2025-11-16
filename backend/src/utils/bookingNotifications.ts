import { query } from '../config/database';

interface BookingNotificationData {
  expertId: number;
  clientId: number;
  bookingId: number;
  date: string;
  timeSlot: string;
  clientMessage?: string;
  status?: string;
  rejectionReason?: string;
}

/**
 * Отправка уведомления о новой брони эксперту
 */
export async function sendBookingRequestNotification(
  io: any,
  data: BookingNotificationData
): Promise<void> {
  try {
    const { expertId, clientId, bookingId, date, timeSlot, clientMessage } = data;

    // Получаем информацию о клиенте
    const clientResult = await query(
      'SELECT name, avatar_url FROM users WHERE id = $1',
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      console.error('Клиент не найден');
      return;
    }

    const client = clientResult.rows[0];

    // Получаем или создаем чат между экспертом и клиентом
    let chatResult = await query(
      `SELECT id FROM chats 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [expertId, clientId]
    );

    let chatId: number;

    if (chatResult.rows.length === 0) {
      // Создаем новый чат
      const newChatResult = await query(
        `INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING id`,
        [expertId, clientId]
      );
      chatId = newChatResult.rows[0].id;
    } else {
      chatId = chatResult.rows[0].id;
    }

    // Форматируем дату
    const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Формируем сообщение
    let messageContent = `📅 Новая запись!\n\n`;
    messageContent += `👤 Клиент: ${client.name}\n`;
    messageContent += `📆 Дата: ${formattedDate}\n`;
    messageContent += `🕐 Время: ${timeSlot}\n`;
    
    if (clientMessage) {
      messageContent += `\n💬 Сообщение от клиента:\n${clientMessage}\n`;
    }
    
    messageContent += `\n🔗 ID брони: #${bookingId}\n`;
    messageContent += `\n✅ Подтвердите или ❌ отклоните запись в разделе "Мои записи"`;

    // Сохраняем системное сообщение в БД
    const messageResult = await query(
      `INSERT INTO messages (chat_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [chatId, clientId, messageContent]
    );

    const message = messageResult.rows[0];

    // Отправляем сообщение через Socket.IO
    const messageWithSender = {
      ...message,
      sender_name: client.name,
      sender_avatar: client.avatar_url
    };

    io.to(`chat_${chatId}`).emit('new_message', messageWithSender);
    io.to(`chat_${chatId}`).emit('booking_request', {
      bookingId,
      clientId,
      date: formattedDate,
      timeSlot
    });

    console.log(`✅ Уведомление о брони #${bookingId} отправлено эксперту #${expertId}`);
  } catch (error) {
    console.error('Ошибка отправки уведомления о брони:', error);
  }
}

/**
 * Отправка уведомления клиенту о статусе брони
 */
export async function sendBookingStatusNotification(
  io: any,
  data: BookingNotificationData
): Promise<void> {
  try {
    const { expertId, clientId, bookingId, date, timeSlot, status, rejectionReason } = data;

    // Получаем информацию об эксперте
    const expertResult = await query(
      'SELECT name, avatar_url FROM users WHERE id = $1',
      [expertId]
    );

    if (expertResult.rows.length === 0) {
      console.error('Эксперт не найден');
      return;
    }

    const expert = expertResult.rows[0];

    // Получаем чат
    const chatResult = await query(
      `SELECT id FROM chats 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [expertId, clientId]
    );

    if (chatResult.rows.length === 0) {
      console.error('Чат не найден');
      return;
    }

    const chatId = chatResult.rows[0].id;

    // Форматируем дату
    const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Формируем сообщение в зависимости от статуса
    let messageContent = '';
    let emoji = '';

    if (status === 'confirmed') {
      emoji = '✅';
      messageContent = `${emoji} Запись подтверждена!\n\n`;
      messageContent += `👨‍⚕️ Эксперт: ${expert.name}\n`;
      messageContent += `📆 Дата: ${formattedDate}\n`;
      messageContent += `🕐 Время: ${timeSlot}\n`;
      messageContent += `\n🔗 ID брони: #${bookingId}\n`;
      messageContent += `\n🎉 Ждём вас на консультации!`;
    } else if (status === 'rejected') {
      emoji = '❌';
      messageContent = `${emoji} Запись отклонена\n\n`;
      messageContent += `👨‍⚕️ Эксперт: ${expert.name}\n`;
      messageContent += `📆 Дата: ${formattedDate}\n`;
      messageContent += `🕐 Время: ${timeSlot}\n`;
      
      if (rejectionReason) {
        messageContent += `\n💬 Причина:\n${rejectionReason}\n`;
      }
      
      messageContent += `\n🔗 ID брони: #${bookingId}\n`;
      messageContent += `\n💡 Вы можете выбрать другое время для записи`;
    } else if (status === 'cancelled') {
      emoji = '🚫';
      messageContent = `${emoji} Запись отменена\n\n`;
      messageContent += `📆 Дата: ${formattedDate}\n`;
      messageContent += `🕐 Время: ${timeSlot}\n`;
      messageContent += `\n🔗 ID брони: #${bookingId}`;
    }

    // Сохраняем системное сообщение в БД
    const messageResult = await query(
      `INSERT INTO messages (chat_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [chatId, expertId, messageContent]
    );

    const message = messageResult.rows[0];

    // Отправляем сообщение через Socket.IO
    const messageWithSender = {
      ...message,
      sender_name: expert.name,
      sender_avatar: expert.avatar_url
    };

    io.to(`chat_${chatId}`).emit('new_message', messageWithSender);
    io.to(`chat_${chatId}`).emit('booking_status_update', {
      bookingId,
      status,
      date: formattedDate,
      timeSlot
    });

    console.log(`✅ Уведомление о статусе брони #${bookingId} (${status}) отправлено клиенту #${clientId}`);
  } catch (error) {
    console.error('Ошибка отправки уведомления о статусе брони:', error);
  }
}

