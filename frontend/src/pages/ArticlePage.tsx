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
import { UserOutlined, EyeOutlined, ClockCircleOutlined, EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
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
  created_at: string;
  updated_at: string;
}

const ArticlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      setArticle(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки статьи:', error);
      message.error(error.response?.data?.error || 'Ошибка загрузки статьи');
      navigate('/');
    } finally {
      setLoading(false);
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
          
          {isAuthor && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/edit-article/${article.id}`)}
            >
              Редактировать
            </Button>
          )}
        </div>

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
