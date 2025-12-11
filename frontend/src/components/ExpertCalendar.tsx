import React, { useState, useEffect } from 'react';
import { Modal, Switch } from 'antd';
import { CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import axios from '../api/axios';
import './ExpertCalendar.css';

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

const ExpertCalendar: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
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
  }, []);

  const loadSchedule = async () => {
    try {
      const response = await axios.get('/schedule/expert/schedule');
      setSchedules(response.data);
    } catch (err) {
      console.error('Ошибка загрузки расписания:', err);
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

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, Schedule[]>);

  return (
    <div className="expert-calendar">
      <h2>📅 Расписание</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="availability-section">
        <div className="availability-section">
          <div className="add-slots-section">
            <h3>➕ Добавить расписание</h3>
            <p className="info-text">Добавьте сеансы для каждого дня недели. Укажите время начала и окончания — длительность рассчитается автоматически.</p>
            
            <div className="days-schedule-form">
              {DAYS_OF_WEEK.map(day => {
                const daySchedules = groupedSchedules[day.value] || [];
                const activeCount = daySchedules.filter(s => s.is_active).length;
                const dayActive = activeCount > 0;

                const handleToggleDay = async (makeActive: boolean) => {
                  if (daySchedules.length === 0) return;
                  try {
                    setLoading(true);
                    await Promise.all(
                      daySchedules.map(schedule =>
                        axios.put(`/schedule/expert/schedule/${schedule.id}/toggle`, { isActive: makeActive })
                      )
                    );
                    setSuccess(makeActive ? 'День активирован' : 'День выключен');
                    await loadSchedule();
                  } catch (err: any) {
                    setError(err.response?.data?.error || 'Ошибка обновления дня');
                  } finally {
                    setLoading(false);
                  }
                };


                return (
                  <div key={day.value} className="day-card">
                    <div className="day-card-header">
                      <div className="day-card-title">
                        <div className="day-icon">
                          <CalendarOutlined />
                        </div>
                        <div>
                          <div className="day-title">{day.label}</div>
                          <div className="day-meta">
                            Рабочий день • {daySchedules.length || 0} онлайн-сессии
                          </div>
                        </div>
                      </div>
                      <div className="day-card-actions">
                        <span className={`day-status ${dayActive ? 'active' : 'inactive'}`}>
                          {dayActive ? 'День активен' : 'День выключен'}
                        </span>
                        <Switch
                          checked={dayActive}
                          onChange={(checked) => handleToggleDay(checked)}
                          checkedChildren="Вкл"
                          unCheckedChildren="Выкл"
                          className="day-switch"
                        />
                      </div>
                    </div>

                    <div className="day-sessions">
                      {/* Существующие сеансы */}
                      {daySchedules.length === 0 ? (
                        <div className="empty-day">Нет сеансов в этот день</div>
                      ) : (
                        daySchedules.map(schedule => (
                          <div key={schedule.id} className={`session-card ${!schedule.is_active ? 'inactive' : ''}`}>
                            <div className="session-info">
                              <span className="session-dot" />
                              <span className="session-time">{formatTime(schedule.start_time)} — {formatTime(schedule.end_time)}</span>
                              <span className="session-duration">{schedule.slot_duration} мин</span>
                            </div>
                            <div className="session-controls">
                              <Switch
                                checked={schedule.is_active}
                                onChange={(checked) => handleToggleSchedule(schedule.id, checked)}
                                checkedChildren="Вкл"
                                unCheckedChildren="Выкл"
                                className="session-switch"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Формы добавления новых сеансов */}
                    {activeForms[day.value]?.map((form, index) => (
                      <div key={index} className="session-form">
                        <div className="session-form-title">Добавить новый сеанс</div>
                        <div className="time-inputs wide">
                          <div className="time-input-wrapper">
                            <span className="time-icon">⏱</span>
                            <input
                              type="time"
                              value={form.startTime}
                              onChange={(e) => updateSessionForm(day.value, index, 'startTime', e.target.value)}
                              className="form-input-small"
                              placeholder="Начало"
                            />
                          </div>
                          <span className="time-separator">—</span>
                          <div className="time-input-wrapper">
                            <span className="time-icon">⏱</span>
                            <input
                              type="time"
                              value={form.endTime}
                              onChange={(e) => updateSessionForm(day.value, index, 'endTime', e.target.value)}
                              className="form-input-small"
                              placeholder="Конец"
                            />
                          </div>
                          <span className="slot-length">Оч мин</span>
                        </div>
                        <div className="session-actions modern">
                          <button
                            className="btn-cancel-modern"
                            onClick={() => removeSessionForm(day.value, index)}
                            disabled={loading}
                            title="Отменить"
                          >
                            Отменить
                          </button>
                          <button
                            className="btn-save-modern"
                            onClick={() => handleAddSchedule(day.value, index)}
                            disabled={loading}
                            title="Сохранить"
                          >
                            ✓ Сохранить сеанс
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Кнопка добавления сеанса */}
                    <button
                      className="btn-add-session modern"
                      onClick={() => addSessionForm(day.value)}
                    >
                      + Добавить ещё один сеанс
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="slots-list">
            <h3>Ваше расписание</h3>
            {schedules.length === 0 ? (
              <p className="empty-message">У вас пока нет расписания. Добавьте дни и время работы выше.</p>
            ) : (
              <div className="schedule-list">
                {DAYS_OF_WEEK.map(day => {
                  const daySchedules = groupedSchedules[day.value] || [];
                  if (daySchedules.length === 0) return null;

                  return (
                    <div key={day.value} className="schedule-day-group">
                      <h4>{day.label}</h4>
                      <div className="schedule-items">
                        {daySchedules.map(schedule => (
                          <div key={schedule.id} className="schedule-item">
                            <div className="schedule-info">
                              <span className="schedule-time">
                                🕐 {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </span>
                              <span className="schedule-duration">
                                📊 Слот: {schedule.slot_duration} мин
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
                  </div>
    </div>
  );
};

export default ExpertCalendar;

