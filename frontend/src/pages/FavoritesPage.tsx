import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Space, Avatar, Spin, Empty, Tabs } from 'antd';
import { EyeOutlined, ClockCircleOutlined, UserOutlined, HeartOutlined, StarOutlined, CalendarOutlined } from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

interface Article {
  id: number;
  title: string;
  content: string;
  cover_image?: string;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  views: number;
  likes_count: number;
  created_at: string;
}

interface Expert {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  topics: string[];
  favorited_at: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  cover_image?: string;
  event_type: string;
  is_online: boolean;
  event_date: string;
  location?: string;
  price?: number;
  registration_link?: string;
  organizer_name: string;
  organizer_avatar?: string;
  city_name?: string;
  favorited_at: string;
}

const FavoritesPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('articles');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllFavorites();
  }, []);

  const fetchAllFavorites = async () => {
    setLoading(true);
    try {
      const [articlesRes, expertsRes, eventsRes] = await Promise.all([
        api.get('/article-interactions/favorites'),
        api.get('/expert-interactions/favorites'),
        api.get('/event-interactions/favorites')
      ]);
      
      setArticles(articlesRes.data || []);
      setExperts(expertsRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
      setArticles([]);
      setExperts([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Компонент для отображения избранных экспертов
  const renderExperts = () => (
    <Row gutter={[24, 24]}>
      {experts.map((expert) => (
        <Col xs={24} sm={12} lg={8} key={expert.id}>
          <Card
            hoverable
            onClick={() => navigate(`/experts/${expert.id}`)}
            style={{ height: '100%' }}
          >
            <Meta
              avatar={
                <Avatar 
                  size={64} 
                  src={expert.avatar_url}
                  icon={!expert.avatar_url && <UserOutlined />}
                />
              }
              title={
                <Title level={4} style={{ marginBottom: 8 }}>
                  {expert.name}
                </Title>
              }
              description={
                <>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#86868b', marginBottom: 12 }}>
                    {expert.bio || 'Описание отсутствует'}
                  </Paragraph>
                  
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {expert.city && (
                      <Text type="secondary">
                        📍 {expert.city}
                      </Text>
                    )}
                    
                    {expert.topics && expert.topics.length > 0 && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Тематики:
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          {expert.topics.slice(0, 3).map((topic, index) => (
                            <span key={index} style={{ 
                              background: '#f0f0f0', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '11px',
                              marginRight: '4px',
                              display: 'inline-block',
                              marginBottom: '2px'
                            }}>
                              {topic}
                            </span>
                          ))}
                          {expert.topics.length > 3 && (
                            <span style={{ fontSize: '11px', color: '#999' }}>
                              +{expert.topics.length - 3} еще
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ⭐ Добавлено {dayjs(expert.favorited_at).format('DD MMM YYYY')}
                    </Text>
                  </Space>
                </>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  // Компонент для отображения избранных событий
  const renderEvents = () => (
    <Row gutter={[24, 24]}>
      {events.map((event) => (
        <Col xs={24} sm={12} lg={8} key={event.id}>
          <Card
            hoverable
            cover={
              event.cover_image ? (
                <div style={{ height: 200, overflow: 'hidden' }}>
                  <img
                    src={event.cover_image}
                    alt={event.title}
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
                  📅
                </div>
              )
            }
            onClick={() => navigate(`/events/${event.id}`)}
            style={{ height: '100%' }}
          >
            <Meta
              title={
                <Title level={4} ellipsis={{ rows: 2 }} style={{ marginBottom: 12 }}>
                  {event.title}
                </Title>
              }
              description={
                <>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#86868b', marginBottom: 16 }}>
                    {stripHtml(event.description)}
                  </Paragraph>
                  
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space 
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/experts/${event.organizer_name}`);
                      }}
                    >
                      <Avatar 
                        size="small" 
                        src={event.organizer_avatar}
                        icon={!event.organizer_avatar && <UserOutlined />}
                      />
                      <Text type="secondary" style={{ transition: 'color 0.3s' }} className="author-link">
                        {event.organizer_name}
                      </Text>
                    </Space>
                    
                    <Space split="•">
                      <Space size={4}>
                        <CalendarOutlined />
                        <Text type="secondary">
                          {dayjs(event.event_date).format('DD MMM YYYY')}
                        </Text>
                      </Space>
                      <Space size={4}>
                        <Text type="secondary">
                          {event.is_online ? '🌐 Онлайн' : `📍 ${event.city_name || 'Место уточняется'}`}
                        </Text>
                      </Space>
                    </Space>
                    
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ⭐ Добавлено {dayjs(event.favorited_at).format('DD MMM YYYY')}
                    </Text>
                  </Space>
                </>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <img 
            src="/fav.png" 
            alt="Избранное" 
            style={{ width: 40, height: 40 }}
          />
          <Title level={2} className="page-title" style={{ margin: 0 }}>Избранное</Title>
        </div>
        <Text className="page-subtitle">Статьи, эксперты и события, которые вы добавили в избранное</Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'articles',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartOutlined />
                Статьи ({articles.length})
              </span>
            ),
            children: loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : articles.length === 0 ? (
              <Card>
                <Empty 
                  description="У вас пока нет избранных статей"
                  style={{ padding: 60 }}
                />
              </Card>
            ) : (
              <Row gutter={[24, 24]}>
                {articles.map((article) => (
                  <Col xs={24} sm={12} lg={8} key={article.id}>
                    <Card
                      hoverable
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
                      onClick={() => navigate(`/articles/${article.id}`)}
                      style={{ height: '100%' }}
                    >
                      <Meta
                        title={
                          <Title level={4} ellipsis={{ rows: 2 }} style={{ marginBottom: 12 }}>
                            {article.title}
                          </Title>
                        }
                        description={
                          <>
                            <Paragraph ellipsis={{ rows: 3 }} style={{ color: '#86868b', marginBottom: 16 }}>
                              {stripHtml(article.content)}
                            </Paragraph>
                            
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                              <Space 
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/experts/${article.author_id}`);
                                }}
                              >
                                <Avatar 
                                  size="small" 
                                  src={article.author_avatar}
                                  icon={!article.author_avatar && <UserOutlined />}
                                />
                                <Text type="secondary" style={{ transition: 'color 0.3s' }} className="author-link">
                                  {article.author_name}
                                </Text>
                              </Space>
                              
                              <Space split="•">
                                <Space size={4}>
                                  <HeartOutlined />
                                  <Text type="secondary">{article.likes_count || 0}</Text>
                                </Space>
                                <Space size={4}>
                                  <EyeOutlined />
                                  <Text type="secondary">{article.views}</Text>
                                </Space>
                                <Space size={4}>
                                  <ClockCircleOutlined />
                                  <Text type="secondary">
                                    {dayjs(article.created_at).format('DD MMM YYYY')}
                                  </Text>
                                </Space>
                              </Space>
                            </Space>
                          </>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )
          },
          {
            key: 'experts',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StarOutlined />
                Эксперты ({experts.length})
              </span>
            ),
            children: loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : experts.length === 0 ? (
              <Card>
                <Empty 
                  description="У вас пока нет избранных экспертов"
                  style={{ padding: 60 }}
                />
              </Card>
            ) : (
              renderExperts()
            )
          },
          {
            key: 'events',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined />
                События ({events.length})
              </span>
            ),
            children: loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : events.length === 0 ? (
              <Card>
                <Empty 
                  description="У вас пока нет избранных событий"
                  style={{ padding: 60 }}
                />
              </Card>
            ) : (
              renderEvents()
            )
          }
        ]}
      />
    </div>
  );
};

export default FavoritesPage;

