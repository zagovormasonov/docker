import express from 'express';
import { query } from '../config/database';
import { authenticateToken, requireExpert } from '../middleware/auth';
import { sendBookingRequestNotification, sendBookingStatusNotification } from '../utils/bookingNotifications';

const router = express.Router();

// Получаем io из server.ts (будет инициализировано через функцию setIO)
let io: any = null;

export const setIO = (socketIO: any) => {
  io = socketIO;
};

interface AuthRequest extends express.Request {
  userId?: number;
  userType?: string;
}

// ==================== МАРШРУТЫ ДЛЯ ЭКСПЕРТА ====================

// Получить все доступные слоты эксперта
router.get('/expert/availability', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM expert_availability 
       WHERE expert_id = $1 
       ORDER BY date ASC, time_slot ASC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения доступных слотов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить доступные слоты времени (эксперт)
router.post('/expert/availability', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { date, timeSlots } = req.body;

    if (!date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать дату и временные слоты' });
    }

    // Проверка формата даты
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: 'Неверный формат даты' });
    }

    // Проверка что дата не в прошлом
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      return res.status(400).json({ error: 'Нельзя добавить слоты на прошедшую дату' });
    }

    const addedSlots = [];
    const errors = [];

    for (const timeSlot of timeSlots) {
      try {
        const result = await query(
          `INSERT INTO expert_availability (expert_id, date, time_slot)
           VALUES ($1, $2, $3)
           ON CONFLICT (expert_id, date, time_slot) DO NOTHING
           RETURNING *`,
          [req.userId, date, timeSlot]
        );

        if (result.rows.length > 0) {
          addedSlots.push(result.rows[0]);
        } else {
          errors.push(`Слот ${timeSlot} уже существует`);
        }
      } catch (error) {
        errors.push(`Ошибка добавления слота ${timeSlot}`);
      }
    }

    res.status(201).json({
      message: 'Слоты добавлены',
      addedSlots,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Ошибка добавления слотов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить доступный слот (эксперт)
router.delete('/expert/availability/:id', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Проверяем что слот принадлежит эксперту и не забронирован
    const checkResult = await query(
      `SELECT * FROM expert_availability 
       WHERE id = $1 AND expert_id = $2`,
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Слот не найден' });
    }

    const slot = checkResult.rows[0];

    if (slot.is_booked) {
      return res.status(400).json({ error: 'Нельзя удалить забронированный слот' });
    }

    await query('DELETE FROM expert_availability WHERE id = $1', [id]);

    res.json({ message: 'Слот удален' });
  } catch (error) {
    console.error('Ошибка удаления слота:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Переключить активность слота (эксперт)
router.put('/expert/availability/:id/toggle', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Проверяем что слот принадлежит эксперту
    const checkResult = await query(
      `SELECT * FROM expert_availability 
       WHERE id = $1 AND expert_id = $2`,
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Слот не найден' });
    }

    const slot = checkResult.rows[0];

    if (slot.is_booked) {
      return res.status(400).json({ error: 'Нельзя изменить активность забронированного слота' });
    }

    const result = await query(
      `UPDATE expert_availability 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [isActive, id]
    );

    res.json({ 
      message: isActive ? 'Слот активирован' : 'Слот отключен',
      slot: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка переключения активности слота:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все брони для эксперта
router.get('/expert/bookings', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT b.*, 
              u.name as client_name, 
              u.email as client_email,
              u.avatar_url as client_avatar,
              u.telegram_url as client_telegram,
              u.whatsapp as client_whatsapp
       FROM bookings b
       JOIN users u ON b.client_id = u.id
       WHERE b.expert_id = $1
       ORDER BY b.date ASC, b.time_slot ASC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения броней:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Подтвердить или отклонить бронь (эксперт)
router.put('/expert/bookings/:id/status', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Некорректный статус. Допустимые: confirmed, rejected' });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ error: 'Необходимо указать причину отклонения' });
    }

    // Проверяем что бронь принадлежит эксперту и имеет статус pending
    const checkResult = await query(
      `SELECT * FROM bookings WHERE id = $1 AND expert_id = $2`,
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Бронь не найдена' });
    }

    const booking = checkResult.rows[0];

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Можно изменить только статус ожидающих броней' });
    }

    // Обновляем статус брони
    await query(
      `UPDATE bookings 
       SET status = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, rejectionReason || null, id]
    );

    // Если отклонено, освобождаем слот в старой таблице (если существует)
    if (status === 'rejected' && booking.availability_id) {
      await query(
        `UPDATE expert_availability 
         SET is_booked = false 
         WHERE id = $1`,
        [booking.availability_id]
      ).catch(() => {
        // Игнорируем ошибку если availability_id = null
      });
    }

    // Отправляем уведомление клиенту
    if (io) {
      await sendBookingStatusNotification(io, {
        expertId: req.userId!,
        clientId: booking.client_id,
        bookingId: booking.id,
        date: booking.date,
        timeSlot: booking.time_slot,
        status,
        rejectionReason
      });
    }

    res.json({ 
      message: status === 'confirmed' ? 'Бронь подтверждена' : 'Бронь отклонена',
      booking: {
        id: booking.id,
        status,
        clientId: booking.client_id
      }
    });
  } catch (error) {
    console.error('Ошибка обновления статуса брони:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== МАРШРУТЫ ДЛЯ КЛИЕНТА ====================

// Получить доступные слоты конкретного эксперта (любой пользователь)
router.get('/expert/:expertId/availability', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { expertId } = req.params;
    const { startDate, endDate } = req.query;

    let queryText = `
      SELECT * FROM expert_availability 
      WHERE expert_id = $1 AND is_booked = false AND is_active = true
    `;
    const params: any[] = [expertId];

    if (startDate) {
      queryText += ` AND date >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      queryText += ` AND date <= $${params.length + 1}`;
      params.push(endDate);
    }

    queryText += ` ORDER BY date ASC, time_slot ASC`;

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения доступных слотов эксперта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Забронировать слот (клиент)
router.post('/book', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { date, time_slot, expertId, clientMessage } = req.body;

    if (!date || !time_slot || !expertId) {
      return res.status(400).json({ error: 'Необходимо указать дату, время и ID эксперта' });
    }

    // Проверяем что пользователь не эксперт, бронирующий сам у себя
    if (req.userId === parseInt(expertId)) {
      return res.status(400).json({ error: 'Нельзя забронировать запись у самого себя' });
    }

    // Проверяем, что дата не в прошлом
    const slotDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (slotDate < today) {
      return res.status(400).json({ error: 'Нельзя забронировать слот на прошедшую дату' });
    }

    // Проверяем что слот еще не забронирован
    const existingBooking = await query(
      `SELECT id FROM bookings 
       WHERE expert_id = $1 AND date = $2 AND time_slot = $3 
       AND status IN ('pending', 'confirmed')`,
      [expertId, date, time_slot]
    );

    if (existingBooking.rows.length > 0) {
      return res.status(400).json({ error: 'Этот слот уже забронирован' });
    }

    // Создаем бронь
    const bookingResult = await query(
      `INSERT INTO bookings (expert_id, client_id, date, time_slot, client_message, availability_id)
       VALUES ($1, $2, $3, $4, $5, NULL)
       RETURNING *`,
      [expertId, req.userId, date, time_slot, clientMessage || null]
    );

    const booking = bookingResult.rows[0];

    // Отправляем уведомление эксперту
    if (io) {
      await sendBookingRequestNotification(io, {
        expertId: parseInt(expertId),
        clientId: req.userId!,
        bookingId: booking.id,
        date,
        timeSlot: time_slot,
        clientMessage
      });
    }

    res.status(201).json({
      message: 'Бронь создана. Ожидайте подтверждения от эксперта',
      booking
    });
  } catch (error) {
    console.error('Ошибка создания брони:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить свои брони (клиент)
router.get('/my-bookings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT b.*, 
              u.name as expert_name, 
              u.email as expert_email,
              u.avatar_url as expert_avatar,
              u.telegram_url as expert_telegram,
              u.whatsapp as expert_whatsapp
       FROM bookings b
       JOIN users u ON b.expert_id = u.id
       WHERE b.client_id = $1
       ORDER BY b.date DESC, b.time_slot ASC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения своих броней:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отменить свою бронь (клиент)
router.put('/my-bookings/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Проверяем что бронь принадлежит клиенту
    const checkResult = await query(
      `SELECT * FROM bookings WHERE id = $1 AND client_id = $2`,
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Бронь не найдена' });
    }

    const booking = checkResult.rows[0];

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Бронь уже отменена' });
    }

    // Отменяем бронь
    await query(
      `UPDATE bookings 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    // Освобождаем слот в старой таблице, если существует
    if (booking.availability_id) {
      await query(
        `UPDATE expert_availability 
         SET is_booked = false 
         WHERE id = $1`,
        [booking.availability_id]
      ).catch(() => {
        // Игнорируем ошибку если availability_id = null
      });
    }

    // Отправляем уведомление эксперту об отмене
    if (io) {
      await sendBookingStatusNotification(io, {
        expertId: booking.expert_id,
        clientId: req.userId!,
        bookingId: booking.id,
        date: booking.date,
        timeSlot: booking.time_slot,
        status: 'cancelled'
      });
    }

    res.json({ message: 'Бронь отменена' });
  } catch (error) {
    console.error('Ошибка отмены брони:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

