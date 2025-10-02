import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tabs, Typography, Image, Space, Tag, Avatar, Spin } from 'antd';
import { EyeOutlined, ClockCircleOutlined, UserOutlined, HeartOutlined } from '@ant-design/icons';
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

const HomePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<'new' | 'popular'>('new');
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
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
        <Paragraph style={{ color: 'rgba(43, 43, 43, 0.9)', fontSize: 16, maxWidth: 600, margin: '16px auto' }}>
          Найдите своего эксперта, погрузитесь в мир духовных практик и начните путь к гармонии
        </Paragraph>
      </div>

      <Tabs
        activeKey={sortType}
        onChange={(key) => setSortType(key as 'new' | 'popular')}
        items={[
          { key: 'new', label: '🆕 Новые статьи' },
          { key: 'popular', label: '🔥 Популярные' }
        ]}
        style={{ marginBottom: 24 }}
      />

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
                      <Image
                        alt={article.title}
                        src={article.cover_image}
                        preview={false}
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
