import React, { useState, useEffect } from 'react';
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

interface Booking {
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

const ExpertCalendar: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'bookings'>('schedule');

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
    loadBookings();
  }, []);

  const loadSchedule = async () => {
    try {
      const response = await axios.get('/schedule/expert/schedule');
      setSchedules(response.data);
    } catch (err) {
      console.error('Ошибка загрузки расписания:', err);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await axios.get('/bookings/expert/bookings');
      setBookings(response.data);
    } catch (err) {
      console.error('Ошибка загрузки броней:', err);
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

  const handleBookingAction = async (bookingId: number, status: 'confirmed' | 'rejected') => {
    let rejectionReason = '';
    
    if (status === 'rejected') {
      rejectionReason = prompt('Укажите причину отклонения:') || '';
      if (!rejectionReason) {
        return;
      }
    }

    try {
      await axios.put(`/bookings/expert/bookings/${bookingId}/status`, {
        status,
        rejectionReason
      });

      setSuccess(status === 'confirmed' ? 'Запись подтверждена!' : 'Запись отклонена');
      await loadBookings();
      await loadSchedule();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления статуса');
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Вы уверены, что хотите отменить эту запись?')) {
      return;
    }

    try {
      await axios.put(`/bookings/expert/bookings/${bookingId}/status`, {
        status: 'cancelled'
      });

      setSuccess('Запись отменена');
      await loadBookings();
      await loadSchedule();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отмены записи');
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const day = DAYS_OF_WEEK.find(d => d.value === dayOfWeek);
    return day ? day.label : 'Неизвестно';
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: 'Ожидает', class: 'status-pending' },
      confirmed: { text: 'Подтверждено', class: 'status-confirmed' },
      rejected: { text: 'Отклонено', class: 'status-rejected' },
      cancelled: { text: 'Отменено', class: 'status-cancelled' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, Schedule[]>);

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const pastBookings = bookings.filter(b => ['rejected', 'cancelled'].includes(b.status));

  return (
    <div className="expert-calendar">
      <h2>📅 Управление записями</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="calendar-tabs">
        <button
          className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Расписание
        </button>
        <button
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Записи {pendingBookings.length > 0 && <span className="badge">{pendingBookings.length}</span>}
        </button>
      </div>

      {activeTab === 'schedule' && (
        <div className="availability-section">
          <div className="add-slots-section">
            <h3>➕ Добавить расписание</h3>
            <p className="info-text">Добавьте сеансы для каждого дня недели. Укажите время начала и окончания — длительность рассчитается автоматически.</p>
            
            <div className="days-schedule-form">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.value} className="day-schedule-block">
                  <h4 className="day-title">{day.label}</h4>
                  
                  {/* Существующие сеансы */}
                  {groupedSchedules[day.value]?.map(schedule => (
                    <div key={schedule.id} className="existing-session">
                      <span>🕐 {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                      <button
                        className="btn-delete-small"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        title="Удалить"
                      >
                        ✕
                      </button>
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
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              title="Удалить расписание"
                            >
                              ✕
                            </button>
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
      )}

      {activeTab === 'bookings' && (
        <div className="bookings-section">
          {pendingBookings.length > 0 && (
            <div className="bookings-group">
              <h3>⏳ Ожидают подтверждения ({pendingBookings.length})</h3>
              {pendingBookings.map(booking => (
                <div key={booking.id} className="booking-card pending">
                  <div className="booking-header">
                    <div className="client-info">
                      {booking.client_avatar && (
                        <img src={booking.client_avatar} alt={booking.client_name} className="client-avatar" />
                      )}
                      <div>
                        <h4>{booking.client_name}</h4>
                        <p className="client-email">{booking.client_email}</p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  <div className="booking-details">
                    <p><strong>📅 Дата:</strong> {formatDate(booking.date)}</p>
                    <p><strong>🕐 Время:</strong> {booking.time_slot}</p>
                    {booking.client_message && (
                      <p className="client-message">
                        <strong>💬 Сообщение:</strong><br />
                        {booking.client_message}
                      </p>
                    )}
                  </div>

                  <div className="booking-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => handleBookingAction(booking.id, 'confirmed')}
                    >
                      ✓ Подтвердить
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleBookingAction(booking.id, 'rejected')}
                    >
                      ✕ Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {upcomingBookings.length > 0 && (
            <div className="bookings-group">
              <h3>✅ Подтвержденные записи ({upcomingBookings.length})</h3>
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="booking-card confirmed">
                  <div className="booking-header">
                    <div className="client-info">
                      {booking.client_avatar && (
                        <img src={booking.client_avatar} alt={booking.client_name} className="client-avatar" />
                      )}
                      <div>
                        <h4>{booking.client_name}</h4>
                        <p className="client-email">{booking.client_email}</p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  <div className="booking-details">
                    <p><strong>📅 Дата:</strong> {formatDate(booking.date)}</p>
                    <p><strong>🕐 Время:</strong> {booking.time_slot}</p>
                  </div>

                  <div className="booking-actions">
                    <button
                      className="btn btn-danger"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      ✕ Отменить запись
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pastBookings.length > 0 && (
            <div className="bookings-group">
              <h3>📝 История ({pastBookings.length})</h3>
              {pastBookings.map(booking => (
                <div key={booking.id} className="booking-card past">
                  <div className="booking-header">
                    <div className="client-info">
                      {booking.client_avatar && (
                        <img src={booking.client_avatar} alt={booking.client_name} className="client-avatar" />
                      )}
                      <div>
                        <h4>{booking.client_name}</h4>
                        <p className="client-email">{booking.client_email}</p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  <div className="booking-details">
                    <p><strong>📅 Дата:</strong> {formatDate(booking.date)}</p>
                    <p><strong>🕐 Время:</strong> {booking.time_slot}</p>
                    {booking.rejection_reason && (
                      <p className="rejection-reason">
                        <strong>❌ Причина отклонения:</strong><br />
                        {booking.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {bookings.length === 0 && (
            <p className="empty-message">У вас пока нет записей</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertCalendar;

