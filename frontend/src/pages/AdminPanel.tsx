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
  PlusOutlined,
  PushpinOutlined,
  PushpinFilled,
  UnlockOutlined
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
  is_pinned?: boolean;
  pin_order?: number;
  pinned_at?: string;
  pinned_by_name?: string;
  author_name: string;
  author_email: string;
  created_at: string;
  updated_at: string;
  status: string;
  views?: number;
  likes_count?: number;
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

interface User {
  id: number;
  name: string;
  email: string;
  userType: string;
  slug?: string;
  isBanned?: boolean;
  created_at: string;
  updated_at: string;
}

const AdminPanel: React.FC = () => {
  console.log('AdminPanel component rendering...');
  const { user } = useAuth();
  console.log('User from useAuth:', user);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pinnedArticles, setPinnedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  console.log('Initial state - loading:', loading, 'user:', user?.userType);

  // Упрощенная версия для отладки
  const [debugMode, setDebugMode] = useState(false);

  // Определяем функции загрузки ПЕРЕД useEffect
  const fetchUsers = async () => {
    try {
      console.log('fetchUsers called - REAL API VERSION');
      const response = await axios.get('/admin/users');
      console.log('Users API Response:', response.data);
      const usersData = response.data.users || response.data;
      console.log('Setting users:', usersData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      console.log('Users set successfully');
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchArticles = async () => {
    try {
      console.log('fetchArticles called');
      const response = await axios.get('/admin/articles');
      console.log('Articles API Response:', response.data);
      const articlesData = response.data.articles || response.data;
      console.log('Setting articles:', articlesData);
      setArticles(Array.isArray(articlesData) ? articlesData : []);
      console.log('Articles set successfully');
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    }
  };

  const fetchEvents = async () => {
    try {
      console.log('fetchEvents called');
      const response = await axios.get('/admin/events');
      console.log('Events API Response:', response.data);
      const eventsData = response.data.events || response.data;
      console.log('Setting events:', eventsData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      console.log('Events set successfully');
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const fetchPinnedArticles = async () => {
    try {
      console.log('fetchPinnedArticles called');
      const response = await axios.get('/admin/pinned-articles');
      console.log('Pinned Articles API Response:', response.data);
      setPinnedArticles(Array.isArray(response.data) ? response.data : []);
      console.log('Pinned articles set successfully');
    } catch (error) {
      console.error('Error fetching pinned articles:', error);
      setPinnedArticles([]);
    }
  };

  // Основной useEffect для загрузки данных - ЗАГРУЖАЕМ ВСЕ ДАННЫЕ
  useEffect(() => {
    console.log('useEffect triggered - LOADING ALL DATA');
    const loadData = async () => {
      try {
        console.log('Starting data load...');
        setLoading(true);
        
        // Загружаем все данные параллельно
        console.log('Fetching all data...');
        await Promise.all([
          fetchUsers(),
          fetchArticles(),
          fetchEvents(),
          fetchPinnedArticles()
        ]);
        
        console.log('Data load completed');
        setLoading(false);
        console.log('Loading set to false');
      } catch (error) {
        console.error('Error loading admin data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Логирование изменений состояния
  useEffect(() => {
    console.log('Users state changed:', users);
  }, [users]);

  useEffect(() => {
    console.log('Articles state changed:', articles);
  }, [articles]);

  useEffect(() => {
    console.log('Events state changed:', events);
  }, [events]);

  useEffect(() => {
    console.log('Loading state changed:', loading);
  }, [loading]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('articles');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentCoverImage, setCurrentCoverImage] = useState<string | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordForm] = Form.useForm();
  const [changingPassword, setChangingPassword] = useState(false);
  
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

  // Временная упрощенная версия для отладки
  if (debugMode) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Панель администратора (Отладка)</Title>
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Отладочная информация:</h3>
          <p>Пользователи: {users?.length || 0} (тип: {typeof users})</p>
          <p>Статьи: {articles?.length || 0} (тип: {typeof articles})</p>
          <p>События: {events?.length || 0} (тип: {typeof events})</p>
          <p>Загрузка: {loading ? 'Да' : 'Нет'}</p>
          <Button onClick={() => setDebugMode(false)}>Переключить в обычный режим</Button>
        </div>
      </div>
    );
  }

  // Проверяем, что данные загружены
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={2}>Загрузка...</Title>
        <p>Загружаем данные административной панели...</p>
        <p>Пользователи: {users?.length || 0}, Статьи: {articles?.length || 0}, События: {events?.length || 0}</p>
      </div>
    );
  }

  // Отладочная информация
  console.log('Rendering AdminPanel with data:', {
    loading,
    usersCount: users?.length || 0,
    articlesCount: articles?.length || 0,
    eventsCount: events?.length || 0
  });

  const handleToggleExpertStatus = async (userId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'expert' ? 'client' : 'expert';
      await axios.put(`/admin/users/${userId}/expert-status`, {
        userType: newStatus
      });
      
      console.log(`Пользователь ${newStatus === 'expert' ? 'назначен' : 'лишен'} статуса эксперта`);
      fetchUsers();
    } catch (error) {
      console.error('Ошибка изменения статуса пользователя');
    }
  };

  const handleToggleAdminRights = async (userId: number, currentType: string) => {
    try {
      const isAdmin = currentType === 'admin';
      const response = await axios.put(`/admin/users/${userId}/admin-rights`, {
        grantAdmin: !isAdmin
      });
      
      message.success(response.data.message || (isAdmin ? 'Права администратора отозваны' : 'Права администратора выданы'));
      fetchUsers();
    } catch (error: any) {
      console.error('Ошибка изменения прав администратора:', error);
      message.error(error.response?.data?.message || 'Ошибка изменения прав администратора');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      const response = await axios.put(`/admin/users/${userId}/unban`);
      message.success(response.data.message || 'Пользователь удален из черного списка');
      fetchUsers();
    } catch (error: any) {
      console.error('Ошибка удаления из черного списка:', error);
      message.error(error.response?.data?.message || 'Ошибка удаления из черного списка');
    }
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  const handlePasswordSubmit = async () => {
    try {
      setChangingPassword(true);
      const values = await passwordForm.validateFields();
      const response = await axios.put(`/admin/users/${selectedUser?.id}/change-password`, {
        newPassword: values.newPassword
      });
      message.success(response.data.message || 'Пароль успешно изменен');
      setPasswordModalVisible(false);
    } catch (error: any) {
      console.error('Ошибка изменения пароля:', error);
      message.error(error.response?.data?.message || 'Ошибка изменения пароля');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePasswordModalClose = () => {
    setPasswordModalVisible(false);
    setSelectedUser(null);
    passwordForm.resetFields();
  };

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
        console.log('Статья обновлена');
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
        console.log('Событие обновлено');
        fetchEvents();
      }
      
      setEditModalVisible(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Ошибка обновления');
    }
  };

  const handleDelete = async (id: number, type: 'article' | 'event') => {
    try {
      if (type === 'article') {
        await axios.delete(`/admin/articles/${id}`);
        console.log('Статья удалена');
        fetchArticles();
        fetchPinnedArticles(); // Обновляем закрепленные статьи
      } else {
        await axios.delete(`/admin/events/${id}`);
        console.log('Событие удалено');
        fetchEvents();
      }
    } catch (error) {
      console.error('Ошибка удаления');
    }
  };

  const handlePinArticle = async (articleId: number) => {
    try {
      await axios.post(`/admin/pinned-articles/${articleId}/pin`);
      message.success('Статья закреплена!');
      fetchPinnedArticles();
      fetchArticles();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка закрепления статьи');
    }
  };

  const handleUnpinArticle = async (articleId: number) => {
    try {
      await axios.post(`/admin/pinned-articles/${articleId}/unpin`);
      message.success('Статья откреплена!');
      fetchPinnedArticles();
      fetchArticles();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка открепления статьи');
    }
  };

  const handleReorderPinnedArticle = async (articleId: number, newOrder: number) => {
    try {
      await axios.put(`/admin/pinned-articles/${articleId}/reorder`, { newOrder });
      message.success('Порядок изменен!');
      fetchPinnedArticles();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка изменения порядка');
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
    setCurrentCoverImage(item.cover_image || null);
  };

  // Функция для загрузки изображения
  const handleImageUpload = async (file: File) => {
    console.log('📸 Начинаем загрузку изображения:', file.name);
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('📤 Отправляем запрос на /upload/image');
      const response = await axios.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Ответ сервера:', response.data);
      
      // Получаем URL изображения (сервер возвращает { url: imageUrl })
      const imageUrl = response.data.url || response.data.imageUrl;
      console.log('🔗 URL изображения:', imageUrl);
      
      // Обновляем cover_image в форме
      editForm.setFieldsValue({ cover_image: imageUrl });
      console.log('📝 Обновляем форму с cover_image:', imageUrl);
      
      // Обновляем editingItem
      setEditingItem({
        ...editingItem,
        cover_image: imageUrl
      });
      console.log('📝 Обновляем editingItem');
      
      // Обновляем текущее изображение для отображения
      setCurrentCoverImage(imageUrl);
      console.log('🖼️ Обновляем currentCoverImage:', imageUrl);
      
      console.log('Изображение загружено успешно!');
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      console.error('Ошибка загрузки изображения');
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
    setCurrentCoverImage(null);
    console.log('Изображение удалено');
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
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: Article) => (
        <Space direction="vertical" size="small">
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
          </Space>
          <Space>
            {record.is_pinned ? (
              <Button 
                icon={<PushpinFilled />} 
                onClick={() => handleUnpinArticle(record.id)}
                size="small"
                type="default"
              >
                Открепить
              </Button>
            ) : (
              <Button 
                icon={<PushpinOutlined />} 
                onClick={() => handlePinArticle(record.id)}
                size="small"
                type="dashed"
                disabled={!record.is_published}
              >
                Закрепить
              </Button>
            )}
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
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '-',
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

  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Тип аккаунта',
      dataIndex: 'userType',
      key: 'userType',
      render: (userType: string) => {
        let color = 'blue';
        let text = 'Клиент';
        
        if (userType === 'expert') {
          color = 'green';
          text = 'Эксперт';
        } else if (userType === 'admin') {
          color = 'red';
          text = 'Администратор';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Статус',
      dataIndex: 'isBanned',
      key: 'isBanned',
      render: (isBanned: boolean) => {
        if (isBanned) {
          return <Tag color="red">В черном списке</Tag>;
        }
        return <Tag color="green">Активен</Tag>;
      },
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 300,
      render: (record: User) => {
        if (!record || !record.userType) return null;
        const isAdmin = record.userType === 'admin';
        
        return (
          <Space direction="vertical" size="small">
            {/* Управление статусом эксперта (только для не-админов) */}
            {!isAdmin && (
              <Popconfirm
                title={record.userType === 'expert' ? 'Лишить статуса эксперта?' : 'Назначить экспертом?'}
                description={`Пользователь ${record.name} будет ${record.userType === 'expert' ? 'лишен' : 'назначен'} статуса эксперта`}
                onConfirm={() => handleToggleExpertStatus(record.id, record.userType)}
                okText="Да"
                cancelText="Нет"
              >
                <Button 
                  type={record.userType === 'expert' ? 'default' : 'primary'}
                  size="small"
                  block
                >
                  {record.userType === 'expert' ? 'Лишить статуса' : 'Назначить экспертом'}
                </Button>
              </Popconfirm>
            )}
            
            {/* Управление правами администратора */}
            <Popconfirm
              title={isAdmin ? '⚠️ Отозвать права администратора?' : '🔑 Назначить администратором?'}
              description={
                isAdmin 
                  ? `Пользователь ${record.name} больше не сможет управлять системой`
                  : `Пользователь ${record.name} получит полный доступ к админ-панели`
              }
              onConfirm={() => handleToggleAdminRights(record.id, record.userType)}
              okText="Да, подтверждаю"
              cancelText="Отмена"
              okButtonProps={{ danger: isAdmin }}
            >
              <Button 
                type={isAdmin ? 'default' : 'primary'}
                danger={isAdmin}
                size="small"
                block
                style={isAdmin ? {} : { background: '#722ed1', borderColor: '#722ed1' }}
              >
                {isAdmin ? '🔓 Отозвать права админа' : '🔑 Сделать админом'}
              </Button>
            </Popconfirm>

            {/* Удаление из черного списка */}
            {record.isBanned && (
              <Popconfirm
                title="Удалить из черного списка?"
                description={`Пользователь ${record.name} будет разблокирован и сможет снова использовать платформу`}
                onConfirm={() => handleUnbanUser(record.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button 
                  type="primary"
                  size="small"
                  block
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  ✅ Удалить из БЛ
                </Button>
              </Popconfirm>
            )}

            {/* Смена пароля */}
            <Button 
              type="default"
              size="small"
              block
              onClick={() => handleChangePassword(record)}
            >
              🔑 Сменить пароль
            </Button>
          </Space>
        );
      },
    },
  ];

  const getStats = () => {
    try {
      const publishedArticles = (articles || []).filter(a => a && a.is_published).length;
      const unpublishedArticles = (articles || []).filter(a => a && !a.is_published).length;
      const publishedEvents = (events || []).filter(e => e && e.is_published).length;
      const unpublishedEvents = (events || []).filter(e => e && !e.is_published).length;
      const expertUsers = (users || []).filter(u => u && u.userType === 'expert').length;
      const clientUsers = (users || []).filter(u => u && u.userType === 'client').length;
      const adminUsers = (users || []).filter(u => u && u.userType === 'admin').length;

      return {
        publishedArticles,
        unpublishedArticles,
        publishedEvents,
        unpublishedEvents,
        expertUsers,
        clientUsers,
        adminUsers,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        publishedArticles: 0,
        unpublishedArticles: 0,
        publishedEvents: 0,
        unpublishedEvents: 0,
        expertUsers: 0,
        clientUsers: 0,
        adminUsers: 0,
      };
    }
  };

  // Вычисляем статистику только если данные загружены
  const stats = loading ? {
    publishedArticles: 0,
    unpublishedArticles: 0,
    publishedEvents: 0,
    unpublishedEvents: 0,
    expertUsers: 0,
    clientUsers: 0,
    adminUsers: 0,
  } : getStats();

  return (
    <div style={{ 
      padding: 'clamp(12px, 3vw, 24px)',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
        gap: '16px',
        marginBottom: '24px' 
      }}>
        <Title level={2} style={{ margin: 0, fontSize: window.innerWidth < 768 ? '20px' : '30px' }}>
          Панель администратора
        </Title>
        <Space wrap>
          <Button
            type="primary"
            onClick={() => window.location.href = '/admin-logs'}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            📊 Логи действий
          </Button>
          <ThemeSwitch isDark={isDark} onChange={toggleTheme} />
        </Space>
      </div>
      
      {/* Простая отладочная информация */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Отладочная информация:</h3>
        <p>Пользователи: {users?.length || 0} (тип: {typeof users})</p>
        <p>Статьи: {articles?.length || 0} (тип: {typeof articles})</p>
        <p>События: {events?.length || 0} (тип: {typeof events})</p>
        <p>Загрузка: {loading ? 'Да' : 'Нет'}</p>
      </div>
      
      {/* Статистика */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="Опубликованные статьи"
              value={stats?.publishedArticles || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="На модерации"
              value={stats?.unpublishedArticles || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="Опубликованные события"
              value={stats?.publishedEvents || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="События на модерации"
              value={stats?.unpublishedEvents || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={12} lg={12}>
          <Card>
            <Statistic
              title="Эксперты"
              value={stats?.expertUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={12}>
          <Card>
            <Statistic
              title="Клиенты"
              value={stats?.clientUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={12} lg={12}>
          <Card>
            <Statistic
              title="Администраторы"
              value={stats?.adminUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={12}>
          <Card>
            <Statistic
              title="Всего пользователей"
              value={(stats?.expertUsers || 0) + (stats?.clientUsers || 0) + (stats?.adminUsers || 0)}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ overflowX: 'auto' }}
        items={[
          {
            key: 'pinned',
            label: (
              <span>
                <PushpinFilled /> Закрепленные ({(pinnedArticles || []).length}/3)
              </span>
            ),
            children: (
              <div>
                <Alert
                  message="Управление закрепленными статьями"
                  description="Здесь вы можете управлять закрепленными статьями на главной странице. Максимум 3 статьи могут быть закреплены одновременно."
                  type="info"
                  showIcon
                  icon={<PushpinOutlined />}
                  style={{ marginBottom: 16 }}
                />
                
                {pinnedArticles && pinnedArticles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {pinnedArticles.map((article) => (
                      <Card 
                        key={article.id}
                        style={{ 
                          border: '2px solid #1890ff',
                          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)'
                        }}
                      >
                        <Row gutter={16} align="middle">
                          <Col span={1}>
                            <div style={{ 
                              fontSize: 24, 
                              fontWeight: 'bold', 
                              color: '#1890ff',
                              textAlign: 'center'
                            }}>
                              {article.pin_order}
                            </div>
                          </Col>
                          
                          <Col span={15}>
                            <Space direction="vertical" size="small">
                              <Title level={4} style={{ margin: 0 }}>
                                <PushpinFilled style={{ color: '#1890ff', marginRight: 8 }} />
                                {article.title}
                              </Title>
                              <Space size="middle">
                                <Tag color="blue">
                                  <UserOutlined /> {article.author_name}
                                </Tag>
                                <Tag color="green">
                                  👁 {article.views || 0} просмотров
                                </Tag>
                                <Tag color="orange">
                                  ❤️ {article.likes_count || 0} лайков
                                </Tag>
                              </Space>
                              <Typography.Text type="secondary">
                                Закреплена: {article.pinned_at ? dayjs(article.pinned_at).format('DD.MM.YYYY HH:mm') : '-'}
                                {article.pinned_by_name && ` | Админ: ${article.pinned_by_name}`}
                              </Typography.Text>
                            </Space>
                          </Col>
                          
                          <Col span={8}>
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                              <Space>
                                <Button
                                  icon={<EyeOutlined />}
                                  onClick={() => handleViewDetails(article, 'article')}
                                  size="small"
                                >
                                  Просмотр
                                </Button>
                                <Button
                                  icon={<EditOutlined />}
                                  onClick={() => handleEdit(article, 'article')}
                                  size="small"
                                >
                                  Редактировать
                                </Button>
                              </Space>
                              <Space>
                                <Button
                                  icon={<PushpinFilled />}
                                  onClick={() => handleUnpinArticle(article.id)}
                                  danger
                                  size="small"
                                >
                                  Открепить
                                </Button>
                                {article.pin_order && article.pin_order > 1 && (
                                  <Button
                                    onClick={() => handleReorderPinnedArticle(article.id, article.pin_order! - 1)}
                                    size="small"
                                  >
                                    ↑ Выше
                                  </Button>
                                )}
                                {article.pin_order && article.pin_order < pinnedArticles.length && (
                                  <Button
                                    onClick={() => handleReorderPinnedArticle(article.id, article.pin_order! + 1)}
                                    size="small"
                                  >
                                    ↓ Ниже
                                  </Button>
                                )}
                              </Space>
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <Typography.Text type="secondary">
                      Нет закрепленных статей. Перейдите на вкладку "Статьи" и закрепите нужные статьи.
                    </Typography.Text>
                  </Card>
                )}
              </div>
            ),
          },
          {
            key: 'articles',
            label: `Статьи (${(articles || []).length})`,
            children: (
              <Table
                columns={articleColumns}
                dataSource={articles || []}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
              />
            ),
          },
          {
            key: 'events',
            label: `События (${(events || []).length})`,
            children: (
              <Table
                columns={eventColumns}
                dataSource={events || []}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
              />
            ),
          },
          {
            key: 'users',
            label: `Пользователи (${(users || []).length})`,
            children: (
              <Table
                columns={userColumns}
                dataSource={users || []}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
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
        afterClose={() => {
          // Возвращаем фокус на страницу после закрытия модального окна
          document.body.style.overflow = 'auto';
        }}
        destroyOnClose={true}
        maskClosable={true}
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
                      {currentCoverImage && (
                        <div style={{ marginBottom: 16 }}>
                          <Image
                            src={currentCoverImage}
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
                        customRequest={({ file }) => handleImageUpload(file as File)}
                        showUploadList={false}
                        accept="image/*"
                        disabled={uploadingImage}
                      >
                        <Button 
                          icon={<UploadOutlined />} 
                          loading={uploadingImage}
                          disabled={uploadingImage}
                        >
                          {currentCoverImage ? 'Заменить обложку' : 'Загрузить обложку'}
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
                
                {currentCoverImage && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Image 
                      src={currentCoverImage} 
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

      {/* Модальное окно смены пароля */}
      <Modal
        title={`Сменить пароль пользователя ${selectedUser?.name}`}
        open={passwordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={handlePasswordModalClose}
        afterClose={handlePasswordModalClose}
        okText="Изменить пароль"
        cancelText="Отмена"
        confirmLoading={changingPassword}
        destroyOnClose={true}
        maskClosable={!changingPassword}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="Новый пароль"
            rules={[
              { required: true, message: 'Введите новый пароль' },
              { min: 6, message: 'Пароль должен быть минимум 6 символов' }
            ]}
          >
            <Input.Password placeholder="Введите новый пароль" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Подтвердите пароль"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Подтвердите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Пароли не совпадают'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Подтвердите новый пароль" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
