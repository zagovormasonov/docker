import React, { useState, useEffect } from 'react';
import { Modal, Switch, Tabs, Card, Typography, Button, Space } from 'antd';
import { CalendarOutlined, CloseOutlined, EditOutlined, ClockCircleOutlined, TeamOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './ExpertCalendar.css';

const { Title, Text } = Typography;

interface Schedule {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

interface Client {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  last_booking_date?: string;
  total_bookings: number;
}

interface AllBooking {
  id: number;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  client_name: string;
  client_email: string;
  client_avatar?: string;
  client_message?: string;
  rejection_reason?: string;
  created_at: string;
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

export interface ExpertCalendarProps {
  /** Встроен в кабинет мастера — общие стили карточки и заголовок снаружи */
  embedded?: boolean;
}

const ExpertCalendar: React.FC<ExpertCalendarProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeView, setActiveView] = useState<'calendar' | 'editor' | 'bookings' | 'clients'>('calendar');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Данные для bookings и clients
  const [clients, setClients] = useState<Client[]>([]);
  const [allBookings, setAllBookings] = useState<AllBooking[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  // Форма добавления расписания - для каждого дня недели
  const [activeForms, setActiveForms] = useState<{[key: number]: {startTime: string, endTime: string}[]}>({});
  const [editingSchedule, setEditingSchedule] = useState<{id: number, startTime: string, endTime: string} | null>(null);

  // Отслеживаем размер экрана
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
    loadPendingCount();
  }, []);

  useEffect(() => {
    if (activeView === 'clients') {
      loadClients();
    } else if (activeView === 'bookings') {
      loadAllBookings();
    }
  }, [activeView]);

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

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      await axios.delete(`/schedule/expert/schedule/${scheduleId}`);
      setSuccess('Расписание удалено');
      await loadSchedule();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления расписания');
    }
  };

  const handleEditSchedule = async (scheduleId: number) => {
    if (!editingSchedule) return;
    
    const { startTime, endTime } = editingSchedule;
    
    if (!startTime || !endTime) {
      setError('Укажите время начала и окончания');
      return;
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (start >= end) {
      setError('Время начала должно быть раньше времени окончания');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`/schedule/expert/schedule/${scheduleId}`, {
        startTime,
        endTime
      });
      setSuccess('Расписание обновлено');
      setEditingSchedule(null);
      await loadSchedule();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления расписания');
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

  // Функции для работы с bookings
  const loadPendingCount = async () => {
    try {
      const response = await axios.get('/bookings/incoming');
      setPendingCount(response.data.length);
    } catch (error) {
      console.error('Ошибка загрузки количества заявок:', error);
    }
  };

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/experts/my-clients');
      setClients(response.data);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/bookings/expert/bookings');
      setAllBookings(response.data);
      const pending = response.data.filter((b: AllBooking) => b.status === 'pending');
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Ошибка загрузки всех записей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: number, action: 'confirm' | 'reject', rejectionReason?: string) => {
    try {
      await axios.put(`/bookings/${bookingId}/${action}`, { rejectionReason });
      await loadAllBookings();
    } catch (error) {
      console.error(`Ошибка ${action === 'confirm' ? 'подтверждения' : 'отклонения'} заявки:`, error);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Вы уверены, что хотите отменить эту запись?')) {
      return;
    }

    try {
      await axios.put(`/bookings/expert/bookings/${bookingId}/status`, {
        status: 'cancelled',
        rejectionReason: 'Отменено экспертом'
      });
      await loadAllBookings();
    } catch (error) {
      console.error('Ошибка отмены записи:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { text: string; color: string }> = {
      pending: { text: '⏳ Ожидает', color: '#faad14' },
      confirmed: { text: '✅ Подтверждено', color: '#52c41a' },
      rejected: { text: '❌ Отклонено', color: '#ff4d4f' },
      cancelled: { text: '🚫 Отменено', color: '#8c8c8c' }
    };
    
    const statusInfo = statusStyles[status] || statusStyles.pending;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 400,
        backgroundColor: statusInfo.color + '20',
        color: statusInfo.color
      }}>
        {statusInfo.text}
      </span>
    );
  };

  const formatDateTime = (dateString: string, timeSlot?: string) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    return `${formatted}${timeSlot ? `, ${timeSlot}` : ''} МСК`;
  };

  const pendingBookings = allBookings.filter(b => b.status === 'pending');
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
  const historyBookings = allBookings.filter(b => ['rejected', 'cancelled'].includes(b.status));

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, Schedule[]>);

  return (
    <div className={`expert-calendar${embedded ? ' expert-calendar--embedded' : ''}`}>
      {!embedded && <h2 style={{ fontWeight: 400 }}>Кабинет эксперта</h2>}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="timezone-info">
        <ClockCircleOutlined className="timezone-icon" />
        <span>Все время указано по МСК (Московское время)</span>
      </div>

      <Tabs
        className={embedded ? 'ec-cal-ant-tabs' : undefined}
        activeKey={activeView}
        onChange={(key) => setActiveView(key as 'calendar' | 'editor' | 'bookings' | 'clients')}
        items={[
          {
            key: 'calendar',
            label: 'Календарь',
            children: (
              <div className="client-view-preview">
                {schedules.filter(s => s.is_active).length === 0 ? (
                  <div className="preview-empty">
                    <p>Нет активных слотов для отображения</p>
                    <p style={{ fontSize: 14, color: '#9ca3af' }}>
                      Добавьте расписание и включите слоты, чтобы они отображались для клиентов
                    </p>
                  </div>
                ) : (
                  <div className="client-calendar-view">
                    {DAYS_OF_WEEK.map(day => {
                      const daySchedules = groupedSchedules[day.value]?.filter(s => s.is_active) || [];
                      if (daySchedules.length === 0) return null;

                      return (
                        <div key={day.value} className="client-date-section">
                          <h3 className="client-date-header">{day.label}</h3>
                          <div className="client-slots-grid">
                            {daySchedules.map(schedule => (
                              <div key={schedule.id} className="client-slot-button">
                                <span className="client-slot-time">🕐 {formatTime(schedule.start_time)}</span>
                                <span className="client-slot-duration">⏱️ {schedule.slot_duration} мин</span>
                                <span className="client-slot-status">🟢 Доступно</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'editor',
            label: 'Редактор',
            children: (
              <div className="availability-section">
                <div className="add-slots-section">
                  <h3>Добавить расписание</h3>
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
                              <button
                                className="day-delete"
                                onClick={() => {
                                  if (daySchedules.length === 0) return;
                                  Modal.confirm({
                                    title: 'Удалить все слоты дня?',
                                    content: 'Все сеансы этого дня будут удалены без возможности восстановления.',
                                    okText: 'Удалить',
                                    cancelText: 'Отмена',
                                    okButtonProps: { danger: true },
                                    centered: true,
                                    onOk: async () => {
                                      try {
                                        setLoading(true);
                                        for (const schedule of daySchedules) {
                                          await handleDeleteSchedule(schedule.id);
                                        }
                                      } finally {
                                        setLoading(false);
                                      }
                                    }
                                  });
                                }}
                                title="Удалить все слоты дня"
                              >
                                <CloseOutlined />
                              </button>
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
                                    <button
                                      className="btn-edit-schedule"
                                      onClick={() => {
                                        Modal.confirm({
                                          title: 'Редактировать сеанс',
                                          centered: true,
                                          content: (
                                            <div style={{ marginTop: 20 }}>
                                              <div style={{ marginBottom: 16 }}>
                                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Время начала:</label>
                                                <input
                                                  type="time"
                                                  defaultValue={schedule.start_time}
                                                  id={`edit-start-${schedule.id}`}
                                                  style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #d9d9d9',
                                                    borderRadius: '6px',
                                                    fontSize: '14px'
                                                  }}
                                                />
                                              </div>
                                              <div>
                                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Время окончания:</label>
                                                <input
                                                  type="time"
                                                  defaultValue={schedule.end_time}
                                                  id={`edit-end-${schedule.id}`}
                                                  style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #d9d9d9',
                                                    borderRadius: '6px',
                                                    fontSize: '14px'
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          ),
                                          okText: 'Сохранить',
                                          cancelText: 'Отмена',
                                          onOk: async () => {
                                            const startInput = document.getElementById(`edit-start-${schedule.id}`) as HTMLInputElement;
                                            const endInput = document.getElementById(`edit-end-${schedule.id}`) as HTMLInputElement;
                                            
                                            if (!startInput?.value || !endInput?.value) {
                                              setError('Укажите время начала и окончания');
                                              return;
                                            }

                                            const start = new Date(`2000-01-01T${startInput.value}`);
                                            const end = new Date(`2000-01-01T${endInput.value}`);
                                            
                                            if (start >= end) {
                                              setError('Время начала должно быть раньше времени окончания');
                                              return;
                                            }

                                            try {
                                              setLoading(true);
                                              await axios.put(`/schedule/expert/schedule/${schedule.id}`, {
                                                startTime: startInput.value,
                                                endTime: endInput.value
                                              });
                                              setSuccess('Расписание обновлено');
                                              await loadSchedule();
                                            } catch (err: any) {
                                              setError(err.response?.data?.error || 'Ошибка обновления расписания');
                                            } finally {
                                              setLoading(false);
                                            }
                                          }
                                        });
                                      }}
                                      title="Редактировать"
                                    >
                                      <EditOutlined />
                                    </button>
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
            )
          },
          {
            key: 'bookings',
            label: (
              <span>
                <InboxOutlined /> Управление записями
                {pendingCount > 0 && (
                  <span style={{
                    marginLeft: 8,
                    backgroundColor: '#ff4d4f',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {pendingCount}
                  </span>
                )}
              </span>
            ),
            children: (
              <div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: '12px',
                  marginBottom: 16 
                }}>
                  <div>
                    <Title level={3} style={{ 
                      margin: 0,
                      fontSize: isMobile ? '18px' : '24px',
                      fontWeight: 400
                    }}>Управление записями</Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '14px' }}>
                      Все записи клиентов: подтверждение заявок, управление расписанием
                    </Text>
                  </div>
                  {pendingCount > 0 && (
                    <div style={{
                      backgroundColor: '#fff1f0',
                      border: '1px solid #ffccc7',
                      borderRadius: 8,
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: isMobile ? '100%' : 'auto',
                      justifyContent: isMobile ? 'center' : 'flex-start'
                    }}>
                      <span style={{ fontSize: 20 }}>🔔</span>
                      <Text strong style={{ color: '#ff4d4f' }}>
                        {pendingCount} {pendingCount === 1 ? 'новая заявка' : 'новых заявок'}
                      </Text>
                    </div>
                  )}
                </div>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <Text>Загрузка записей...</Text>
                  </div>
                ) : (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {pendingBookings.length > 0 && (
                      <div style={{
                        backgroundColor: '#fffbe6',
                        border: '2px solid #ffe58f',
                        borderRadius: 8,
                        padding: 16
                      }}>
                        <Title level={4} style={{ marginTop: 0, fontWeight: 400 }}>
                          ⏳ Ожидают подтверждения 
                          <span style={{
                            marginLeft: 8,
                            backgroundColor: '#ff4d4f',
                            color: '#fff',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '14px'
                          }}>
                            {pendingBookings.length}
                          </span>
                        </Title>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          {pendingBookings.map((booking) => (
                            <Card key={booking.id}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <img 
                                  src={booking.client_avatar || '/emp.jpg'} 
                                  alt={booking.client_name}
                                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Title level={5} style={{ margin: 0, fontWeight: 400 }}>{booking.client_name}</Title>
                                    {getStatusBadge(booking.status)}
                                  </div>
                                  <Text type="secondary">{booking.client_email}</Text>
                                  <br />
                                  <Text strong style={{ marginTop: 8, display: 'block' }}>
                                    📅 {formatDateTime(booking.date, booking.time_slot)}
                                  </Text>
                                  {booking.client_message && (
                                    <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                      <Text style={{ fontSize: 12 }}>
                                        <strong>💬 Сообщение:</strong> {booking.client_message}
                                      </Text>
                                    </div>
                                  )}
                                  <div style={{ marginTop: 12 }}>
                                    <Space 
                                      direction={isMobile ? 'vertical' : 'horizontal'}
                                      style={{ width: isMobile ? '100%' : 'auto' }}
                                    >
                                      <Button 
                                        type="primary" 
                                        onClick={() => handleBookingAction(booking.id, 'confirm')}
                                        block={isMobile}
                                      >
                                        ✓ Подтвердить
                                      </Button>
                                      <Button 
                                        danger
                                        onClick={() => {
                                          const reason = prompt('Укажите причину отклонения (необязательно):');
                                          if (reason !== null) {
                                            handleBookingAction(booking.id, 'reject', reason || undefined);
                                          }
                                        }}
                                        block={isMobile}
                                      >
                                        ✕ Отклонить
                                      </Button>
                                    </Space>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </Space>
                      </div>
                    )}

                    {confirmedBookings.length > 0 && (
                      <div>
                        <Title level={4} style={{ fontWeight: 400 }}>✅ Подтвержденные записи ({confirmedBookings.length})</Title>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          {confirmedBookings.map((booking) => (
                            <Card key={booking.id}>
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'center' : 'flex-start',
                                gap: 16,
                                textAlign: isMobile ? 'center' : 'left'
                              }}>
                                <img 
                                  src={booking.client_avatar || '/emp.jpg'} 
                                  alt={booking.client_name}
                                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between', 
                                    alignItems: isMobile ? 'center' : 'center',
                                    gap: '8px',
                                    marginBottom: 8 
                                  }}>
                                    <Title level={5} style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 400 }}>{booking.client_name}</Title>
                                    {getStatusBadge(booking.status)}
                                  </div>
                                  <Text type="secondary">{booking.client_email}</Text>
                                  <br />
                                  <Text strong style={{ marginTop: 8, display: 'block' }}>
                                    📅 {formatDateTime(booking.date, booking.time_slot)}
                                  </Text>
                                  <div style={{ marginTop: 12 }}>
                                    <Button 
                                      danger
                                      onClick={() => handleCancelBooking(booking.id)}
                                      block={isMobile}
                                    >
                                      ✕ Отменить запись
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </Space>
                      </div>
                    )}

                    {historyBookings.length > 0 && (
                      <div>
                        <Title level={4} style={{ fontWeight: 400 }}>📝 История ({historyBookings.length})</Title>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          {historyBookings.map((booking) => (
                            <Card key={booking.id} style={{ opacity: 0.7 }}>
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'center' : 'flex-start',
                                gap: 16,
                                textAlign: isMobile ? 'center' : 'left'
                              }}>
                                <img 
                                  src={booking.client_avatar || '/emp.jpg'} 
                                  alt={booking.client_name}
                                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between', 
                                    alignItems: isMobile ? 'center' : 'center',
                                    gap: '8px',
                                    marginBottom: 8 
                                  }}>
                                    <Title level={5} style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 400 }}>{booking.client_name}</Title>
                                    {getStatusBadge(booking.status)}
                                  </div>
                                  <Text type="secondary">{booking.client_email}</Text>
                                  <br />
                                  <Text strong style={{ marginTop: 8, display: 'block' }}>
                                    📅 {formatDateTime(booking.date, booking.time_slot)}
                                  </Text>
                                  {booking.rejection_reason && (
                                    <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff1f0', borderRadius: 4, borderLeft: '3px solid #ff4d4f' }}>
                                      <Text style={{ fontSize: 12, color: '#ff4d4f' }}>
                                        <strong>❌ Причина отклонения:</strong> {booking.rejection_reason}
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </Space>
                      </div>
                    )}

                    {allBookings.length === 0 && (
                      <Card>
                        <Text type="secondary">У вас пока нет записей</Text>
                      </Card>
                    )}
                  </Space>
                )}
              </div>
            )
          },
          {
            key: 'clients',
            label: (
              <span>
                <TeamOutlined /> Мои клиенты
                {clients.length > 0 && (
                  <span style={{
                    marginLeft: 8,
                    backgroundColor: '#e6f7ff',
                    color: '#1890ff',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {clients.length}
                  </span>
                )}
              </span>
            ),
            children: (
              <div>
                <Title level={3} style={{ fontWeight: 400 }}>Список клиентов</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Здесь отображаются клиенты, которые записывались к вам на консультации
                </Text>
                {loading ? (
                  <Text>Загрузка...</Text>
                ) : clients.length > 0 ? (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {clients.map((client) => (
                      <Card 
                        key={client.id} 
                        hoverable
                        onClick={() => navigate(`/experts/${client.id}`)}
                      >
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: 'center', 
                          gap: 16,
                          textAlign: isMobile ? 'center' : 'left'
                        }}>
                          <img 
                            src={client.avatar_url || '/emp.jpg'} 
                            alt={client.name}
                            style={{ 
                              width: 60, 
                              height: 60, 
                              borderRadius: '50%', 
                              objectFit: 'cover' 
                            }}
                          />
                          <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
                            <Title level={5} style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 400 }}>{client.name}</Title>
                            <Text type="secondary">{client.email}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Всего записей: {client.total_bookings}
                            </Text>
                            {client.last_booking_date && (
                              <>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Последняя запись: {formatDateTime(client.last_booking_date)}
                                </Text>
                              </>
                            )}
                          </div>
                          <Button 
                            type="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/chats`);
                            }}
                            block={isMobile}
                            style={{ width: isMobile ? '100%' : 'auto' }}
                          >
                            Написать
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Card>
                    <Text type="secondary">У вас пока нет клиентов</Text>
                  </Card>
                )}
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

export default ExpertCalendar;
