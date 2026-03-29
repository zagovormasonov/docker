import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Button, Space, Alert } from 'antd';
import {
  CalendarOutlined,
  SettingOutlined,
  TeamOutlined,
  InboxOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ExpertCalendar from '../components/ExpertCalendar';
import api from '../api/axios';

const { Title, Text } = Typography;

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

const ExpertDashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('calendar');
  const [showLocalTime, setShowLocalTime] = useState(false);
  const [userCity, setUserCity] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [allBookings, setAllBookings] = useState<AllBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Отслеживаем размер экрана
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Загружаем количество pending заявок и клиентов при инициализации для бейджей
  useEffect(() => {
    if (user && (user.userType === 'expert' || user.userType === 'admin')) {
      loadPendingCount();
      loadClientsCount();
    }
  }, [user]);

  const loadClientsCount = async () => {
    try {
      const response = await api.get('/experts/my-clients');
      setClients(response.data);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    }
  };

  useEffect(() => {
    // Ждём пока AuthContext загрузит пользователя
    if (authLoading) return;
    
    // Проверяем, является ли пользователь экспертом
    if (!user || (user.userType !== 'expert' && user.userType !== 'admin')) {
      navigate('/profile');
      return;
    }

    // Загружаем данные в зависимости от активной вкладки
    if (activeTab === 'clients') {
      loadClients();
    } else if (activeTab === 'bookings') {
      loadAllBookings();
    }

    // Загружаем информацию о городе пользователя
    if (user.city) {
      setUserCity(user.city);
    }
  }, [user, navigate, activeTab, authLoading]);

  const loadPendingCount = async () => {
    try {
      const response = await api.get('/bookings/incoming');
      setPendingCount(response.data.length);
    } catch (error) {
      console.error('Ошибка загрузки количества заявок:', error);
    }
  };

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/experts/my-clients');
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
      const response = await api.get('/bookings/expert/bookings');
      setAllBookings(response.data);
      // Обновляем счетчик pending заявок
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
      await api.put(`/bookings/${bookingId}/${action}`, { rejectionReason });
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
      await api.put(`/bookings/expert/bookings/${bookingId}/status`, {
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
        fontWeight: 500,
        backgroundColor: statusInfo.color + '20',
        color: statusInfo.color
      }}>
        {statusInfo.text}
      </span>
    );
  };

  const formatDateTime = (dateString: string, timeSlot?: string) => {
    const date = new Date(dateString);
    
    if (showLocalTime) {
      // Показываем местное время пользователя
      const formatted = date.toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow', // Базовое время МСК
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return formatted;
    } else {
      // Показываем время по МСК
      const formatted = date.toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      return `${formatted}${timeSlot ? `, ${timeSlot}` : ''} МСК`;
    }
  };

  const pendingBookings = allBookings.filter(b => b.status === 'pending');
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
  const historyBookings = allBookings.filter(b => ['rejected', 'cancelled'].includes(b.status));

  const tabItems = [
    {
      key: 'calendar',
      label: (
        <span>
          <CalendarOutlined /> Календарь
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Alert
              message="Все время указано по МСК (Московское время)"
              type="info"
              showIcon
              icon={<ClockCircleOutlined />}
              action={
                userCity && (
                  <Button
                    size="small"
                    type="text"
                    onClick={() => setShowLocalTime(!showLocalTime)}
                  >
                    {showLocalTime ? 'Показать МСК' : 'Показать местное время'}
                  </Button>
                )
              }
            />
          </div>
          <ExpertCalendar />
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
                fontSize: isMobile ? '18px' : '24px'
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
          <Alert
            message="Все время указано по МСК (Московское время)"
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
            style={{ marginBottom: 16 }}
            action={
              userCity && (
                <Button
                  size="small"
                  type="text"
                  onClick={() => setShowLocalTime(!showLocalTime)}
                >
                  {showLocalTime ? 'Показать МСК' : 'Показать местное время'}
                </Button>
              )
            }
          />
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text>Загрузка записей...</Text>
            </div>
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Ожидающие подтверждения - с выделением */}
              {pendingBookings.length > 0 && (
                <div style={{
                  backgroundColor: '#fffbe6',
                  border: '2px solid #ffe58f',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <Title level={4} style={{ marginTop: 0 }}>
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
                              <Title level={5} style={{ margin: 0 }}>{booking.client_name}</Title>
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

              {/* Подтвержденные */}
              {confirmedBookings.length > 0 && (
                <div>
                  <Title level={4}>✅ Подтвержденные записи ({confirmedBookings.length})</Title>
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
                              <Title level={5} style={{ margin: 0, fontSize: isMobile ? '16px' : '18px' }}>{booking.client_name}</Title>
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

              {/* История */}
              {historyBookings.length > 0 && (
                <div>
                  <Title level={4}>📝 История ({historyBookings.length})</Title>
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
                              <Title level={5} style={{ margin: 0, fontSize: isMobile ? '16px' : '18px' }}>{booking.client_name}</Title>
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
          <Title level={3}>Список клиентов</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Здесь отображаются клиенты, которые записывались к вам на консультации
          </Text>
          <Alert
            message="Все время указано по МСК (Московское время)"
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
            style={{ marginBottom: 16 }}
            action={
              userCity && (
                <Button
                  size="small"
                  type="text"
                  onClick={() => setShowLocalTime(!showLocalTime)}
                >
                  {showLocalTime ? 'Показать МСК' : 'Показать местное время'}
                </Button>
              )
            }
          />
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
                      <Title level={5} style={{ margin: 0, fontSize: isMobile ? '16px' : '18px' }}>{client.name}</Title>
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
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const response = await api.post('/chats/create', { otherUserId: client.id });
                            navigate(`/chats/${response.data.id}`);
                          } catch (error) {
                            console.error('Ошибка создания чата:', error);
                          }
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
  ];

  // Показываем загрузку пока AuthContext проверяет токен
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ marginBottom: 16 }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!user || (user.userType !== 'expert' && user.userType !== 'admin')) {
    return null;
  }

  return (
    <div style={{ 
      padding: isMobile ? '12px' : '24px',
      maxWidth: isMobile ? '100%' : '1200px',
      margin: '0 auto',
      overflowX: 'hidden'
    }}>
      <Card style={{ overflowX: 'hidden' }}>
        <ExpertCalendar />
      </Card>
    </div>
  );
};

export default ExpertDashboardPage;
