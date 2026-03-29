import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Space, Tag, Button, Spin, Divider, Avatar, message
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, LinkOutlined,
  EditOutlined, GlobalOutlined, HomeOutlined, UserOutlined, StarOutlined, StarFilled, ShareAltOutlined
} from '@ant-design/icons';
import { RussianRuble } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import EventMap from '../components/EventMap';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchFavoriteStatus();
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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


  const isEventToday = (eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs(), 'day');
  };

  const isEventTomorrow = (eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs().add(1, 'day'), 'day');
  };

  const handleShare = async () => {
    if (!event) return;
    const url = `${window.location.origin}/share/events/${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
      message.success('Ссылка скопирована в буфер');
    } catch {
      message.error('Не удалось скопировать ссылку');
    }
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
    <div className="container" style={{ padding: '24px 20px', maxWidth: 1000 }}>
      <Card style={{ borderRadius: 24, overflow: 'hidden', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: isMobile ? 24 : 40 }}>
        {/* Обложка */}
        <div style={{ marginBottom: 32, borderRadius: 16, overflow: 'hidden' }}>
          <img
            src={event.cover_image || '/eve.jpg'}
            alt={event.title}
            style={{
              width: '100%',
              height: isMobile ? 240 : 400,
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </div>

        {/* Заголовок и действия */}
        <div
          style={{
            display: 'flex',
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            marginBottom: 24,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 16 : 0
          }}
        >
          <div style={{ flex: 1, paddingRight: isMobile ? 0 : 24 }}>
            <Space wrap style={{ marginBottom: 12 }}>
              <Tag style={{ 
                borderRadius: 12, border: 'none', background: '#f5f5f7', color: '#6366f1', fontSize: 13, padding: '4px 12px' 
              }}>
                {event.event_type}
              </Tag>
              {isEventToday(event.event_date) && (
                <Tag style={{ borderRadius: 12, border: 'none', background: '#fff1f0', color: '#ff4d4f', fontSize: 13, padding: '4px 12px' }}>Сегодня</Tag>
              )}
              {isEventTomorrow(event.event_date) && (
                <Tag style={{ borderRadius: 12, border: 'none', background: '#fff7e6', color: '#fa8c16', fontSize: 13, padding: '4px 12px' }}>Завтра</Tag>
              )}
            </Space>
            <Title level={1} style={{ margin: 0, fontSize: isMobile ? 28 : 36, fontWeight: 700 }}>
              {event.title}
            </Title>
          </div>
          <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }} size={12}>
            {!canEdit && (
              <Button
                size="large"
                icon={isFavorited ? <StarFilled /> : <StarOutlined />}
                onClick={toggleFavorite}
                style={{
                  borderRadius: 24,
                  color: isFavorited ? '#faad14' : '#1d1d1f',
                  background: isFavorited ? '#fffbe6' : '#f5f5f7',
                  border: 'none',
                  boxShadow: 'none'
                }}
                block={isMobile}
              >
                {isFavorited ? 'В избранном' : 'В избранное'}
              </Button>
            )}
            <Button
              size="large"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              style={{ borderRadius: 24, background: '#f5f5f7', border: 'none', color: '#1d1d1f' }}
              block={isMobile}
            >
              Поделиться
            </Button>
            {canEdit && (
              <Button
                type="primary"
                size="large"
                icon={<EditOutlined />}
                onClick={() => navigate(`/events/edit/${event.id}`)}
                style={{ borderRadius: 24 }}
                block={isMobile}
              >
                Редактировать
              </Button>
            )}
          </Space>
        </div>

        <Divider style={{ margin: '32px 0' }} />

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
                  <Title level={5} style={{ marginBottom: 12 }}>Местоположение на карте</Title>
                  <EventMap
                    location={event.location}
                    cityName={event.city_name}
                    eventTitle={event.title}
                  />
                </div>
              )}
            </div>
          )}

          {event.price && (
            <div>
              <Space size={8}>
                <RussianRuble style={{ color: '#6366f1' }} size={20} />
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
            <div
              className="article-content"
              style={{
                fontSize: 16,
                lineHeight: 1.8,
                color: '#1d1d1f'
              }}
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
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
        <Title level={4} style={{ marginBottom: 16 }}>Организатор</Title>
        <Card
          hoverable
          onClick={() => navigate(`/experts/${event.organizer_id}`)}
          style={{ cursor: 'pointer', borderRadius: 20, background: '#f9f9f9', border: 'none' }}
          bodyStyle={{ padding: 20 }}
        >
          <Space size={20} align="center">
            <Avatar
              size={64}
              src={event.organizer_avatar}
              icon={<UserOutlined />}
            />
            <div>
              <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 18 }}>{event.organizer_name}</Title>
              {event.organizer_bio && (
                <Text type="secondary" style={{ fontSize: 14, color: '#86868b' }}>{event.organizer_bio}</Text>
              )}
            </div>
          </Space>
        </Card>
      </Card>
    </div>
  );
};

export default EventPage;

