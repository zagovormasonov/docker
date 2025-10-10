import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Avatar,
  Typography,
  Space,
  Tag,
  Button,
  List,
  Divider,
  Spin,
  message,
  Empty
} from 'antd';
import {
  UserOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  FileTextOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import ProfileGallery from '../components/ProfileGallery';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const { Title, Text, Paragraph } = Typography;

interface Service {
  id: number;
  title: string;
  description: string;
  price?: number;
  duration?: number;
  service_type: string;
}

interface Article {
  id: number;
  title: string;
  content: string;
  cover_image?: string;
  views: number;
  likes_count: number;
  created_at: string;
}

interface ExpertProfile {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  vk_url?: string;
  telegram_url?: string;
  instagram_url?: string;
  whatsapp?: string;
  consultation_types?: string;
  topics: Array<{ id: number; name: string }>;
  services: Service[];
  created_at: string;
}

const ExpertProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    fetchExpert();
    fetchArticles();
    fetchFavoriteStatus();
  }, [id]);

  const fetchFavoriteStatus = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/expert-interactions/${id}/status`);
      setIsFavorited(response.data.favorited);
    } catch (error) {
      console.error('Ошибка загрузки статуса избранного:', error);
    }
  };

  const fetchExpert = async () => {
    try {
      const response = await api.get(`/experts/${id}`);
      setExpert(response.data);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      message.error('Ошибка загрузки профиля эксперта');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const response = await api.get(`/articles/author/${id}`);
      setArticles(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
    } finally {
      setLoadingArticles(false);
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleContactExpert = async () => {
    if (!user) {
      message.warning('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    // Проверяем, что пользователь не пытается создать чат с самим собой
    if (user.id === expert?.id) {
      message.warning('Нельзя создать чат с самим собой');
      return;
    }

    try {
      const response = await api.post('/chats/create', { otherUserId: expert?.id });
      navigate(`/chats/${response.data.id}`);
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      message.error('Ошибка создания чата');
    }
  };

  const handleBuyService = async (service: Service) => {
    if (!user) {
      message.warning('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    try {
      // Создаем или находим чат с экспертом
      const response = await api.post('/chats/create', { otherUserId: expert?.id });
      const chatId = response.data.id;
      
      // Отправляем сообщение об услуге
      const serviceMessage = `🛒 Хочу заказать услугу: "${service.title}"${service.price ? ` (${service.price} ₽)` : ''}${service.duration ? `, длительность: ${service.duration} мин` : ''}. ${service.description}`;
      
      await api.post(`/chats/${chatId}/messages`, {
        content: serviceMessage
      });
      
      // Переходим в чат
      navigate(`/chats/${chatId}`);
      message.success('Сообщение об услуге отправлено в чат!');
    } catch (error) {
      console.error('Ошибка заказа услуги:', error);
      message.error('Ошибка заказа услуги');
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
      const response = await api.post(`/expert-interactions/${id}/favorite`);
      setIsFavorited(response.data.favorited);
      message.success(response.data.favorited ? 'Эксперт добавлен в избранное' : 'Эксперт удален из избранного');
    } catch (error) {
      console.error('Ошибка изменения избранного:', error);
      message.error('Ошибка изменения избранного');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!expert) {
    return <div className="container">Эксперт не найден</div>;
  }

  return (
    <div className="container">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space align="start" size="large">
            <Avatar
              size={120}
              src={expert.avatar_url}
              icon={!expert.avatar_url && <UserOutlined />}
              style={{ backgroundColor: '#6366f1' }}
            />

            <div style={{ flex: 1 }}>
              <Title level={2} style={{ marginBottom: 8 }}>{expert.name}</Title>
              
              {expert.city && (
                <Space style={{ marginBottom: 16 }}>
                  <EnvironmentOutlined />
                  <Text type="secondary">{expert.city}</Text>
                </Space>
              )}

              {expert.bio && (
                <Paragraph style={{ fontSize: 16, color: '#86868b', marginBottom: 16 }}>
                  {expert.bio}
                </Paragraph>
              )}

              {/* Показываем кнопки только если это не собственный профиль */}
              {user?.id !== expert.id && (
                <Space>
                  <Button
                    type="primary"
                    size="large"
                    icon={<MessageOutlined />}
                    onClick={handleContactExpert}
                  >
                    Связаться с экспертом
                  </Button>
                  <Button
                    size="large"
                    icon={isFavorited ? <StarFilled /> : <StarOutlined />}
                    onClick={toggleFavorite}
                    style={{
                      color: isFavorited ? '#faad14' : '#8c8c8c',
                      borderColor: isFavorited ? '#faad14' : '#d9d9d9'
                    }}
                  >
                    {isFavorited ? 'В избранном' : 'Добавить в избранное'}
                  </Button>
                </Space>
              )}
            </div>
          </Space>

          {/* Типы консультаций */}
          {expert.consultation_types && (() => {
            try {
              const types = JSON.parse(expert.consultation_types);
              if (types.length > 0) {
                return (
                  <>
                    <Divider />
                    <div>
                      <Title level={4}><InfoCircleOutlined /> Типы консультаций</Title>
                      <Space wrap>
                        {types.map((type: string, idx: number) => (
                          <Tag key={idx} color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                            {type}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </>
                );
              }
            } catch (e) {
              return null;
            }
            return null;
          })()}

          {/* Социальные сети */}
          {(expert.vk_url || expert.telegram_url || expert.instagram_url || expert.whatsapp) && (
            <>
              <Divider />
              <div>
                <Title level={4}><LinkOutlined /> Контакты и социальные сети</Title>
                <Space direction="vertical" size="small">
                  {expert.vk_url && (
                    <a href={expert.vk_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16 }}>
                      🟦 VK: {expert.vk_url}
                    </a>
                  )}
                  {expert.telegram_url && (
                    <a href={expert.telegram_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16 }}>
                      ✈️ Telegram: {expert.telegram_url}
                    </a>
                  )}
                  {expert.instagram_url && (
                    <a href={expert.instagram_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16 }}>
                      📷 Instagram: {expert.instagram_url}
                    </a>
                  )}
                  {expert.whatsapp && (
                    <Text style={{ fontSize: 16 }}>
                      <PhoneOutlined /> WhatsApp: {expert.whatsapp}
                    </Text>
                  )}
                </Space>
              </div>
            </>
          )}

          {expert.topics && expert.topics.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={4}>Тематики</Title>
                <Space wrap>
                  {expert.topics.map((topic) => (
                    <Tag key={topic.id} color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
                      {topic.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            </>
          )}

          {/* Галерея фотографий */}
          <Divider />
          <div>
            <ProfileGallery userId={expert.id} isOwner={user?.id === expert.id} />
          </div>

          {expert.services && expert.services.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={4}>Услуги</Title>
                <List
                  dataSource={expert.services}
                  renderItem={(service) => (
                    <List.Item>
                      <Card style={{ width: '100%' }} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <Title level={5}>{service.title}</Title>
                            <Paragraph type="secondary">{service.description}</Paragraph>
                            
                            <Space split="•">
                              {service.price && (
                                <Space>
                                  <DollarOutlined />
                                  <Text>{service.price} ₽</Text>
                                </Space>
                              )}
                              {service.duration && (
                                <Space>
                                  <ClockCircleOutlined />
                                  <Text>{service.duration} мин</Text>
                                </Space>
                              )}
                              <Tag color={
                                service.service_type === 'online' ? 'blue' :
                                service.service_type === 'offline' ? 'green' : 'purple'
                              }>
                                {service.service_type === 'online' ? 'Онлайн' :
                                 service.service_type === 'offline' ? 'Офлайн' : 'Онлайн/Офлайн'}
                              </Tag>
                            </Space>
                          </div>
                          
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleBuyService(service)}
                            style={{ marginLeft: 16, minWidth: 80 }}
                          >
                            Купить
                          </Button>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </div>
            </>
          )}

          {/* Статьи эксперта */}
          <Divider />
          <div>
            <Title level={4}><FileTextOutlined /> Статьи эксперта</Title>
            {loadingArticles ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : articles.length === 0 ? (
              <Empty description="Эксперт пока не опубликовал ни одной статьи" />
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
                dataSource={articles}
                renderItem={(article) => (
                  <List.Item>
                    <Card
                      hoverable
                      onClick={() => navigate(`/articles/${article.id}`)}
                      cover={
                        article.cover_image ? (
                          <div style={{ height: 200, overflow: 'hidden' }}>
                            <img
                              src={article.cover_image}
                              alt={article.title}
                              style={{ width: '100%', height: 200, objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div style={{
                            height: 200,
                            background: 'linear-gradient(135deg, rgb(180 194 255) 0%, rgb(245 236 255) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 48
                          }}>
                            ✨
                          </div>
                        )
                      }
                    >
                      <Card.Meta
                        title={
                          <div 
                            style={{ 
                              fontSize: 16, 
                              fontWeight: 600,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {article.title}
                          </div>
                        }
                        description={
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Text type="secondary" ellipsis>
                              {stripHtml(article.content).substring(0, 100)}...
                            </Text>
                            <Space split="•">
                              <Space size={4}>
                                <HeartOutlined />
                                <Text type="secondary">{article.likes_count || 0}</Text>
                              </Space>
                              <Space size={4}>
                                <EyeOutlined />
                                <Text type="secondary">{article.views}</Text>
                              </Space>
                              <Text type="secondary">
                                {dayjs(article.created_at).format('DD MMM YYYY')}
                              </Text>
                            </Space>
                          </Space>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default ExpertProfilePage;
