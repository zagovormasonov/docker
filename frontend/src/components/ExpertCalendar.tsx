import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import './ExpertCalendar.css';
import '../components/ClientBookingCalendar.css';

interface Schedule {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 0, label: 'Воскресенье' }
];

interface AvailabilitySlot {
  id?: number;
  date: string;
  time_slot: string;
  is_booked?: boolean;
  duration?: number;
}

const ExpertCalendar: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Форма добавления расписания - для каждого дня недели
  const [activeForms, setActiveForms] = useState<{[key: number]: {startTime: string, endTime: string}[]}>({});
  
  const addSessionForm = (dayOfWeek: number) => {
    setActiveForms(prev => ({
      ...prev,
      [dayOfWeek]: [...(prev[dayOfWeek] || []), { startTime: '09:00', endTime: '18:00' }]
    }));
  };
  
  const removeSessionForm = (dayOfWeek: number, index: number) => {
    setActiveForms(prev => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].filter((_, i) => i !== index)
    }));
  };
  
  const updateSessionForm = (dayOfWeek: number, index: number, field: 'startTime' | 'endTime', value: string) => {
    setActiveForms(prev => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].map((form, i) => 
        i === index ? { ...form, [field]: value } : form
      )
    }));
  };

  useEffect(() => {
    loadSchedule();
    if (user?.id) {
      loadAvailableSlots();
    }
  }, [user]);

  const loadSchedule = async () => {
    try {
      const response = await axios.get('/schedule/expert/schedule');
      setSchedules(response.data);
      // Перезагружаем доступные слоты после обновления расписания
      if (user?.id) {
        loadAvailableSlots();
      }
    } catch (err) {
      console.error('Ошибка загрузки расписания:', err);
    }
  };

  const loadAvailableSlots = async () => {
    if (!user?.id) return;
    try {
      setLoadingSlots(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`/schedule/expert/${user.id}/available-slots`, {
        params: { 
          startDate: today,
          daysAhead: 30 
        }
      });
      setAvailableSlots(response.data);
    } catch (err) {
      console.error('Ошибка загрузки доступных слотов:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAddSchedule = async (dayOfWeek: number, index: number) => {
    const form = activeForms[dayOfWeek]?.[index];
    if (!form) return;
    
    const { startTime, endTime } = form;
    
    if (!startTime || !endTime) {
      setError('Укажите время начала и окончания');
      return;
    }

    // Валидация времени
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (start >= end) {
      setError('Время начала должно быть раньше времени окончания');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/schedule/expert/schedule', {
        dayOfWeek,
        startTime,
        endTime
        // slotDuration вычисляется автоматически на backend
      });

      setSuccess('Сеанс добавлен!');
      removeSessionForm(dayOfWeek, index);
      await loadSchedule();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка добавления расписания');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это расписание?')) {
      return;
    }

    try {
      await axios.delete(`/schedule/expert/schedule/${scheduleId}`);
      setSuccess('Расписание удалено');
      await loadSchedule();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления расписания');
    }
  };

  const handleToggleSchedule = async (scheduleId: number, isActive: boolean) => {
    try {
      await axios.put(`/schedule/expert/schedule/${scheduleId}/toggle`, {
        isActive
      });
      setSuccess(isActive ? 'Расписание включено' : 'Расписание выключено');
      await loadSchedule();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления статуса расписания');
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours} ч ${mins} мин`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
    } else {
      return `${mins} мин`;
    }
  };

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, Schedule[]>);

  const groupedSlots = availableSlots.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <div className="expert-calendar">
      <h2 style={{ fontWeight: 500 }}>📅 Расписание</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="availability-section">
        <div className="availability-section">
          <div className="add-slots-section">
            <h3 style={{ fontWeight: 500 }}>➕ Добавить расписание</h3>
            <p className="info-text">Добавьте сеансы для каждого дня недели. Укажите время начала и окончания — длительность рассчитается автоматически.</p>
            
            <div className="days-schedule-form">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.value} className="day-schedule-block">
                  <h4 className="day-title">{day.label}</h4>
                  
                  {/* Существующие сеансы */}
                  {groupedSchedules[day.value]?.map(schedule => (
                    <div key={schedule.id} className={`existing-session ${!schedule.is_active ? 'inactive' : ''}`}>
                      <span>🕐 {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                      <div className="session-controls">
                        <button
                          className={`btn-toggle-small ${!schedule.is_active ? 'inactive' : ''}`}
                          onClick={() => handleToggleSchedule(schedule.id, !schedule.is_active)}
                          title={schedule.is_active ? "Выключить" : "Включить"}
                        >
                          {schedule.is_active ? "ON" : "OFF"}
                        </button>
                        <button
                          className="btn-delete-small"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          title="Удалить"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Формы добавления новых сеансов */}
                  {activeForms[day.value]?.map((form, index) => (
                    <div key={index} className="session-form">
                      <div className="time-inputs">
                        <input
                          type="time"
                          value={form.startTime}
                          onChange={(e) => updateSessionForm(day.value, index, 'startTime', e.target.value)}
                          className="form-input-small"
                          placeholder="Начало"
                        />
                        <span className="time-separator">-</span>
                        <input
                          type="time"
                          value={form.endTime}
                          onChange={(e) => updateSessionForm(day.value, index, 'endTime', e.target.value)}
                          className="form-input-small"
                          placeholder="Конец"
                        />
                      </div>
                      <div className="session-actions">
                        <button
                          className="btn-save-small"
                          onClick={() => handleAddSchedule(day.value, index)}
                          disabled={loading}
                          title="Сохранить"
                        >
                          ✓
                        </button>
                        <button
                          className="btn-cancel-small"
                          onClick={() => removeSessionForm(day.value, index)}
                          disabled={loading}
                          title="Отменить"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Кнопка добавления сеанса */}
                  <button
                    className="btn-add-session"
                    onClick={() => addSessionForm(day.value)}
                  >
                    + Добавить сеанс
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Отображение календаря как видят пользователи */}
          <div style={{ marginTop: 40 }}>
            <h3 style={{ fontSize: 20, marginBottom: 20, color: 'var(--text-primary)', fontWeight: 500 }}>
              📅 Как видят ваше расписание пользователи
            </h3>
            {loadingSlots ? (
              <div className="loading">Загрузка доступных слотов...</div>
            ) : sortedDates.length === 0 ? (
              <div className="empty-state">
                <p>😔 У вас пока нет доступных слотов для записи.</p>
                <p>Добавьте расписание выше, чтобы пользователи могли записаться к вам.</p>
              </div>
            ) : (
              <div className="calendar-view">
                {sortedDates.map(date => (
                  <div key={date} className="date-section">
                    <h3 className="date-header">{formatDate(date)}</h3>
                    <div className="slots-grid">
                      {groupedSlots[date]
                        .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
                        .map((slot, index) => (
                          <div
                            key={slot.id || `${date}-${index}`}
                            className="slot-button"
                            style={{ cursor: 'default' }}
                          >
                            <span className="slot-time">🕐 {slot.time_slot}</span>
                            {slot.duration && (
                              <span className="slot-duration">⏱️ {formatDuration(slot.duration)}</span>
                            )}
                            <span className="slot-status">
                              {slot.is_booked ? '🔴 Забронировано' : '🟢 Доступно'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
                  </div>
    </div>
  );
};

export default ExpertCalendar;

