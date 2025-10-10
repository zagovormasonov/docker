import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Space, Tag, Button, Spin, Divider, Avatar, Image, message
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, DollarOutlined, LinkOutlined,
  EditOutlined, GlobalOutlined, HomeOutlined, UserOutlined, StarOutlined, StarFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import EventMap from '../components/EventMap';
import SimpleEventMap from '../components/SimpleEventMap';

const { Title, Text, Paragraph } = Typography;

interface Event {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  event_type: string;
  is_online: boolean;
  city_id: number;
  city_name: string;
  event_date: string;
  location: string;
  price: string;
  registration_link: string;
  organizer_id: number;
  organizer_name: string;
  organizer_avatar: string;
  organizer_bio: string;
  created_at: string;
}

const EventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [useSimpleMap, setUseSimpleMap] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchFavoriteStatus();
  }, [id]);

  const fetchFavoriteStatus = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/event-interactions/${id}/status`);
      setIsFavorited(response.data.favorited);
    } catch (error) {
      console.error('Ошибка загрузки статуса избранного:', error);
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки события:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Ретрит': 'purple',
      'Мастер-класс': 'blue',
      'Тренинг': 'cyan',
      'Семинар': 'green',
      'Сатсанг': 'gold',
      'Йога и медитация': 'magenta',
      'Фестиваль': 'volcano',
      'Конференция': 'orange',
      'Выставка': 'geekblue',
      'Концерт': 'red',
      'Экскурсия': 'lime',
      'Благотворительное мероприятие': 'pink'
    };
    return colors[type] || 'default';
  };

  const isEventToday = (eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs(), 'day');
  };

  const isEventTomorrow = (eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs().add(1, 'day'), 'day');
  };

  const toggleFavorite = async () => {
    if (!user) {
      message.warning('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    if (!id) return;

    try {
      const response = await api.post(`/event-interactions/${id}/favorite`);
      setIsFavorited(response.data.favorited);
      message.success(response.data.favorited ? 'Событие добавлено в избранное' : 'Событие удалено из избранного');
    } catch (error) {
      console.error('Ошибка изменения избранного:', error);
      message.error('Ошибка изменения избранного');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return <div>Событие не найдено</div>;
  }

  const canEdit = user?.id === event.organizer_id;

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <Card>
        {/* Обложка */}
        {event.cover_image && (
          <div style={{ marginBottom: 24 }}>
            <Image
              src={event.cover_image}
              alt={event.title}
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }}
            />
          </div>
        )}

        {/* Заголовок и действия */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <Space wrap style={{ marginBottom: 8 }}>
              <Tag color={getEventTypeColor(event.event_type)} style={{ fontSize: 14 }}>
                {event.event_type}
              </Tag>
              {isEventToday(event.event_date) && (
                <Tag color="red" style={{ fontSize: 14 }}>Сегодня</Tag>
              )}
              {isEventTomorrow(event.event_date) && (
                <Tag color="orange" style={{ fontSize: 14 }}>Завтра</Tag>
              )}
            </Space>
            <Title level={2} style={{ marginBottom: 0 }}>{event.title}</Title>
          </div>
          <Space>
            {!canEdit && (
              <Button
                icon={isFavorited ? <StarFilled /> : <StarOutlined />}
                onClick={toggleFavorite}
                style={{
                  color: isFavorited ? '#faad14' : '#8c8c8c',
                  borderColor: isFavorited ? '#faad14' : '#d9d9d9'
                }}
              >
                {isFavorited ? 'В избранном' : 'Добавить в избранное'}
              </Button>
            )}
            {canEdit && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/events/edit/${event.id}`)}
              >
                Редактировать
              </Button>
            )}
          </Space>
        </div>

        <Divider />

        {/* Основная информация */}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Space size={8} style={{ fontSize: 16 }}>
              <CalendarOutlined style={{ color: '#6366f1', fontSize: 20 }} />
              <Text strong style={{ fontSize: 16 }}>
                {dayjs(event.event_date).format('DD MMMM YYYY, HH:mm')}
              </Text>
            </Space>
          </div>

          <div>
            <Space size={8} style={{ fontSize: 16 }}>
              {event.is_online ? (
                <>
                  <GlobalOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                  <Text strong style={{ fontSize: 16 }}>Онлайн</Text>
                </>
              ) : (
                <>
                  <HomeOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                  <Text strong style={{ fontSize: 16 }}>{event.city_name}</Text>
                </>
              )}
            </Space>
          </div>

          {event.location && (
            <div>
              <Space size={8} style={{ marginBottom: 16 }}>
                <EnvironmentOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                <Text style={{ fontSize: 16 }}>{event.location}</Text>
              </Space>
              {/* Карта для офлайн событий */}
              {!event.is_online && event.location && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Title level={5} style={{ margin: 0 }}>Местоположение на карте</Title>
                    <button
                      onClick={() => setUseSimpleMap(!useSimpleMap)}
                      style={{
                        background: 'none',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 12,
                        cursor: 'pointer',
                        color: '#666'
                      }}
                    >
                      {useSimpleMap ? 'Интерактивная карта' : 'Простая карта'}
                    </button>
                  </div>
                  {useSimpleMap ? (
                    <SimpleEventMap 
                      location={event.location}
                      cityName={event.city_name}
                      eventTitle={event.title}
                    />
                  ) : (
                    <EventMap 
                      location={event.location}
                      cityName={event.city_name}
                      eventTitle={event.title}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {event.price && (
            <div>
              <Space size={8}>
                <DollarOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                <Text strong style={{ fontSize: 16, color: '#6366f1' }}>
                  {event.price}
                </Text>
              </Space>
            </div>
          )}
        </Space>

        <Divider />

        {/* Описание */}
        {event.description && (
          <>
            <Title level={4}>Описание</Title>
            <Paragraph style={{ fontSize: 16, whiteSpace: 'pre-wrap' }}>
              {event.description}
            </Paragraph>
            <Divider />
          </>
        )}

        {/* Регистрация */}
        {event.registration_link && (
          <>
            <div style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button
                type="primary"
                size="large"
                icon={<LinkOutlined />}
                href={event.registration_link}
                target="_blank"
                style={{ height: 50, fontSize: 16 }}
              >
                Зарегистрироваться на событие
              </Button>
            </div>
            <Divider />
          </>
        )}

        {/* Организатор */}
        <Title level={4}>Организатор</Title>
        <Card
          hoverable
          onClick={() => navigate(`/experts/${event.organizer_id}`)}
          style={{ cursor: 'pointer' }}
        >
          <Space size={16}>
            <Avatar
              size={64}
              src={event.organizer_avatar}
              icon={<UserOutlined />}
            />
            <div>
              <Title level={5} style={{ margin: 0 }}>{event.organizer_name}</Title>
              {event.organizer_bio && (
                <Text type="secondary">{event.organizer_bio}</Text>
              )}
            </div>
          </Space>
        </Card>
      </Card>
    </div>
  );
};

export default EventPage;

