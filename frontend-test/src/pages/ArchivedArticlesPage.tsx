import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Space,
  Button,
  message,
  Spin,
  Empty,
  Tag,
  Tooltip
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import './ArchivedArticlesPage.css';

dayjs.locale('ru');

const { Title, Text, Paragraph } = Typography;

interface Article {
  id: number;
  title: string;
  content: string;
  cover_image?: string;
  is_published: boolean;
  archived: boolean;
  views: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  moderation_status?: string;
}

const ArchivedArticlesPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchivedArticles();
  }, []);

  const fetchArchivedArticles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/articles/my/archived');
      setArticles(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки архивированных статей:', error);
      message.error('Ошибка загрузки архивированных статей');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (id: number) => {
    try {
      await api.post(`/articles/${id}/unarchive`);
      message.success('Статья успешно разархивирована!');
      fetchArchivedArticles();
    } catch (error: any) {
      console.error('Ошибка разархивирования статьи:', error);
      message.error(error.response?.data?.error || 'Ошибка разархивирования статьи');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/articles/${id}`);
      message.success('Статья успешно удалена!');
      fetchArchivedArticles();
    } catch (error: any) {
      console.error('Ошибка удаления статьи:', error);
      message.error(error.response?.data?.error || 'Ошибка удаления статьи');
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/my-articles')}
          style={{ marginBottom: 16 }}
        >
          Назад к статьям
        </Button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <FolderOutlined style={{ fontSize: 24, color: '#8b5cf6' }} />
          <Title level={2} style={{ margin: 0, color: '#8b5cf6' }}>
            Архив статей
          </Title>
        </div>
        
        <Text type="secondary">
          Здесь хранятся ваши архивированные статьи. Они не отображаются на главной странице, но остаются доступными для редактирования.
        </Text>
      </div>

      {articles.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="В архиве пока нет статей"
          style={{ marginTop: 50 }}
        >
          <Button type="primary" onClick={() => navigate('/my-articles')}>
            Перейти к статьям
          </Button>
        </Empty>
      ) : (
        <div className="articles-grid">
          {articles.map((article) => (
            <Card
              key={article.id}
              hoverable
              className="article-card"
              cover={
                article.cover_image ? (
                  <div className="article-cover">
                    <img
                      alt={article.title}
                      src={article.cover_image}
                      style={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ) : null
              }
              actions={[
                <Tooltip title="Редактировать">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/edit-article/${article.id}`)}
                  />
                </Tooltip>,
                <Tooltip title="Разархивировать">
                  <Button
                    type="text"
                    icon={<FolderOpenOutlined />}
                    onClick={() => handleUnarchive(article.id)}
                  />
                </Tooltip>,
                <Tooltip title="Удалить">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(article.id)}
                  />
                </Tooltip>
              ]}
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 16, flex: 1 }}>
                      {article.title}
                    </Text>
                    <Tag color="orange" icon={<FolderOutlined />}>
                      Архив
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <Paragraph
                      ellipsis={{ rows: 3 }}
                      style={{ marginBottom: 12, color: '#666' }}
                    >
                      {stripHtml(article.content)}
                    </Paragraph>
                    
                    <Space size="small" style={{ fontSize: 12, color: '#999' }}>
                      <Space size={4}>
                        <ClockCircleOutlined />
                        <Text type="secondary">
                          {dayjs(article.created_at).format('DD MMMM YYYY')}
                        </Text>
                      </Space>
                      <Space size={4}>
                        <EyeOutlined />
                        <Text type="secondary">
                          {article.views} просмотров
                        </Text>
                      </Space>
                    </Space>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivedArticlesPage;
