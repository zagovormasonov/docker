import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Space,
  Avatar,
  Divider,
  Spin,
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
  StarFilled,
  ShareAltOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import './ArticlePage.css';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchArticle();
    if (user) {
      fetchInteractionStatus();
    }
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id, user]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      setArticle(response.data);
      setLikesCount(response.data.likes_count || 0);
      // Обновляем заголовок и базовые мета-теги
      try {
        document.title = `${response.data.title} — SoulSynergy`;
        const setTag = (name: string, content: string) => {
          if (!content) return;
          let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
          if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('name', name);
            document.head.appendChild(tag);
          }
          tag.setAttribute('content', content);
        };
        const setOg = (property: string, content: string) => {
          if (!content) return;
          let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
          if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
          }
          tag.setAttribute('content', content);
        };
        const text = (() => {
          const tmp = document.createElement('div');
          tmp.innerHTML = response.data.content || '';
          const str = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
          return str.slice(0, 180);
        })();
        const cover = response.data.cover_image || '/art.jpg';
        const pageUrl = `${window.location.origin}/articles/${response.data.id}`;
        setTag('description', text);
        setOg('og:title', response.data.title);
        setOg('og:description', text);
        setOg('og:image', cover);
        setOg('og:url', pageUrl);
        setOg('og:type', 'article');
        setOg('twitter:card', 'summary_large_image');
      } catch {}
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

  const handleShare = async () => {
    if (!article) return;
    const shareUrl = `${window.location.origin}/share/articles/${article.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success('Ссылка скопирована в буфер');
    } catch (e) {
      message.error('Не удалось скопировать ссылку');
    }
  };

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
        <div style={{ marginBottom: 24, borderRadius: 8, overflow: 'hidden' }}>
          <img
            src={article.cover_image || '/art.jpg'}
            alt={article.title}
            style={{
              width: '100%',
              height: 400,
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title level={1} style={{ margin: 0, marginBottom: 16 }}>
            {article.title}
          </Title>
          
          {isAuthor && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/edit-article/${article.id}`)}
              style={{ marginBottom: 16 }}
            >
              Редактировать
            </Button>
          )}
        </div>

        <Space size="middle" style={{ marginBottom: 24, width: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
          <Button
            size="large"
            icon={liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={handleLike}
            block={isMobile}
            style={{ borderRadius: 999, fontSize: isMobile ? 14 : undefined }}
          >
            {likesCount}
          </Button>
          <Button
            size="large"
            icon={favorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={handleFavorite}
            block={isMobile}
            style={{ borderRadius: 999, fontSize: isMobile ? 14 : undefined }}
          >
            {favorited ? 'В избранном' : 'В избранное'}
          </Button>
          <Button
            size="large"
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            block={isMobile}
            style={{ borderRadius: 999, fontSize: isMobile ? 14 : undefined }}
          >
            Поделиться
          </Button>
        </Space>

        <Tooltip title="Перейти в профиль автора">
          <div
            style={{ 
              marginBottom: 24, 
              cursor: 'pointer',
              padding: '12px',
              borderRadius: 8,
              transition: 'all 0.3s',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={() => navigate(`/experts/${article.author_id}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                src={article.author_avatar || '/emp.jpg'}
                icon={!article.author_avatar && <UserOutlined />}
                size={56}
              />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {article.author_name}
                </Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  Автор
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
            </div>
          </div>
        </Tooltip>

        <Divider />

        <div
          className="article-content"
          style={{ 
            fontSize: 16, 
            lineHeight: 1.8,
            color: '#1d1d1f',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%'
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <Divider />

        {/* Лайки и избранное в конце статьи */}
        <div style={{ 
          textAlign: 'center', 
          padding: '24px 0',
          background: '#fafafa',
          borderRadius: 8,
          marginTop: 24
        }}>
          <Text strong style={{ fontSize: 16, marginBottom: 16, display: 'block' }}>
            Понравилась статья? Поделитесь своими эмоциями!
          </Text>
          <Space size="large" style={{ width: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
            <Button
              size="large"
              icon={liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
              onClick={handleLike}
              style={{ 
                height: 48,
                padding: '0 24px',
                fontSize: isMobile ? 14 : 16,
                fontWeight: 500,
                borderRadius: 999
              }}
              block={isMobile}
            >
              Лайк ({likesCount})
            </Button>
            <Button
              size="large"
              icon={favorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={handleFavorite}
              style={{ 
                height: 48,
                padding: '0 24px',
                fontSize: isMobile ? 14 : 16,
                fontWeight: 500,
                borderRadius: 999
              }}
              block={isMobile}
            >
              {favorited ? 'В избранном' : 'В избранное'}
            </Button>
            <Button
              size="large"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              style={{ 
                height: 48,
                padding: '0 24px',
                fontSize: isMobile ? 14 : 16,
                fontWeight: 500,
                borderRadius: 999
              }}
              block={isMobile}
            >
              Поделиться
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ArticlePage;
