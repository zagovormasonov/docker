import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Switch, 
  message, 
  Tabs, 
  Space, 
  Tag, 
  Popconfirm,
  DatePicker,
  Typography,
  Row,
  Col,
  Statistic,
  Divider,
  Image,
  Alert
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import axios from '../api/axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title } = Typography;

interface Article {
  id: number;
  title: string;
  content: string;
  is_published: boolean;
  author_name: string;
  author_email: string;
  created_at: string;
  updated_at: string;
  status: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  event_date: string;
  is_published: boolean;
  author_name: string;
  author_email: string;
  created_at: string;
  updated_at: string;
  status: string;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('articles');

  // Функция для рендеринга HTML содержимого с картинками и ссылками
  const renderHtmlContent = (content: string) => {
    if (!content) return null;
    
    // Создаем временный div для парсинга HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Находим все изображения
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img, index) => {
      const src = img.getAttribute('src');
      if (src) {
        // Заменяем img на стилизованный элемент
        const imageElement = document.createElement('div');
        imageElement.innerHTML = `<div style="margin: 10px 0; text-align: center;">
          <img src="${src}" alt="Изображение ${index + 1}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
        </div>`;
        img.parentNode?.replaceChild(imageElement.firstChild!, img);
      }
    });
    
    // Находим все ссылки
    const links = tempDiv.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.style.color = '#1890ff';
        link.style.textDecoration = 'underline';
      }
    });
    
    return tempDiv.innerHTML;
  };

  // Проверяем права администратора
  if (user?.userType !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={2}>Доступ запрещен</Title>
        <p>Эта страница доступна только администраторам</p>
      </div>
    );
  }

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/articles');
      setArticles(response.data.articles);
    } catch (error) {
      message.error('Ошибка загрузки статей');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/events');
      setEvents(response.data.events);
    } catch (error) {
      message.error('Ошибка загрузки событий');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchEvents();
  }, []);

  const handleEdit = (item: Article | Event, type: 'article' | 'event') => {
    setEditingItem({ ...item, type });
    editForm.setFieldsValue({
      title: item.title,
      content: type === 'article' ? (item as Article).content : (item as Event).description,
      location: type === 'event' ? (item as Event).location : undefined,
      event_date: type === 'event' ? dayjs((item as Event).event_date) : undefined,
      is_published: item.is_published
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await editForm.validateFields();
      
      if (editingItem.type === 'article') {
        await axios.put(`/admin/articles/${editingItem.id}`, {
          title: values.title,
          content: values.content,
          is_published: values.is_published
        });
        message.success('Статья обновлена');
        fetchArticles();
      } else {
        await axios.put(`/admin/events/${editingItem.id}`, {
          title: values.title,
          description: values.content,
          location: values.location,
          event_date: values.event_date.toISOString(),
          is_published: values.is_published
        });
        message.success('Событие обновлено');
        fetchEvents();
      }
      
      setEditModalVisible(false);
      setEditingItem(null);
    } catch (error) {
      message.error('Ошибка обновления');
    }
  };

  const handleDelete = async (id: number, type: 'article' | 'event') => {
    try {
      if (type === 'article') {
        await axios.delete(`/admin/articles/${id}`);
        message.success('Статья удалена');
        fetchArticles();
      } else {
        await axios.delete(`/admin/events/${id}`);
        message.success('Событие удалено');
        fetchEvents();
      }
    } catch (error) {
      message.error('Ошибка удаления');
    }
  };

  const articleColumns = [
    {
      title: 'Заголовок',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Автор',
      dataIndex: 'author_name',
      key: 'author_name',
      render: (text: string, record: Article) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Опубликована' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Создана',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: Article) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record, 'article')}
            size="small"
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить статью?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id, 'article')}
            okText="Да"
            cancelText="Нет"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            >
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const eventColumns = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Место',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
    },
    {
      title: 'Дата',
      dataIndex: 'event_date',
      key: 'event_date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Автор',
      dataIndex: 'author_name',
      key: 'author_name',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Опубликовано' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: Event) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record, 'event')}
            size="small"
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить событие?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id, 'event')}
            okText="Да"
            cancelText="Нет"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            >
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getStats = () => {
    const publishedArticles = articles.filter(a => a.is_published).length;
    const unpublishedArticles = articles.filter(a => !a.is_published).length;
    const publishedEvents = events.filter(e => e.is_published).length;
    const unpublishedEvents = events.filter(e => !e.is_published).length;

    return {
      publishedArticles,
      unpublishedArticles,
      publishedEvents,
      unpublishedEvents
    };
  };

  const stats = getStats();

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Панель администратора</Title>
      
      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Опубликованные статьи"
              value={stats.publishedArticles}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="На модерации"
              value={stats.unpublishedArticles}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Опубликованные события"
              value={stats.publishedEvents}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="События на модерации"
              value={stats.unpublishedEvents}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'articles',
            label: `Статьи (${articles.length})`,
            children: (
              <Table
                columns={articleColumns}
                dataSource={articles}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: 'events',
            label: `События (${events.length})`,
            children: (
              <Table
                columns={eventColumns}
                dataSource={events}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ),
          },
        ]}
      />

      {/* Модальное окно редактирования */}
      <Modal
        title={editingItem?.type === 'article' ? 'Редактировать статью' : 'Редактировать событие'}
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingItem(null);
        }}
        width={1200}
        style={{ top: 20 }}
      >
        <Tabs
          defaultActiveKey="edit"
          items={[
            {
              key: 'edit',
              label: 'Редактирование',
              children: (
                <Form form={editForm} layout="vertical">
                  <Form.Item
                    name="title"
                    label="Заголовок"
                    rules={[{ required: true, message: 'Введите заголовок' }]}
                  >
                    <Input />
                  </Form.Item>
                  
                  <Form.Item
                    name="content"
                    label={editingItem?.type === 'article' ? 'Содержимое' : 'Описание'}
                    rules={[{ required: true, message: 'Введите содержимое' }]}
                  >
                    <TextArea rows={8} />
                  </Form.Item>

                  {editingItem?.type === 'event' && (
                    <>
                      <Form.Item
                        name="location"
                        label="Место проведения"
                        rules={[{ required: true, message: 'Введите место проведения' }]}
                      >
                        <Input />
                      </Form.Item>
                      
                      <Form.Item
                        name="event_date"
                        label="Дата события"
                        rules={[{ required: true, message: 'Выберите дату события' }]}
                      >
                        <DatePicker showTime style={{ width: '100%' }} />
                      </Form.Item>
                    </>
                  )}

                  <Form.Item
                    name="is_published"
                    label="Опубликовано"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'preview',
              label: 'Предварительный просмотр',
              children: (
                <div>
                  <Alert
                    message="Предварительный просмотр"
                    description="Здесь отображается, как будет выглядеть содержимое для пользователей"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Card>
                    <Typography.Title level={3}>
                      {editForm.getFieldValue('title') || 'Заголовок'}
                    </Typography.Title>
                    
                    <Divider />
                    
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: renderHtmlContent(editForm.getFieldValue('content') || '') 
                      }}
                      style={{
                        lineHeight: '1.6',
                        fontSize: '16px',
                        color: '#333'
                      }}
                    />
                    
                    {editingItem?.type === 'event' && (
                      <>
                        <Divider />
                        <Row gutter={16}>
                          <Col span={12}>
                            <Typography.Text strong>Место проведения:</Typography.Text>
                            <br />
                            <Typography.Text>{editForm.getFieldValue('location') || 'Не указано'}</Typography.Text>
                          </Col>
                          <Col span={12}>
                            <Typography.Text strong>Дата события:</Typography.Text>
                            <br />
                            <Typography.Text>
                              {editForm.getFieldValue('event_date') 
                                ? dayjs(editForm.getFieldValue('event_date')).format('DD.MM.YYYY HH:mm')
                                : 'Не указано'
                              }
                            </Typography.Text>
                          </Col>
                        </Row>
                      </>
                    )}
                    
                    <Divider />
                    
                    <Space>
                      <Typography.Text strong>Статус:</Typography.Text>
                      <Tag color={editForm.getFieldValue('is_published') ? 'green' : 'orange'}>
                        {editForm.getFieldValue('is_published') ? 'Опубликовано' : 'На модерации'}
                      </Tag>
                    </Space>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default AdminPanel;
