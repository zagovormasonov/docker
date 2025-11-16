-- =============================================
-- Создание таблиц для системы бронирования
-- Версия 2.0 - Расписание по дням недели
-- =============================================

-- Таблица расписания экспертов по дням недели
CREATE TABLE IF NOT EXISTS expert_schedule (
  id SERIAL PRIMARY KEY,
  expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(expert_id, day_of_week, start_time, end_time)
);

-- Таблица доступных слотов времени для экспертов (для совместимости)
CREATE TABLE IF NOT EXISTS expert_availability (
  id SERIAL PRIMARY KEY,
  expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(expert_id, date, time_slot)
);

-- Таблица бронирований
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  availability_id INTEGER REFERENCES expert_availability(id) ON DELETE CASCADE,
  expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')) DEFAULT 'pending',
  client_message TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации бронирований
CREATE INDEX IF NOT EXISTS idx_expert_schedule_expert ON expert_schedule(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_schedule_day ON expert_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_expert_availability_expert ON expert_availability(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_availability_date ON expert_availability(date);
CREATE INDEX IF NOT EXISTS idx_bookings_expert ON bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

-- Комментарии к таблицам
COMMENT ON TABLE expert_schedule IS 'Расписание работы экспертов по дням недели';
COMMENT ON TABLE expert_availability IS 'Доступные временные слоты для записи к экспертам (генерируются из расписания)';
COMMENT ON TABLE bookings IS 'Записи клиентов к экспертам';

-- Комментарии к колонкам expert_schedule
COMMENT ON COLUMN expert_schedule.expert_id IS 'ID эксперта';
COMMENT ON COLUMN expert_schedule.day_of_week IS 'День недели (0=воскресенье, 1=понедельник, ..., 6=суббота)';
COMMENT ON COLUMN expert_schedule.start_time IS 'Время начала работы';
COMMENT ON COLUMN expert_schedule.end_time IS 'Время окончания работы';
COMMENT ON COLUMN expert_schedule.slot_duration IS 'Длительность слота в минутах (30, 60, 90, 120)';
COMMENT ON COLUMN expert_schedule.is_active IS 'Активно ли расписание';

-- Комментарии к колонкам expert_availability
COMMENT ON COLUMN expert_availability.expert_id IS 'ID эксперта';
COMMENT ON COLUMN expert_availability.date IS 'Дата доступного слота';
COMMENT ON COLUMN expert_availability.time_slot IS 'Временной слот (например, "10:00")';
COMMENT ON COLUMN expert_availability.is_booked IS 'Забронирован ли слот';

-- Комментарии к колонкам bookings
COMMENT ON COLUMN bookings.availability_id IS 'ID слота доступности';
COMMENT ON COLUMN bookings.expert_id IS 'ID эксперта';
COMMENT ON COLUMN bookings.client_id IS 'ID клиента';
COMMENT ON COLUMN bookings.date IS 'Дата записи';
COMMENT ON COLUMN bookings.time_slot IS 'Время записи';
COMMENT ON COLUMN bookings.status IS 'Статус: pending (ожидает), confirmed (подтверждено), rejected (отклонено), cancelled (отменено)';
COMMENT ON COLUMN bookings.client_message IS 'Сообщение от клиента';
COMMENT ON COLUMN bookings.rejection_reason IS 'Причина отклонения (если отклонено)';

-- =============================================
-- Готово! Таблицы созданы успешно
-- =============================================

