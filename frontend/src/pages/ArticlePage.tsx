import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Space,
  Avatar,
  Divider,
  Spin,
  Image,
  message,
  Button,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  EyeOutlined, 
  ClockCircleOutlined, 
  EditOutlined, 
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const { Title, Text, Paragraph } = Typography;

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
  updated_at: string;
}

const ArticlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchArticle();
    if (user) {
      fetchInteractionStatus();
    }
  }, [id, user]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      setArticle(response.data);
      setLikesCount(response.data.likes_count || 0);
    } catch (error: any) {
      console.error('Ошибка загрузки статьи:', error);
      message.error(error.response?.data?.error || 'Ошибка загрузки статьи');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractionStatus = async () => {
    try {
      const response = await api.get(`/article-interactions/${id}/status`);
      setLiked(response.data.liked);
      setFavorited(response.data.favorited);
    } catch (error) {
      console.error('Ошибка загрузки статуса:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      message.info('Войдите чтобы лайкать статьи');
      return;
    }

    try {
      const response = await api.post(`/article-interactions/${id}/like`);
      setLiked(response.data.liked);
      setLikesCount(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Ошибка лайка:', error);
      message.error('Ошибка');
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      message.info('Войдите чтобы добавлять в избранное');
      return;
    }

    try {
      const response = await api.post(`/article-interactions/${id}/favorite`);
      setFavorited(response.data.favorited);
      message.success(response.data.favorited ? 'Добавлено в избранное!' : 'Удалено из избранного');
    } catch (error) {
      console.error('Ошибка избранного:', error);
      message.error('Ошибка');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!article) {
    return <div className="container">Статья не найдена</div>;
  }

  const isAuthor = user?.id === article.author_id;

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          Назад
        </Button>
      </div>

      <Card>
        {article.cover_image && (
          <Image
            src={article.cover_image}
            alt={article.title}
            style={{
              width: '100%',
              maxHeight: 400,
              objectFit: 'cover',
              borderRadius: 8,
              marginBottom: 24
            }}
            preview={true}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <Title level={1} style={{ margin: 0, flex: 1 }}>
            {article.title}
          </Title>
          
          <Space>
            {isAuthor && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/edit-article/${article.id}`)}
              >
                Редактировать
              </Button>
            )}
          </Space>
        </div>

        <Space size="middle" style={{ marginBottom: 24 }}>
          <Button
            size="large"
            icon={liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={handleLike}
          >
            {likesCount}
          </Button>
          <Button
            size="large"
            icon={favorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={handleFavorite}
          >
            {favorited ? 'В избранном' : 'В избранное'}
          </Button>
        </Space>

        <Tooltip title="Перейти в профиль автора">
          <Space
            style={{ 
              marginBottom: 24, 
              cursor: 'pointer',
              padding: '12px',
              borderRadius: 8,
              transition: 'all 0.3s',
              display: 'inline-flex'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={() => navigate(`/experts/${article.author_id}`)}
          >
            <Avatar
              src={article.author_avatar}
              icon={!article.author_avatar && <UserOutlined />}
              size={56}
            />
            <div>
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {article.author_name}
                </Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  Автор
                </Text>
              </div>
              <Space size={4} split="•" style={{ marginTop: 4 }}>
                <Space size={4}>
                  <ClockCircleOutlined />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {dayjs(article.created_at).format('DD MMMM YYYY')}
                  </Text>
                </Space>
                <Space size={4}>
                  <EyeOutlined />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {article.views} просмотров
                  </Text>
                </Space>
              </Space>
            </div>
          </Space>
        </Tooltip>

        <Divider />

        <div
          className="article-content"
          style={{ 
            fontSize: 16, 
            lineHeight: 1.8,
            color: '#1d1d1f'
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </Card>
    </div>
  );
};

export default ArticlePage;
