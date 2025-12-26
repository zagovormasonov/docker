import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tabs, Typography, Space, Tag, Spin, Button, Input } from 'antd';
import { EyeOutlined, ClockCircleOutlined, UserOutlined, HeartOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Gem, ClockPlus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import AnimatedText from '../components/AnimatedText';
import LazyImage from '../components/LazyImage';
import LazyAvatar from '../components/LazyAvatar';
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

// Оптимизированная функция для удаления HTML тегов
const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Массив надписей для анимации (вынесен из компонента)
const animatedTexts = [
  "Развивайся. Соединяйся. Сияй.",
  "Ваша духовная эволюция",
  "Ваш личный источник Света",
  "Эволюция души",
  "Ваша духовная трансформация",
  "Синергия в единстве",
  "Путь к себе"
];

const HomePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<'new' | 'popular'>('new');
  const [expertsCount, setExpertsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const searchTimeoutRef = useRef<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Мемоизированная функция загрузки статей
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/articles?sort=${sortType}`);
      const articlesData = response.data || [];
      setArticles(articlesData);
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [sortType]);

  // Мемоизированная функция загрузки количества экспертов
  const fetchExpertsCount = useCallback(async () => {
    try {
      const response = await api.get('/experts/count');
      setExpertsCount(response.data.count || 0);
    } catch (error) {
      console.error('Ошибка загрузки количества экспертов:', error);
      setExpertsCount(0);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchExpertsCount();
  }, [fetchArticles, fetchExpertsCount]);

  // Debounce для поискового запроса (500ms)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Мемоизированная фильтрация статей
  const filteredArticles = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return articles;
    }
    
    const searchLower = debouncedSearchQuery.toLowerCase();
    return articles.filter(article => {
      return article.title.toLowerCase().includes(searchLower) ||
             (article.content && article.content.toLowerCase().includes(searchLower));
    });
  }, [debouncedSearchQuery, articles]);

  // Мемоизированный обработчик изменения поиска
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

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
        <AnimatedText 
          texts={animatedTexts}
          interval={20000}
          style={{ 
            color: 'rgba(43, 43, 43, 0.9)', 
            fontWeight: 400,
            marginBottom: 16
          }}
        />
        {/* {expertsCount > 0 && (
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
        )} */}
        
        {/* Поисковая строка */}
        <div className="home-search-container">
          <Input
            placeholder="Поиск статей по заголовку и содержимому..."
            prefix={<SearchOutlined style={{ color: 'rgba(43, 43, 43, 0.6)' }} />}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="home-search-input"
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
                  <ClockPlus size={24} color="#6366f1" />
                  Новые статьи
                </span>
              )
            },
            { 
              key: 'popular', 
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gem size={24} color="#6366f1" />
                  Популярные
                </span>
              )
            }
          ]}
          style={{ marginBottom: 0 }}
        />
        
        {/* Кнопка создания статьи для экспертов */}
        {(user?.userType === 'expert' || user?.userType === 'admin') && (
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate('/create-article')}
            style={{
              height: 40,
              borderRadius: 22,
              background: 'transparent',
              border: '1px solid #9caaf3',
              color: '#6366f1',
              fontWeight: 400,
              flexShrink: 0
            }}
            className="home-create-article-btn"
          >
            Создать статью
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Text type="secondary">
            {searchQuery.trim() ? 'Статьи не найдены по вашему запросу' : 'Статьи не найдены'}
          </Text>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {filteredArticles.map((article) => (
            <Col xs={24} sm={12} lg={8} key={article.id}>
              <Card
                hoverable
                cover={
                  <LazyImage
                    src={article.cover_image || '/art.jpg'}
                    alt={article.title}
                    height={200}
                    style={{ cursor: 'pointer' }}
                  />
                }
                onClick={() => navigate(`/articles/${article.id}`)}
                style={{ height: '100%' }}
              >
                <Meta
                  title={
                    <Title level={4} ellipsis={{ rows: 1 }} style={{ marginBottom: 12 }}>
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
                          <LazyAvatar 
                            size="small" 
                            src={article.author_avatar}
                            defaultSrc="/emp.jpg"
                            icon={<UserOutlined />}
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
