import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseOutlined } from '@ant-design/icons';
import axios from '../api/axios';
import './ClientBookingCalendar.css';

interface AvailabilitySlot {
  id?: number;
  date: string;
  time_slot: string;
  is_booked?: boolean;
  duration?: number; // Длительность в минутах
}

interface ClientBookingCalendarProps {
  expertId: number;
  expertName: string;
  onBookingComplete?: () => void;
}

const ClientBookingCalendar: React.FC<ClientBookingCalendarProps> = ({ 
  expertId, 
  expertName,
  onBookingComplete 
}) => {
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [clientMessage, setClientMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAvailableSlots();
  }, [expertId]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const response = await axios.get(`/schedule/expert/${expertId}/available-slots`, {
        params: { 
          startDate: today,
          daysAhead: 30 
        }
      });
      
      setAvailableSlots(response.data);
    } catch (err) {
      console.error('Ошибка загрузки доступных слотов:', err);
      setError('Не удалось загрузить доступные слоты');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    setError('');

    try {
      await axios.post('/bookings/book', {
        date: selectedSlot.date,
        time_slot: selectedSlot.time_slot,
        expertId,
        clientMessage: clientMessage.trim() || undefined
      });

      setSuccess('Запись успешно создана! Ожидайте подтверждения от эксперта.');
      setShowModal(false);
      setSelectedSlot(null);
      setClientMessage('');
      await loadAvailableSlots();
      
      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания записи');
    } finally {
      setLoading(false);
    }
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
    <div className="client-booking-calendar">
      <h2>📅 Запись к эксперту {expertName}</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading && <div className="loading">Загрузка...</div>}

      {!loading && sortedDates.length === 0 ? (
        <div className="empty-state">
          <p>😔 К сожалению, у эксперта пока нет доступных слотов для записи.</p>
          <p>Попробуйте проверить позже или свяжитесь с экспертом напрямую.</p>
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
                    <button
                      key={slot.id || `${date}-${index}`}
                      className="slot-button"
                      onClick={() => handleSlotSelect(slot)}
                      disabled={slot.is_booked}
                    >
                      <span className="slot-time">🕐 {slot.time_slot}</span>
                      {slot.duration && (
                        <span className="slot-duration">⏱️ {formatDuration(slot.duration)}</span>
                      )}
                      <span className="slot-status">🟢 Доступно</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно подтверждения */}
      {showModal && selectedSlot && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">Запись к эксперту</p>
                <h3>Подтверждение записи</h3>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <CloseOutlined />
              </button>
            </div>
            
            <div className="booking-summary">
              <p><strong>Эксперт:</strong> {expertName}</p>
              <p><strong>Дата:</strong> {formatDate(selectedSlot.date)}</p>
              <p><strong>Время:</strong> {selectedSlot.time_slot}</p>
            </div>

            <div className="message-section">
              <label htmlFor="client-message">
                Сообщение для эксперта (необязательно)
              </label>
              <textarea
                id="client-message"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                placeholder="Укажите тему консультации или дополнительную информацию..."
                rows={4}
                maxLength={500}
              />
              <div className="char-counter">
                {clientMessage.length}/500
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleBooking}
                disabled={loading}
              >
                {loading ? 'Создание записи...' : 'Подтвердить запись'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Отмена
              </button>
            </div>

            <div className="info-note">
              ℹ️ После создания записи эксперт получит уведомление и сможет подтвердить или отклонить вашу заявку.
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ClientBookingCalendar;

