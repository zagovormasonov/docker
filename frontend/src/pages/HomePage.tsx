import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tabs, Typography, Space, Tag, Avatar, Spin, Button, Input } from 'antd';
import { EyeOutlined, ClockCircleOutlined, UserOutlined, HeartOutlined, EditOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
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

const HomePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<'new' | 'popular'>('new');
  const [expertsCount, setExpertsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
    fetchExpertsCount();
  }, [sortType]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/articles?sort=${sortType}`);
      setArticles(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpertsCount = async () => {
    try {
      const response = await api.get('/experts/count');
      setExpertsCount(response.data.count || 0);
    } catch (error) {
      console.error('Ошибка загрузки количества экспертов:', error);
      setExpertsCount(0);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div style={{
        background: 'linear-gradient(135deg, rgb(180 194 255) 0%, rgb(245 236 255) 100%)',
        borderRadius: 16,
        padding: '60px 40px',
        marginBottom: 48,
        color: 'white',
        textAlign: 'center'
      }}>
        <Title level={1} style={{ color: 'black', marginBottom: 16, fontSize: 48 }}>
          SoulSynergy
        </Title>
        <Title level={3} style={{ color: 'rgba(43, 43, 43, 0.9)', fontWeight: 400 }}>
          Платформа для духовных мастеров
        </Title>
        {expertsCount > 0 && (
          <Paragraph style={{ 
            color: 'rgba(43, 43, 43, 0.8)', 
            fontSize: 18, 
            fontWeight: 500,
            margin: '8px auto 16px',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            Нас уже более {expertsCount} экспертов
          </Paragraph>
        )}
        
        {/* Поисковая строка */}
        <div className="home-search-container">
          <Input
            placeholder="Поиск экспертов по имени или специализации..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={() => {
              if (searchQuery.trim()) {
                navigate(`/experts?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            prefix={<SearchOutlined style={{ color: 'rgba(43, 43, 43, 0.6)' }} />}
            className="home-search-input"
          />
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={() => navigate('/experts')}
            className="home-filter-button"
          />
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Tabs
          activeKey={sortType}
          onChange={(key) => setSortType(key as 'new' | 'popular')}
          items={[
            { 
              key: 'new', 
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/new.png" alt="Новые" style={{ width: 16, height: 16 }} />
                  Новые статьи
                </span>
              )
            },
            { 
              key: 'popular', 
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/fire.png" alt="Популярные" style={{ width: 16, height: 16 }} />
                  Популярные
                </span>
              )
            }
          ]}
          style={{ marginBottom: 0 }}
        />
        
        {/* Кнопка создания статьи для экспертов */}
        {user?.userType === 'expert' && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate('/create-article')}
            style={{
              height: 40,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              fontWeight: 500
            }}
          >
            Создать статью
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
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
      )}
    </div>
  );
};

export default HomePage;
