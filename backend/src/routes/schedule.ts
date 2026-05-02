import express from 'express';
import { query } from '../config/database';
import { authenticateToken, requireExpert } from '../middleware/auth';

const router = express.Router();

interface AuthRequest extends express.Request {
  userId?: number;
  userType?: string;
}

function rowDateToYMD(v: unknown): string {
  if (v instanceof Date) return v.toISOString().split('T')[0];
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

// Получить расписание эксперта
router.get('/expert/schedule', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM expert_schedule 
       WHERE expert_id = $1
       ORDER BY day_of_week ASC, start_time ASC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения расписания:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить расписание (эксперт)
router.post('/expert/schedule', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: 'Необходимо указать день недели, время начала и окончания' });
    }

    // Валидация дня недели (0 = воскресенье, 6 = суббота)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Неверный день недели (0-6)' });
    }

    // Валидация времени
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Неверный формат времени' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'Время начала должно быть раньше времени окончания' });
    }

    // Проверяем пересечение с существующими сеансами
    const overlapCheck = await query(
      `SELECT id, start_time, end_time FROM expert_schedule 
       WHERE expert_id = $1 
       AND day_of_week = $2 
       AND is_active = true
       AND (
         (start_time < $4 AND end_time > $3) OR  -- Существующий сеанс перекрывает новый
         (start_time >= $3 AND start_time < $4) OR -- Начало существующего внутри нового
         (end_time > $3 AND end_time <= $4)        -- Конец существующего внутри нового
       )`,
      [req.userId, dayOfWeek, startTime, endTime]
    );

    if (overlapCheck.rows.length > 0) {
      const conflictSlot = overlapCheck.rows[0];
      return res.status(400).json({ 
        error: `Время пересекается с существующим сеансом: ${conflictSlot.start_time.slice(0, 5)} - ${conflictSlot.end_time.slice(0, 5)}` 
      });
    }

    // Автоматически вычисляем длительность сеанса в минутах
    const durationMs = end.getTime() - start.getTime();
    const slotDuration = Math.floor(durationMs / (1000 * 60)); // Длительность в минутах

    const result = await query(
      `INSERT INTO expert_schedule (expert_id, day_of_week, start_time, end_time, slot_duration)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (expert_id, day_of_week, start_time, end_time) 
       DO UPDATE SET is_active = true, slot_duration = $5, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.userId, dayOfWeek, startTime, endTime, slotDuration]
    );

    res.status(201).json({
      message: 'Расписание добавлено',
      schedule: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка добавления расписания:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Изменить время интервала (эксперт)
router.put('/expert/schedule/:id', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Необходимо указать время начала и окончания' });
    }

    const checkResult = await query(
      `SELECT * FROM expert_schedule WHERE id = $1 AND expert_id = $2`,
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Расписание не найдено' });
    }

    const row = checkResult.rows[0] as { day_of_week: number };
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Неверный формат времени' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'Время начала должно быть раньше времени окончания' });
    }

    const durationMs = end.getTime() - start.getTime();
    const slotDuration = Math.floor(durationMs / (1000 * 60));

    const overlapCheck = await query(
      `SELECT id, start_time, end_time FROM expert_schedule 
       WHERE expert_id = $1 
       AND day_of_week = $2 
       AND id <> $3
       AND is_active = true
       AND (
         (start_time < $5 AND end_time > $4) OR
         (start_time >= $4 AND start_time < $5) OR
         (end_time > $4 AND end_time <= $5)
       )`,
      [req.userId, row.day_of_week, id, startTime, endTime]
    );

    if (overlapCheck.rows.length > 0) {
      const conflictSlot = overlapCheck.rows[0] as { start_time: string; end_time: string };
      return res.status(400).json({
        error: `Время пересекается с сеансом: ${conflictSlot.start_time.slice(0, 5)} - ${conflictSlot.end_time.slice(0, 5)}`,
      });
    }

    const result = await query(
      `UPDATE expert_schedule 
       SET start_time = $1, end_time = $2, slot_duration = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [startTime, endTime, slotDuration, id]
    );

    res.json({
      message: 'Расписание обновлено',
      schedule: result.rows[0],
    });
  } catch (error) {
    console.error('Ошибка обновления расписания:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить расписание (эксперт)
router.delete('/expert/schedule/:id', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Проверяем что расписание принадлежит эксперту
    const checkResult = await query(
      `SELECT * FROM expert_schedule 
       WHERE id = $1 AND expert_id = $2`,
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Расписание не найдено' });
    }

    // Удаляем запись окончательно
    await query(
      'DELETE FROM expert_schedule WHERE id = $1',
      [id]
    );

    res.json({ message: 'Расписание удалено' });
  } catch (error) {
    console.error('Ошибка удаления расписания:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Переключить активность расписания (эксперт)
router.put('/expert/schedule/:id/toggle', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Проверяем что расписание принадлежит эксперту
    const checkResult = await query(
      `SELECT * FROM expert_schedule 
       WHERE id = $1 AND expert_id = $2`,
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Расписание не найден' });
    }

    const result = await query(
      `UPDATE expert_schedule 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [isActive, id]
    );

    res.json({ 
      message: isActive ? 'Расписание включено' : 'Расписание выключено',
      schedule: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка переключения расписания:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Разовые дни без записи (отдых), поверх недельного шаблона
router.get('/expert/exceptions', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, exception_date, note FROM expert_schedule_exceptions
       WHERE expert_id = $1
       ORDER BY exception_date ASC`,
      [req.userId]
    );
    res.json(
      result.rows.map((r: { id: number; exception_date: unknown; note: string | null }) => ({
        id: r.id,
        exception_date: rowDateToYMD(r.exception_date),
        note: r.note ?? undefined,
      }))
    );
  } catch (error) {
    console.error('Ошибка списка исключений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/expert/exceptions', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const { date, note } = req.body as { date?: string; note?: string };
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Укажите дату в формате YYYY-MM-DD' });
    }
    const noteVal = note && typeof note === 'string' ? note.trim().slice(0, 500) : null;
    try {
      const result = await query(
        `INSERT INTO expert_schedule_exceptions (expert_id, exception_date, note)
         VALUES ($1, $2::date, $3)
         RETURNING id, exception_date, note`,
        [req.userId, date, noteVal]
      );
      const r = result.rows[0] as { id: number; exception_date: unknown; note: string | null };
      res.status(201).json({
        id: r.id,
        exception_date: rowDateToYMD(r.exception_date),
        note: r.note ?? undefined,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === '23505') {
        return res.status(409).json({ error: 'Этот день уже отмечен как выходной' });
      }
      throw e;
    }
  } catch (error) {
    console.error('Ошибка добавления исключения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/expert/exceptions/:id', authenticateToken, requireExpert, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Неверный id' });
    const del = await query(
      `DELETE FROM expert_schedule_exceptions WHERE id = $1 AND expert_id = $2 RETURNING id`,
      [id, req.userId]
    );
    if (del.rows.length === 0) return res.status(404).json({ error: 'Не найдено' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Ошибка удаления исключения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить доступные слоты эксперта на основе расписания (для клиента)
router.get('/expert/:expertId/available-slots', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { expertId } = req.params;
    const { startDate, endDate, daysAhead } = req.query;

    // Определяем диапазон дат
    const start = startDate ? new Date(startDate as string) : new Date();
    const days = daysAhead ? parseInt(daysAhead as string) : 30;
    const end = endDate ? new Date(endDate as string) : new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

    // Получаем расписание эксперта
    const scheduleResult = await query(
      `SELECT * FROM expert_schedule 
       WHERE expert_id = $1 AND is_active = true
       ORDER BY day_of_week, start_time`,
      [expertId]
    );

    if (scheduleResult.rows.length === 0) {
      return res.json([]);
    }

    // Получаем уже забронированные слоты
    const bookedResult = await query(
      `SELECT date, time_slot FROM bookings 
       WHERE expert_id = $1 
       AND date >= $2 
       AND date <= $3
       AND status IN ('pending', 'confirmed')`,
      [expertId, start.toISOString().split('T')[0], end.toISOString().split('T')[0]]
    );

    const bookedSlots = new Set(
      bookedResult.rows.map(row => `${row.date.toISOString().split('T')[0]}_${row.time_slot}`)
    );

    const rangeStart = start.toISOString().split('T')[0];
    const rangeEnd = end.toISOString().split('T')[0];
    const excResult = await query(
      `SELECT exception_date FROM expert_schedule_exceptions
       WHERE expert_id = $1 AND exception_date >= $2::date AND exception_date <= $3::date`,
      [expertId, rangeStart, rangeEnd]
    );
    const exceptionDates = new Set(
      excResult.rows.map((row: { exception_date: unknown }) => rowDateToYMD(row.exception_date))
    );

    // Генерируем доступные слоты
    const slots: any[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (exceptionDates.has(dateStr)) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const dayOfWeek = current.getDay();
      
      // Находим расписание для этого дня недели
      const daySchedules = scheduleResult.rows.filter(s => s.day_of_week === dayOfWeek);

      for (const schedule of daySchedules) {
        const timeSlot = `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`;
        const slotKey = `${dateStr}_${timeSlot}`;

        // Проверяем, забронирован ли этот слот
        if (!bookedSlots.has(slotKey)) {
          slots.push({
            date: dateStr,
            time_slot: timeSlot,
            day_of_week: dayOfWeek,
            is_available: true,
            duration: schedule.slot_duration // Добавляем длительность
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    res.json(slots);
  } catch (error) {
    console.error('Ошибка генерации доступных слотов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

