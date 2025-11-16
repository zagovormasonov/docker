import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './ExpertCalendar.css';

interface AvailabilitySlot {
  id: number;
  date: string;
  time_slot: string;
  is_booked: boolean;
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

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const ExpertCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'availability' | 'bookings'>('availability');

  useEffect(() => {
    loadAvailableSlots();
    loadBookings();
  }, []);

  const loadAvailableSlots = async () => {
    try {
      const response = await axios.get('/api/bookings/expert/availability');
      setAvailableSlots(response.data);
    } catch (err) {
      console.error('Ошибка загрузки слотов:', err);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await axios.get('/api/bookings/expert/bookings');
      setBookings(response.data);
    } catch (err) {
      console.error('Ошибка загрузки броней:', err);
    }
  };

  const handleTimeSlotToggle = (timeSlot: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(timeSlot)
        ? prev.filter(slot => slot !== timeSlot)
        : [...prev, timeSlot]
    );
  };

  const handleAddSlots = async () => {
    if (selectedTimeSlots.length === 0) {
      setError('Выберите хотя бы один временной слот');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      await axios.post('/api/bookings/expert/availability', {
        date: dateStr,
        timeSlots: selectedTimeSlots
      });

      setSuccess('Слоты успешно добавлены!');
      setSelectedTimeSlots([]);
      await loadAvailableSlots();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка добавления слотов');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот слот?')) {
      return;
    }

    try {
      await axios.delete(`/api/bookings/expert/availability/${slotId}`);
      setSuccess('Слот удален');
      await loadAvailableSlots();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления слота');
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
      await axios.put(`/api/bookings/expert/bookings/${bookingId}/status`, {
        status,
        rejectionReason
      });

      setSuccess(status === 'confirmed' ? 'Запись подтверждена!' : 'Запись отклонена');
      await loadBookings();
      await loadAvailableSlots();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления статуса');
    }
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

  const groupedSlots = availableSlots.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

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
          className={`tab-button ${activeTab === 'availability' ? 'active' : ''}`}
          onClick={() => setActiveTab('availability')}
        >
          🗓️ Доступные даты
        </button>
        <button
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Записи {pendingBookings.length > 0 && <span className="badge">{pendingBookings.length}</span>}
        </button>
      </div>

      {activeTab === 'availability' && (
        <div className="availability-section">
          <div className="add-slots-section">
            <h3>Добавить доступное время</h3>
            
            <div className="date-picker">
              <label>Выберите дату:</label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>

            <div className="time-slots-grid">
              {TIME_SLOTS.map(timeSlot => (
                <button
                  key={timeSlot}
                  className={`time-slot-button ${selectedTimeSlots.includes(timeSlot) ? 'selected' : ''}`}
                  onClick={() => handleTimeSlotToggle(timeSlot)}
                >
                  {timeSlot}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleAddSlots}
              disabled={loading || selectedTimeSlots.length === 0}
            >
              {loading ? 'Добавление...' : 'Добавить выбранные слоты'}
            </button>
          </div>

          <div className="slots-list">
            <h3>Ваши доступные слоты</h3>
            {Object.keys(groupedSlots).length === 0 ? (
              <p className="empty-message">У вас пока нет доступных слотов</p>
            ) : (
              Object.keys(groupedSlots)
                .sort()
                .map(date => (
                  <div key={date} className="date-group">
                    <h4>{formatDate(date)}</h4>
                    <div className="slots-row">
                      {groupedSlots[date].map(slot => (
                        <div
                          key={slot.id}
                          className={`slot-item ${slot.is_booked ? 'booked' : 'free'}`}
                        >
                          <span className="slot-time">{slot.time_slot}</span>
                          <span className={`slot-status ${slot.is_booked ? 'status-booked' : 'status-free'}`}>
                            {slot.is_booked ? '🔴 Занято' : '🟢 Свободно'}
                          </span>
                          {!slot.is_booked && (
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteSlot(slot.id)}
                              title="Удалить слот"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
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

