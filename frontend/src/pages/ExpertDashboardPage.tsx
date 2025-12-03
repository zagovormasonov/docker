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

interface IncomingBooking {
  id: number;
  date: string;
  time_slot: string;
  status: string;
  client_name: string;
  client_email: string;
  client_avatar?: string;
  client_id: number;
  client_message?: string;
  created_at: string;
}

interface WorkingHours {
  day: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const ExpertDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('calendar');
  const [showLocalTime, setShowLocalTime] = useState(false);
  const [userCity, setUserCity] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [incomingBookings, setIncomingBookings] = useState<IncomingBooking[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Проверяем, является ли пользователь экспертом
    if (!user || (user.userType !== 'expert' && user.userType !== 'admin')) {
      navigate('/profile');
      return;
    }

    // Загружаем данные в зависимости от активной вкладки
    if (activeTab === 'clients') {
      loadClients();
    } else if (activeTab === 'bookings') {
      loadIncomingBookings();
    } else if (activeTab === 'administration') {
      loadWorkingHours();
    }

    // Загружаем информацию о городе пользователя
    if (user.city) {
      setUserCity(user.city);
    }
  }, [user, navigate, activeTab]);

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

  const loadIncomingBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings/incoming');
      setIncomingBookings(response.data);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkingHours = async () => {
    setLoading(true);
    try {
      const response = await api.get('/experts/working-hours');
      setWorkingHours(response.data);
    } catch (error) {
      console.error('Ошибка загрузки рабочих часов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: number, action: 'confirm' | 'reject', rejectionReason?: string) => {
    try {
      await api.put(`/bookings/${bookingId}/${action}`, { rejectionReason });
      loadIncomingBookings();
    } catch (error) {
      console.error(`Ошибка ${action === 'confirm' ? 'подтверждения' : 'отклонения'} заявки:`, error);
    }
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
      key: 'administration',
      label: (
        <span>
          <SettingOutlined /> Администрирование
        </span>
      ),
      children: (
        <div>
          <Title level={3}>Рабочие часы</Title>
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
          <div style={{ marginTop: 24 }}>
            {loading ? (
              <Text>Загрузка...</Text>
            ) : workingHours.length > 0 ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {workingHours.map((wh, index) => (
                  <Card key={index} size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>{wh.day}</Text>
                        <br />
                        <Text type="secondary">
                          {wh.start_time} - {wh.end_time} {!showLocalTime && 'МСК'}
                        </Text>
                      </div>
                      <Text type={wh.is_active ? 'success' : 'secondary'}>
                        {wh.is_active ? 'Активно' : 'Неактивно'}
                      </Text>
                    </div>
                  </Card>
                ))}
              </Space>
            ) : (
              <Text type="secondary">Рабочие часы не настроены</Text>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'clients',
      label: (
        <span>
          <TeamOutlined /> Мои клиенты
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
                    <div style={{ flex: 1 }}>
                      <Title level={5} style={{ margin: 0 }}>{client.name}</Title>
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
    },
    {
      key: 'bookings',
      label: (
        <span>
          <InboxOutlined /> Мои заявки
        </span>
      ),
      children: (
        <div>
          <Title level={3}>Входящие заявки</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Заявки от пользователей на консультации
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
          ) : incomingBookings.length > 0 ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {incomingBookings.map((booking) => (
                <Card key={booking.id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <img 
                      src={booking.client_avatar || '/emp.jpg'} 
                      alt={booking.client_name}
                      style={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%', 
                        objectFit: 'cover' 
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <Title level={5} style={{ margin: 0 }}>{booking.client_name}</Title>
                      <Text type="secondary">{booking.client_email}</Text>
                      <br />
                      <Text strong>
                        {formatDateTime(booking.date, booking.time_slot)}
                      </Text>
                      {booking.client_message && (
                        <>
                          <br />
                          <Text style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                            Сообщение: {booking.client_message}
                          </Text>
                        </>
                      )}
                      <div style={{ marginTop: 12 }}>
                        <Space>
                          <Button 
                            type="primary" 
                            onClick={() => handleBookingAction(booking.id, 'confirm')}
                          >
                            Подтвердить
                          </Button>
                          <Button 
                            danger
                            onClick={() => {
                              const reason = prompt('Укажите причину отклонения (необязательно):');
                              handleBookingAction(booking.id, 'reject', reason || undefined);
                            }}
                          >
                            Отклонить
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          ) : (
            <Card>
              <Text type="secondary">У вас пока нет новых заявок</Text>
            </Card>
          )}
        </div>
      )
    }
  ];

  if (!user || (user.userType !== 'expert' && user.userType !== 'admin')) {
    return null;
  }

  return (
    <div className="container" style={{ padding: '24px' }}>
      <Card>
        <Title level={2} style={{ marginBottom: 24 }}>
          Кабинет эксперта
        </Title>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default ExpertDashboardPage;
