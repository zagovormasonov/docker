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
  Alert,
  Upload
} from 'antd';
import { useTheme } from '../hooks/useTheme';
import ThemeSwitch from '../components/ThemeSwitch';
import '../styles/dark-theme.css';
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UploadOutlined,
  DeleteOutlined as DeleteImageOutlined,
  PlusOutlined
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
  cover_image?: string;
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
  cover_image?: string;
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
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Хук для управления темой
  const { isDark, toggleTheme } = useTheme();

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
        // Проверяем, является ли это относительным путем
        let fullSrc = src;
        if (src.startsWith('/uploads/') || src.startsWith('uploads/')) {
          // Если это загруженное изображение, добавляем базовый URL
          fullSrc = src.startsWith('/') ? src : `/${src}`;
        }
        
        // Заменяем img на стилизованный элемент
        const imageElement = document.createElement('div');
        imageElement.innerHTML = `<div style="margin: 10px 0; text-align: center;">
          <img src="${fullSrc}" alt="Изображение ${index + 1}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <div style="display: none; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center; color: #999;">
            Изображение недоступно: ${src}
          </div>
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
          cover_image: values.cover_image,
          is_published: values.is_published
        });
        message.success('Статья обновлена');
        fetchArticles();
      } else {
        await axios.put(`/admin/events/${editingItem.id}`, {
          title: values.title,
          description: values.content,
          cover_image: values.cover_image,
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

  const handleViewDetails = (item: Article | Event, type: 'article' | 'event') => {
    setEditingItem({ ...item, type });
    setEditModalVisible(true);
    
    // Инициализируем форму данными
    const formData: any = {
      title: item.title,
      is_published: item.is_published,
      cover_image: item.cover_image
    };
    
    if (type === 'article') {
      formData.content = (item as Article).content;
    } else {
      formData.content = (item as Event).description;
      formData.location = (item as Event).location;
      formData.event_date = (item as Event).event_date ? dayjs((item as Event).event_date) : null;
    }
    
    editForm.setFieldsValue(formData);
  };

  // Функция для загрузки изображения
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Обновляем cover_image в форме
      editForm.setFieldsValue({ cover_image: response.data.imageUrl });
      
      // Обновляем editingItem
      setEditingItem({
        ...editingItem,
        cover_image: response.data.imageUrl
      });
      
      message.success('Изображение загружено успешно!');
      return false; // Предотвращаем автоматическую загрузку
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      message.error('Ошибка загрузки изображения');
      return false;
    } finally {
      setUploadingImage(false);
    }
  };

  // Функция для удаления изображения
  const handleImageDelete = () => {
    editForm.setFieldsValue({ cover_image: null });
    setEditingItem({
      ...editingItem,
      cover_image: null
    });
    message.success('Изображение удалено');
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
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record, 'article')}
            size="small"
          >
            Просмотр
          </Button>
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
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record, 'event')}
            size="small"
          >
            Просмотр
          </Button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>Панель администратора</Title>
        <ThemeSwitch isDark={isDark} onChange={toggleTheme} />
      </div>
      
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
        <div>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Основная информация">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <strong>ID:</strong> {editingItem?.id}
                  </Col>
                  <Col span={12}>
                    <strong>Автор:</strong> {editingItem?.author_name}
                  </Col>
                  <Col span={12}>
                    <strong>Email автора:</strong> {editingItem?.author_email}
                  </Col>
                  <Col span={12}>
                    <strong>Статус:</strong> 
                    <Tag color={editingItem?.is_published ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
                      {editingItem?.is_published ? 'Опубликовано' : 'Не опубликовано'}
                    </Tag>
                  </Col>
                  <Col span={12}>
                    <strong>Создано:</strong> {dayjs(editingItem?.created_at).format('DD.MM.YYYY HH:mm:ss')}
                  </Col>
                  <Col span={12}>
                    <strong>Обновлено:</strong> {dayjs(editingItem?.updated_at).format('DD.MM.YYYY HH:mm:ss')}
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col span={24}>
              <Card title="Редактирование">
                <Form form={editForm} layout="vertical">
                  <Form.Item
                    name="title"
                    label="Заголовок"
                    rules={[{ required: true, message: 'Введите заголовок' }]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="cover_image"
                    label="Обложка"
                  >
                    <div>
                      {editingItem?.cover_image && (
                        <div style={{ marginBottom: 16 }}>
                          <Image
                            src={editingItem.cover_image}
                            alt="Текущая обложка"
                            style={{ 
                              maxWidth: 200, 
                              maxHeight: 200, 
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid #d9d9d9'
                            }}
                          />
                          <div style={{ marginTop: 8 }}>
                            <Button 
                              type="text" 
                              danger 
                              icon={<DeleteImageOutlined />}
                              onClick={handleImageDelete}
                              size="small"
                            >
                              Удалить обложку
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Upload
                        beforeUpload={handleImageUpload}
                        showUploadList={false}
                        accept="image/*"
                        disabled={uploadingImage}
                      >
                        <Button 
                          icon={<UploadOutlined />} 
                          loading={uploadingImage}
                          disabled={uploadingImage}
                        >
                          {editingItem?.cover_image ? 'Заменить обложку' : 'Загрузить обложку'}
                        </Button>
                      </Upload>
                    </div>
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
              </Card>
            </Col>
            
            <Col span={24}>
              <Card title={editingItem?.type === 'article' ? 'Содержимое статьи' : 'Описание события'}>
                <Typography.Title level={4}>{editingItem?.title}</Typography.Title>
                
                {editingItem?.cover_image && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Image 
                      src={editingItem.cover_image} 
                      alt="Обложка" 
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                )}
                
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: renderHtmlContent(editingItem?.content || '') 
                  }}
                  style={{
                    lineHeight: '1.6',
                    fontSize: '16px',
                    color: '#333'
                  }}
                />
              </Card>
            </Col>
            
            {editingItem?.type === 'event' && (
              <Col span={24}>
                <Card title="Детали события">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <strong>Место проведения:</strong> {editingItem?.location}
                    </Col>
                    <Col span={12}>
                      <strong>Дата события:</strong> {dayjs(editingItem?.event_date).format('DD.MM.YYYY HH:mm')}
                    </Col>
                    <Col span={12}>
                      <strong>Тип:</strong> {editingItem?.is_online ? 'Онлайн' : 'Офлайн'}
                    </Col>
                  </Row>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;
