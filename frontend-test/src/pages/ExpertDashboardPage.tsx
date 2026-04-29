import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Avatar, Spin } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MessageOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Calendar, Users, Inbox, ChevronLeft, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ExpertCalendar from '../components/ExpertCalendar';
import api from '../api/axios';
import '../styles/Profile.css';

const { Title, Text } = Typography;

interface Client {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  last_booking_date?: string;
  total_bookings: number;
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

const ExpertDashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'calendar' | 'bookings' | 'clients'>('calendar');
  const [clients, setClients] = useState<Client[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.userType !== 'expert' && user.userType !== 'admin')) {
      navigate('/profile'); return;
    }
    loadPendingCount();
    loadClientsCount();
  }, [user, authLoading]);

  useEffect(() => {
    if (activeSection === 'clients') loadClients();
    else if (activeSection === 'bookings') loadAllBookings();
  }, [activeSection]);

  const loadPendingCount = async () => {
    try { const r = await api.get('/bookings/incoming'); setPendingCount(r.data.length); } catch (e) {}
  };
  const loadClientsCount = async () => {
    try { const r = await api.get('/experts/my-clients'); setClients(r.data); } catch (e) {}
  };
  const loadClients = async () => {
    setLoading(true);
    try { const r = await api.get('/experts/my-clients'); setClients(r.data); }
    catch (e) {} finally { setLoading(false); }
  };
  const loadAllBookings = async () => {
    setLoading(true);
    try {
      const r = await api.get('/bookings/expert/bookings');
      setAllBookings(r.data);
      setPendingCount(r.data.filter((b: Booking) => b.status === 'pending').length);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleBookingAction = async (id: number, action: 'confirm' | 'reject', reason?: string) => {
    try { await api.put(`/bookings/${id}/${action}`, { rejectionReason: reason }); await loadAllBookings(); } catch (e) {}
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Отменить запись?')) return;
    try {
      await api.put(`/bookings/expert/bookings/${id}/status`, { status: 'cancelled', rejectionReason: 'Отменено экспертом' });
      await loadAllBookings();
    } catch (e) {}
  };

  const formatDate = (dateStr: string, timeSlot?: string) => {
    const d = new Date(dateStr);
    const formatted = d.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: 'long', year: 'numeric' });
    return `${formatted}${timeSlot ? `, ${timeSlot}` : ''} МСК`;
  };

  const pendingBookings = allBookings.filter(b => b.status === 'pending');
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
  const historyBookings = allBookings.filter(b => ['rejected', 'cancelled'].includes(b.status));

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Spin size="large" /></div>;
  if (!user || (user.userType !== 'expert' && user.userType !== 'admin')) return null;

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { text: string; bg: string; color: string }> = {
      pending: { text: 'Ожидает', bg: '#fff8e1', color: '#f59e0b' },
      confirmed: { text: 'Подтверждено', bg: '#e8f5e9', color: '#22c55e' },
      rejected: { text: 'Отклонено', bg: '#ffeef0', color: '#ef4444' },
      cancelled: { text: 'Отменено', bg: '#f5f5f7', color: '#86868b' }
    };
    const s = map[status] || map.pending;
    return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.text}</span>;
  };

  const BookingCard = ({ booking, actions }: { booking: Booking; actions?: React.ReactNode }) => (
    <div style={{
      display: 'flex', gap: 16, padding: 20, background: '#f5f5f7', borderRadius: 20,
      flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-start',
      textAlign: isMobile ? 'center' : 'left'
    }}>
      <Avatar size={56} src={booking.client_avatar || '/emp.jpg'} icon={<UserOutlined />}
        style={{ border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', flexShrink: 0 }} />
      <div style={{ flex: 1, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
          <Text strong style={{ fontSize: 16 }}>{booking.client_name}</Text>
          <StatusBadge status={booking.status} />
        </div>
        <Text type="secondary" style={{ fontSize: 13 }}>{booking.client_email}</Text>
        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
          📅 {formatDate(booking.date, booking.time_slot)}
        </div>
        {booking.client_message && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 12, fontSize: 13 }}>
            💬 {booking.client_message}
          </div>
        )}
        {booking.rejection_reason && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#ffeef0', borderRadius: 12, fontSize: 13, color: '#ef4444' }}>
            ❌ {booking.rejection_reason}
          </div>
        )}
        {actions && <div style={{ marginTop: 12 }}>{actions}</div>}
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      {/* Шапка */}
      <div className="settings-page-header">
        <button className="settings-back-btn" onClick={() => navigate('/profile')}>
          <ChevronLeft size={22} />
          <span>Профиль</span>
        </button>
        <h1 className="settings-page-title">Кабинет эксперта</h1>
        <div style={{ width: 100 }}></div>
      </div>

      <div className="settings-page-content" style={{ maxWidth: 900 }}>
        {/* Навигация по разделам */}
        <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { key: 'calendar' as const, icon: <Calendar size={22} />, label: 'Календарь', color: '#5856d6', count: 0 },
              { key: 'bookings' as const, icon: <Inbox size={22} />, label: 'Записи', color: '#ff9500', count: pendingCount },
              { key: 'clients' as const, icon: <Users size={22} />, label: 'Клиенты', color: '#34c759', count: clients.length }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '24px 16px', border: 'none', cursor: 'pointer',
                  background: activeSection === item.key ? '#f5f5f7' : '#fff',
                  borderBottom: activeSection === item.key ? `3px solid ${item.color}` : '3px solid transparent',
                  color: activeSection === item.key ? item.color : '#86868b',
                  transition: 'all 0.2s', position: 'relative'
                }}
              >
                {item.icon}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                {item.count > 0 && (
                  <span style={{
                    position: 'absolute', top: 12, right: '25%',
                    background: item.key === 'bookings' ? '#ff3b30' : '#007aff',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 10, minWidth: 18, textAlign: 'center'
                  }}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Контент секции */}
        {activeSection === 'calendar' && (
          <div className="section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: '#eef2ff', borderRadius: 12, fontSize: 13, color: '#5856d6' }}>
              <Clock size={16} /> Все время указано по МСК
            </div>
            <ExpertCalendar />
          </div>
        )}

        {activeSection === 'bookings' && (
          <>
            {/* Pending */}
            {pendingBookings.length > 0 && (
              <div className="section-card" style={{ borderColor: '#ffe58f' }}>
                <h2 className="section-title">⏳ Ожидают подтверждения
                  <span style={{ background: '#ff3b30', color: '#fff', fontSize: 13, padding: '2px 10px', borderRadius: 12, fontWeight: 700, marginLeft: 8 }}>
                    {pendingBookings.length}
                  </span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {pendingBookings.map(b => (
                    <BookingCard key={b.id} booking={b} actions={
                      <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
                        <Button type="primary" icon={<CheckOutlined />} onClick={() => handleBookingAction(b.id, 'confirm')} block={isMobile}
                          style={{ borderRadius: 12, background: '#22c55e', border: 'none' }}>
                          Подтвердить
                        </Button>
                        <Button danger icon={<CloseOutlined />} block={isMobile} style={{ borderRadius: 12 }}
                          onClick={() => { const r = prompt('Причина отклонения (необязательно):'); if (r !== null) handleBookingAction(b.id, 'reject', r || undefined); }}>
                          Отклонить
                        </Button>
                      </Space>
                    } />
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed */}
            {confirmedBookings.length > 0 && (
              <div className="section-card">
                <h2 className="section-title">✅ Подтверждённые записи ({confirmedBookings.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {confirmedBookings.map(b => (
                    <BookingCard key={b.id} booking={b} actions={
                      <Button danger onClick={() => handleCancelBooking(b.id)} block={isMobile} style={{ borderRadius: 12 }}>
                        Отменить запись
                      </Button>
                    } />
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {historyBookings.length > 0 && (
              <div className="section-card" style={{ opacity: 0.75 }}>
                <h2 className="section-title">📝 История ({historyBookings.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {historyBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              </div>
            )}

            {allBookings.length === 0 && !loading && (
              <div className="section-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <Text type="secondary" style={{ fontSize: 16 }}>У вас пока нет записей</Text>
              </div>
            )}

            {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>}
          </>
        )}

        {activeSection === 'clients' && (
          <div className="section-card">
            <h2 className="section-title"><Users size={20} /> Мои клиенты ({clients.length})</h2>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 14 }}>
              Клиенты, которые записывались на консультации
            </Text>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : clients.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {clients.map(client => (
                  <div key={client.id} style={{
                    display: 'flex', gap: 16, padding: 20, background: '#f5f5f7', borderRadius: 20,
                    alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s',
                    flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left'
                  }}
                    onClick={() => navigate(`/experts/${client.id}`)}
                  >
                    <Avatar size={56} src={client.avatar_url || '/emp.jpg'} icon={<UserOutlined />}
                      style={{ border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 16, display: 'block' }}>{client.name}</Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>{client.email}</Text>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#86868b' }}>
                        {client.total_bookings} {client.total_bookings === 1 ? 'запись' : 'записей'}
                        {client.last_booking_date && ` · Последняя: ${formatDate(client.last_booking_date)}`}
                      </div>
                    </div>
                    <Button type="primary" icon={<MessageOutlined />}
                      style={{ borderRadius: 12, background: '#1d1d1f', border: 'none' }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try { const r = await api.post('/chats/create', { otherUserId: client.id }); navigate(`/chats/${r.data.id}`); } catch (e) {}
                      }}
                    >
                      Написать
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                <Text type="secondary" style={{ fontSize: 16 }}>У вас пока нет клиентов</Text>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertDashboardPage;
