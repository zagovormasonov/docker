import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Layout from '../components/Layout';
import './MyBookingsPage.css';

interface Booking {
  id: number;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  expert_name: string;
  expert_email: string;
  expert_avatar?: string;
  expert_id: number;
  client_message?: string;
  rejection_reason?: string;
  created_at: string;
}

const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings/my-bookings');
      setBookings(response.data);
    } catch (err: any) {
      setError('Ошибка загрузки записей');
      console.error('Ошибка загрузки записей:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Вы уверены, что хотите отменить эту запись?')) {
      return;
    }

    try {
      await axios.put(`/api/bookings/my-bookings/${bookingId}/cancel`);
      setSuccess('Запись отменена');
      await loadBookings();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отмены записи');
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

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: '⏳ Ожидает подтверждения', class: 'status-pending' },
      confirmed: { text: '✅ Подтверждено', class: 'status-confirmed' },
      rejected: { text: '❌ Отклонено', class: 'status-rejected' },
      cancelled: { text: '🚫 Отменено', class: 'status-cancelled' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const pastBookings = bookings.filter(b => ['rejected', 'cancelled'].includes(b.status));

  if (loading) {
    return (
      <Layout>
        <div className="my-bookings-page">
          <div className="loading">Загрузка записей...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="my-bookings-page">
        <h1>📋 Мои записи</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h2>У вас пока нет записей</h2>
            <p>Найдите эксперта и запишитесь на консультацию</p>
            <button className="btn btn-primary" onClick={() => navigate('/experts')}>
              Найти эксперта
            </button>
          </div>
        ) : (
          <div className="bookings-container">
            {pendingBookings.length > 0 && (
              <section className="bookings-section">
                <h2>⏳ Ожидают подтверждения ({pendingBookings.length})</h2>
                <div className="bookings-grid">
                  {pendingBookings.map(booking => (
                    <div key={booking.id} className="booking-card pending-card">
                      <div className="booking-header">
                        <div className="expert-info" onClick={() => navigate(`/experts/${booking.expert_id}`)}>
                          {booking.expert_avatar && (
                            <img src={booking.expert_avatar} alt={booking.expert_name} className="expert-avatar" />
                          )}
                          <div>
                            <h3>{booking.expert_name}</h3>
                            <p className="expert-email">{booking.expert_email}</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="booking-details">
                        <div className="detail-row">
                          <span className="detail-icon">📅</span>
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-icon">🕐</span>
                          <span>{booking.time_slot}</span>
                        </div>
                        {booking.client_message && (
                          <div className="client-message">
                            <strong>💬 Ваше сообщение:</strong>
                            <p>{booking.client_message}</p>
                          </div>
                        )}
                      </div>

                      <div className="booking-actions">
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Отменить запись
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {confirmedBookings.length > 0 && (
              <section className="bookings-section">
                <h2>✅ Подтвержденные записи ({confirmedBookings.length})</h2>
                <div className="bookings-grid">
                  {confirmedBookings.map(booking => (
                    <div key={booking.id} className="booking-card confirmed-card">
                      <div className="booking-header">
                        <div className="expert-info" onClick={() => navigate(`/experts/${booking.expert_id}`)}>
                          {booking.expert_avatar && (
                            <img src={booking.expert_avatar} alt={booking.expert_name} className="expert-avatar" />
                          )}
                          <div>
                            <h3>{booking.expert_name}</h3>
                            <p className="expert-email">{booking.expert_email}</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="booking-details">
                        <div className="detail-row">
                          <span className="detail-icon">📅</span>
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-icon">🕐</span>
                          <span>{booking.time_slot}</span>
                        </div>
                      </div>

                      <div className="booking-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => navigate(`/chats`)}
                        >
                          💬 Написать эксперту
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {pastBookings.length > 0 && (
              <section className="bookings-section">
                <h2>📝 История ({pastBookings.length})</h2>
                <div className="bookings-grid">
                  {pastBookings.map(booking => (
                    <div key={booking.id} className="booking-card past-card">
                      <div className="booking-header">
                        <div className="expert-info" onClick={() => navigate(`/experts/${booking.expert_id}`)}>
                          {booking.expert_avatar && (
                            <img src={booking.expert_avatar} alt={booking.expert_name} className="expert-avatar" />
                          )}
                          <div>
                            <h3>{booking.expert_name}</h3>
                            <p className="expert-email">{booking.expert_email}</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="booking-details">
                        <div className="detail-row">
                          <span className="detail-icon">📅</span>
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-icon">🕐</span>
                          <span>{booking.time_slot}</span>
                        </div>
                        {booking.rejection_reason && (
                          <div className="rejection-reason">
                            <strong>❌ Причина отклонения:</strong>
                            <p>{booking.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyBookingsPage;

