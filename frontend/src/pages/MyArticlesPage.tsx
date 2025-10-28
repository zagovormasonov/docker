import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  List,
  Button,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Empty,
  Spin,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  CalendarOutlined,
  FolderOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const { Title, Text } = Typography;

interface Article {
  id: number;
  title: string;
  content: string;
  cover_image?: string;
  is_published: boolean;
  archived: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

const MyArticlesPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/articles/my/articles');
      setArticles(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
      message.error('Ошибка загрузки статей');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/articles/${id}`);
      message.success('Статья успешно удалена!');
      fetchArticles();
    } catch (error: any) {
      console.error('Ошибка удаления статьи:', error);
      message.error(error.response?.data?.error || 'Ошибка удаления статьи');
    }
  };

  const handleTogglePublish = async (id: number, isPublished: boolean) => {
    try {
      await api.put(`/articles/${id}`, { isPublished: !isPublished });
      message.success(isPublished ? 'Статья снята с публикации' : 'Статья опубликована!');
      fetchArticles();
    } catch (error: any) {
      console.error('Ошибка изменения статуса:', error);
      message.error(error.response?.data?.error || 'Ошибка изменения статуса');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await api.post(`/articles/${id}/archive`);
      message.success('Статья успешно архивирована!');
      fetchArticles();
    } catch (error: any) {
      console.error('Ошибка архивирования статьи:', error);
      message.error(error.response?.data?.error || 'Ошибка архивирования статьи');
    }
  };

  const handleUnarchive = async (id: number) => {
    try {
      await api.post(`/articles/${id}/unarchive`);
      message.success('Статья успешно разархивирована!');
      fetchArticles();
    } catch (error: any) {
      console.error('Ошибка разархивирования статьи:', error);
      message.error(error.response?.data?.error || 'Ошибка разархивирования статьи');
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Мои статьи</Title>
        <Space>
          <Button
            icon={<FolderOutlined />}
            onClick={() => navigate('/archived-articles')}
            size="large"
          >
            Архив статей
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/create-article')}
            size="large"
          >
            Создать статью
          </Button>
        </Space>
      </div>

      {articles.length === 0 && !loading ? (
        <Card>
          <Empty description="У вас пока нет статей">
            <Button type="primary" onClick={() => navigate('/create-article')}>
              Создать первую статью
            </Button>
          </Empty>
        </Card>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {articles.map((article) => (
            <Col xs={24} sm={24} md={12} lg={12} xl={12} key={article.id}>
              <Card
                hoverable
                cover={
                  article.cover_image ? (
                    <div style={{ height: 200, overflow: 'hidden', cursor: 'pointer' }}
                         onClick={() => navigate(`/articles/${article.id}`)}>
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        style={{ width: '100%', height: 200, objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div 
                      style={{
                        height: 200,
                        background: 'linear-gradient(135deg, rgb(180 194 255) 0%, rgb(245 236 255) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 48,
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/articles/${article.id}`)}
                    >
                      ✨
                    </div>
                  )
                }
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%', flex: 1 }}>
                  {/* Заголовок */}
                  <Title 
                    level={4} 
                    style={{ margin: 0, cursor: 'pointer' }}
                    onClick={() => navigate(`/articles/${article.id}`)}
                  >
                    {article.title}
                  </Title>

                  {/* Статус публикации и архива */}
                  <div>
                    <Space wrap>
                      <Tag color={article.is_published ? 'green' : 'orange'} style={{ fontSize: 13 }}>
                        {article.is_published ? '✓ Опубликовано' : '○ Черновик'}
                      </Tag>
                      {article.archived && (
                        <Tag color="purple" icon={<FolderOutlined />} style={{ fontSize: 13 }}>
                          Архив
                        </Tag>
                      )}
                    </Space>
                  </div>

                  {/* Превью текста */}
                  <div style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: 40,
                    color: 'rgba(0, 0, 0, 0.45)',
                    fontSize: 14
                  }}>
                    {stripHtml(article.content).substring(0, 150)}...
                  </div>

                  {/* Статистика */}
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space size={8}>
                      <EyeOutlined style={{ color: '#6366f1' }} />
                      <Text type="secondary">{article.views} просмотров</Text>
                    </Space>
                    <Space size={8}>
                      <CalendarOutlined style={{ color: '#6366f1' }} />
                      <Text type="secondary">
                        {dayjs(article.created_at).format('DD MMMM YYYY')}
                      </Text>
                    </Space>
                  </Space>

                  {/* Кнопки действий */}
                  <Space wrap style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f0f0f0', width: '100%' }}>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/articles/${article.id}`)}
                      size="small"
                    >
                      Просмотр
                    </Button>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/edit-article/${article.id}`)}
                      type="primary"
                      size="small"
                    >
                      Редактировать
                    </Button>
                    <Button
                      onClick={() => handleTogglePublish(article.id, article.is_published)}
                      type={article.is_published ? 'default' : 'primary'}
                      size="small"
                    >
                      {article.is_published ? 'Снять' : 'Опубликовать'}
                    </Button>
                    {!article.archived ? (
                      <Button
                        icon={<FolderOutlined />}
                        onClick={() => handleArchive(article.id)}
                        size="small"
                      >
                        В архив
                      </Button>
                    ) : (
                      <Button
                        icon={<FolderOpenOutlined />}
                        onClick={() => handleUnarchive(article.id)}
                        size="small"
                      >
                        Из архива
                      </Button>
                    )}
                    <Popconfirm
                      title="Удалить статью?"
                      description="Это действие нельзя отменить"
                      onConfirm={() => handleDelete(article.id)}
                      okText="Да"
                      cancelText="Нет"
                    >
                      <Button danger icon={<DeleteOutlined />} size="small">
                        Удалить
                      </Button>
                    </Popconfirm>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MyArticlesPage;
