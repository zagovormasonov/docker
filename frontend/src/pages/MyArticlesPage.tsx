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
  Spin
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/create-article')}
          size="large"
        >
          Создать статью
        </Button>
      </div>

      {articles.length === 0 && !loading ? (
        <Card>
          <Empty description="У вас пока нет статей">
            <Button type="primary" onClick={() => navigate('/create-article')}>
              Создать первую статью
            </Button>
          </Empty>
        </Card>
      ) : (
        <List
          loading={loading}
          dataSource={articles}
          renderItem={(article) => (
            <Card style={{ marginBottom: 16 }}>
              <List.Item
                actions={[
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/articles/${article.id}`)}
                    type="default"
                  >
                    Просмотр
                  </Button>,
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/edit-article/${article.id}`)}
                    type="primary"
                  >
                    Редактировать
                  </Button>,
                  <Button
                    onClick={() => handleTogglePublish(article.id, article.is_published)}
                    type={article.is_published ? 'default' : 'primary'}
                  >
                    {article.is_published ? 'Снять с публикации' : 'Опубликовать'}
                  </Button>,
                  <Popconfirm
                    title="Удалить статью?"
                    description="Это действие нельзя отменить"
                    onConfirm={() => handleDelete(article.id)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      Удалить
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong style={{ fontSize: 18 }}>{article.title}</Text>
                      <Tag color={article.is_published ? 'green' : 'orange'}>
                        {article.is_published ? 'Опубликовано' : 'Черновик'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Text type="secondary" ellipsis>
                        {stripHtml(article.content).substring(0, 150)}...
                      </Text>
                      <Space split="•">
                        <Space size={4}>
                          <EyeOutlined />
                          <Text type="secondary">{article.views} просмотров</Text>
                        </Space>
                        <Text type="secondary">
                          Создано: {dayjs(article.created_at).format('DD.MM.YYYY')}
                        </Text>
                        {article.updated_at !== article.created_at && (
                          <Text type="secondary">
                            Обновлено: {dayjs(article.updated_at).format('DD.MM.YYYY')}
                          </Text>
                        )}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            </Card>
          )}
        />
      )}
    </div>
  );
};

export default MyArticlesPage;
