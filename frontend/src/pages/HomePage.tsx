import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tabs, Typography, Space, Tag, Avatar, Spin, Button, Input, AutoComplete, List } from 'antd';
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

interface SearchArticle {
  id: number;
  title: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  views: number;
  likes_count: number;
}

const HomePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<'new' | 'popular'>('new');
  const [expertsCount, setExpertsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchArticle[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
    fetchExpertsCount();
  }, [sortType]);

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

  const searchArticles = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/articles/search?search=${encodeURIComponent(query.trim())}`);
      setSearchResults(response.data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Ошибка поиска статей:', error);
      setSearchResults([]);
      setShowDropdown(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Очищаем предыдущий таймаут
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Устанавливаем новый таймаут для поиска
    searchTimeoutRef.current = setTimeout(() => {
      searchArticles(value);
    }, 300); // Поиск через 300мс после остановки ввода
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
        <div className="home-search-container" style={{ position: 'relative' }}>
          <AutoComplete
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={searchArticles}
            onBlur={() => {
              // Закрываем выпадающий список через небольшую задержку
              setTimeout(() => setShowDropdown(false), 200);
            }}
            onFocus={() => {
              if (searchQuery.trim() && searchResults.length > 0) {
                setShowDropdown(true);
              }
            }}
            options={[]}
            style={{ width: '100%' }}
            dropdownStyle={{ display: 'none' }} // Скрываем стандартный dropdown
          >
            <Input
              placeholder="Поиск статей по заголовку..."
              prefix={<SearchOutlined style={{ color: 'rgba(43, 43, 43, 0.6)' }} />}
              suffix={searchLoading ? <Spin size="small" /> : null}
              className="home-search-input"
            />
          </AutoComplete>
          
          {/* Кастомный выпадающий список */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {searchResults.length > 0 ? (
                <List
                  dataSource={searchResults}
                  renderItem={(article) => (
                    <List.Item
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                      onClick={() => {
                        navigate(`/articles/${article.id}`);
                        setShowDropdown(false);
                        setSearchQuery('');
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            src={article.author_avatar} 
                            icon={!article.author_avatar && <UserOutlined />}
                            size="large"
                          />
                        }
                        title={
                          <div style={{ fontWeight: 500, color: '#1d1d1f' }}>
                            {article.title}
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>
                              👤 {article.author_name}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#86868b' }}>
                              <span>👁️ {article.views}</span>
                              <span>❤️ {article.likes_count}</span>
                              <span>📅 {dayjs(article.created_at).format('DD.MM.YYYY')}</span>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : searchQuery.trim() && !searchLoading ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#86868b'
                }}>
                  Статьи не найдены
                </div>
              ) : null}
            </div>
          )}
          
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
                  <img src="/new.png" alt="Новые" style={{ width: 40, height: 40 }} />
                  Новые статьи
                </span>
              )
            },
            { 
              key: 'popular', 
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/pop.png" alt="Популярные" style={{ width: 40, height: 40 }} />
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
              background: 'linear-gradient(135deg, rgb(183 196 255) 0%, rgb(239 232 255) 100%)',
              border: 'none',
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
