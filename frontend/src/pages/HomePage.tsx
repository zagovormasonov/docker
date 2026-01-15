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
    <div style={{ minHeight: '100vh', background: '#f8fafc', margin: '-24px -24px 0', paddingBottom: 24, overflowX: 'hidden' }}>
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)',
        padding: '100px 24px 120px',
        borderRadius: '0 0 48px 48px',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <Text style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '2px',
            color: '#6366f1',
            textTransform: 'uppercase',
            marginBottom: 16
          }}>
            Платформа для развития
          </Text>

          <h1 style={{
            fontSize: 'clamp(3rem, 5vw, 4.5rem)',
            fontWeight: 400,
            lineHeight: 1.3,
            margin: '0 0 24px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
            paddingBottom: '0.1em' /* Prevent clipping of descenders with gradient text */
          }}>
            SoulSynergy
          </h1>

          <div style={{ height: 40, marginBottom: 48, display: 'flex', justifyContent: 'center' }}>
            <AnimatedText
              texts={animatedTexts}
              interval={4000}
              style={{
                fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
                color: '#4b5563',
                fontWeight: 500
              }}
            />
          </div>

          <div style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: 24,
            padding: '8px 8px 8px 24px',
            boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            maxWidth: 600,
            margin: '0 auto',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(99, 102, 241, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(99, 102, 241, 0.15)';
            }}
          >
            <SearchOutlined style={{ fontSize: 22, color: '#818cf8' }} />
            <input
              placeholder="Найти статьи, авторов, вдохновение..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                width: '100%',
                padding: '12px 16px',
                fontSize: 16,
                outline: 'none',
                color: '#1f2937'
              }}
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: -40, position: 'relative', zIndex: 2, paddingBottom: 60 }}>
        {/* Unified Toolbar */}
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '8px 12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32
        }}>
          <Tabs
            activeKey={sortType}
            onChange={(key) => setSortType(key as 'new' | 'popular')}
            items={[
              {
                key: 'new',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 15, fontWeight: 500 }}>
                    <ClockPlus size={18} />
                    <span>Новое</span>
                  </span>
                )
              },
              {
                key: 'popular',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 15, fontWeight: 500 }}>
                    <Gem size={18} />
                    <span>Популярное</span>
                  </span>
                )
              }
            ]}
            style={{
              marginBottom: 0,
              flex: 1
            }}
            tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }}
          />

          {(user?.userType === 'expert' || user?.userType === 'admin') && (
            <Button
              type="primary"
              icon={<EditOutlined className="writing-icon" />}
              onClick={() => navigate('/create-article')}
              size="large"
              style={{
                borderRadius: 16,
                background: '#6366f1',
                border: 'none',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                height: 40,
                padding: '0 20px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Создать статью
            </Button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <Title level={4} style={{ marginBottom: 8 }}>Ничего не найдено</Title>
            <Text type="secondary">
              {searchQuery.trim()
                ? 'Попробуйте изменить поисковый запрос'
                : 'Статей пока нет. Будьте первыми!'}
            </Text>
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredArticles.map((article) => (
              <Col xs={24} sm={12} lg={8} key={article.id}>
                <div
                  style={{
                    height: '100%',
                    background: 'white',
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.01)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.01)';
                  }}
                  onClick={() => navigate(`/articles/${article.id}`)}
                >
                  <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transition: 'transform 0.5s ease'
                    }}
                      className="card-image-wrapper"
                    >
                      <LazyImage
                        src={article.cover_image || '/art.jpg'}
                        alt={article.title}
                        height="100%"
                        style={{ width: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'rgba(255, 255, 255, 0.9)',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#4b5563',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {dayjs(article.created_at).format('DD MMM')}
                    </div>
                  </div>

                  <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 12,
                      lineHeight: 1.4,
                      color: '#1f2937',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {article.title}
                    </h3>

                    <p style={{
                      color: '#6b7280',
                      fontSize: 14,
                      lineHeight: 1.6,
                      marginBottom: 20,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {stripHtml(article.content)}
                    </p>

                    <div style={{
                      paddingTop: 16,
                      marginTop: 'auto',
                      borderTop: '1px solid #f3f4f6',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/experts/${article.author_id}`);
                        }}
                      >
                        <LazyAvatar
                          size={32}
                          src={article.author_avatar}
                          defaultSrc="/emp.jpg"
                          icon={<UserOutlined />}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>
                          {article.author_name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 12, color: '#9ca3af', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <HeartOutlined /> {article.likes_count || 0}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <EyeOutlined /> {article.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default HomePage;
