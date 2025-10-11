import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  message,
  Typography,
  Space,
  Avatar,
  Upload,
  Divider,
  List,
  Modal,
  Popconfirm,
  Tag
} from 'antd';
import { 
  UserOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UploadOutlined,
  LinkOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import ProfileGallery from '../components/ProfileGallery';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Topic {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface Service {
  id: number;
  title: string;
  description: string;
  price?: number;
  duration?: number;
  service_type: string;
}

const CONSULTATION_TYPES = [
  'Онлайн',
  'Офлайн',
  'Выезд на дом',
  'Групповые сессии',
  'Индивидуальные сессии'
];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form] = Form.useForm();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceForm] = Form.useForm();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTopics();
    fetchCities();
    if (user?.userType === 'expert') {
      fetchServices();
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Правильная обработка тематик - проверяем формат данных
      const topicsValue = user.topics 
        ? user.topics.map((t: any) => typeof t === 'object' ? t.id : t)
        : [];

      form.setFieldsValue({
        name: user.name,
        email: user.email,
        bio: user.bio,
        city: user.city,
        vkUrl: user.vkUrl,
        telegramUrl: user.telegramUrl,
        whatsapp: user.whatsapp,
        consultationTypes: Array.isArray(user.consultationTypes) ? user.consultationTypes : [],
        topics: topicsValue
      });
    }
  }, [user, form]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Ошибка загрузки тематик:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get(`/experts/${user?.id}`);
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Всегда используем endpoint для пользователей, так как эксперты тоже могут обновлять профиль через этот endpoint
      const endpoint = '/users/profile';
      
      console.log('Обновление профиля для пользователя:', user?.userType, 'через endpoint:', endpoint);
      
      const response = await api.put(endpoint, {
        name: values.name,
        bio: values.bio,
        city: values.city,
        vkUrl: values.vkUrl,
        telegramUrl: values.telegramUrl,
        instagramUrl: values.instagramUrl,
        whatsapp: values.whatsapp,
        consultationTypes: values.consultationTypes,
        topics: values.topics
      });
      
      // Загружаем обновленные данные пользователя с сервера
      try {
        const userResponse = await api.get('/users/me');
        const updatedUser = userResponse.data;
        updateUser(updatedUser);
        
        // Обновляем форму с данными с сервера
        const topicsValue = updatedUser.topics 
          ? updatedUser.topics.map((t: any) => typeof t === 'object' ? t.id : t)
          : [];
          
        form.setFieldsValue({
          name: updatedUser.name,
          email: updatedUser.email,
          bio: updatedUser.bio,
          city: updatedUser.city,
          vkUrl: updatedUser.vkUrl,
          telegramUrl: updatedUser.telegramUrl,
          instagramUrl: updatedUser.instagramUrl,
          whatsapp: updatedUser.whatsapp,
          consultationTypes: Array.isArray(updatedUser.consultationTypes) ? updatedUser.consultationTypes : [],
          topics: topicsValue
        });
        
        console.log('Профиль обновлен с сервера:', updatedUser);
        
        // Если пользователь эксперт, перезагружаем услуги
        if (updatedUser.userType === 'expert') {
          fetchServices();
        }
      } catch (fetchError) {
        console.error('Ошибка загрузки обновленного профиля:', fetchError);
        // Fallback - используем переданные значения
        updateUser({ ...user, ...values });
        form.setFieldsValue(values);
      }
      
      message.success('Профиль успешно обновлен!');
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      message.error('Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (values: any) => {
    try {
      if (editingService) {
        await api.put(`/experts/services/${editingService.id}`, values);
        message.success('Услуга обновлена!');
        setEditingService(null);
      } else {
        await api.post('/experts/services', values);
        message.success('Услуга добавлена!');
      }
      serviceForm.resetFields();
      setShowServiceForm(false);
      fetchServices();
    } catch (error) {
      console.error('Ошибка сохранения услуги:', error);
      message.error('Ошибка сохранения услуги');
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceForm(true);
    serviceForm.setFieldsValue({
      title: service.title,
      description: service.description,
      price: service.price,
      duration: service.duration,
      serviceType: service.service_type
    });
  };

  const handleDeleteService = async (serviceId: number) => {
    try {
      await api.delete(`/experts/services/${serviceId}`);
      message.success('Услуга удалена');
      fetchServices();
    } catch (error) {
      console.error('Ошибка удаления услуги:', error);
      message.error('Ошибка удаления услуги');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const avatarUrl = uploadResponse.data.url;

      // Обновляем профиль с новым аватаром
      await api.put('/users/profile', { avatarUrl });

      // Загружаем обновленные данные пользователя с сервера
      try {
        const userResponse = await api.get('/users/me');
        const updatedUser = userResponse.data;
        updateUser(updatedUser);
        console.log('Аватар обновлен с сервера:', updatedUser);
      } catch (fetchError) {
        console.error('Ошибка загрузки обновленного профиля:', fetchError);
        // Fallback - используем локальные данные
        updateUser({ ...user, avatarUrl });
      }
      
      message.success('Аватар успешно обновлен!');
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      message.error('Ошибка загрузки аватара');
    } finally {
      setUploading(false);
    }
    return false; // Предотвращаем автоматическую загрузку
  };

  const handleBecomeExpert = async () => {
    try {
      const response = await api.post('/users/become-expert');
      message.success('Поздравляем! Теперь вы эксперт! Обновите страницу для применения изменений.');
      // Обновляем локальный стейт
      updateUser({ ...user, userType: 'expert' });
      // Перезагружаем страницу для применения всех изменений
      window.location.reload();
    } catch (error: any) {
      console.error('Ошибка становления экспертом:', error);
      message.error(error.response?.data?.error || 'Ошибка становления экспертом');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar
              size={100}
              src={user?.avatarUrl}
              icon={!user?.avatarUrl && <UserOutlined />}
              style={{ backgroundColor: '#6366f1', marginBottom: 16 }}
            />
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleAvatarUpload}
                disabled={uploading}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {uploading ? 'Загрузка...' : 'Загрузить аватар'}
                </Button>
              </Upload>
            </div>
            <Title level={3}>{user?.name}</Title>
            <Text type="secondary">{user?.email}</Text>
            
            {/* Отображение биографии */}
            {user?.bio && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>О себе:</Text>
                <Text>{user.bio}</Text>
              </div>
            )}
            
            {/* Отображение тематик пользователя */}
            {user?.topics && user.topics.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Тематики:</Text>
                <Space wrap>
                  {user.topics.map((topic: any) => (
                    <Tag key={topic.id} color="purple">
                      {typeof topic === 'object' ? topic.name : topic}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
            
            {/* Отображение типов консультаций */}
            {user?.consultationTypes && user.consultationTypes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Типы консультаций:</Text>
                <Space wrap>
                  {user.consultationTypes.map((type: string, index: number) => (
                    <Tag key={index} color="blue">
                      {type}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>

          {user?.userType === 'client' && (
            <>
              <Divider />
              <Card 
                style={{ 
                  background: 'linear-gradient(135deg, rgb(180, 194, 255) 0%, rgb(245, 236, 255) 100%)',
                  border: 'none',
                  borderRadius: 16
                }}
              >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Title level={3} style={{ color: '#1d1d1f', marginBottom: 16 }}>
                    🚀 Станьте экспертом прямо сейчас!
                  </Title>
                  <div style={{ marginBottom: 20 }}>
                    <Text 
                      style={{ 
                        fontSize: 24, 
                        textDecoration: 'line-through', 
                        color: '#86868b',
                        marginRight: 12
                      }}
                    >
                      3499 ₽/мес
                    </Text>
                    <div 
                      style={{ 
                        display: 'inline-block',
                        background: '#ff4d4f',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    >
                      СЕЙЧАС БЕСПЛАТНО!
                    </div>
                  </div>
                  <Paragraph style={{ fontSize: 16, color: '#1d1d1f', marginBottom: 24 }}>
                    Получите все права эксперта: создавайте статьи, добавляйте услуги, 
                    общайтесь с клиентами и зарабатывайте на своей экспертизе!
                  </Paragraph>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleBecomeExpert}
                    style={{
                      height: 48,
                      fontSize: 16,
                      fontWeight: 600,
                      background: '#1d1d1f',
                      border: 'none',
                      borderRadius: 24,
                      padding: '0 32px'
                    }}
                  >
                    Стать экспертом
                  </Button>
                </div>
              </Card>
            </>
          )}

          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              name="name"
              label="Имя"
              rules={[{ required: true, message: 'Введите имя' }]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
            >
              <Input size="large" disabled />
            </Form.Item>

            <Form.Item
              name="bio"
              label="О себе"
            >
              <TextArea rows={4} placeholder="Расскажите о себе..." />
            </Form.Item>

            <Form.Item
              name="city"
              label="Город"
            >
              <Select
                size="large"
                placeholder="Выберите город"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={cities.map(city => ({ label: city.name, value: city.name }))}
              />
            </Form.Item>

            <Divider orientation="left">
              <LinkOutlined /> Социальные сети
            </Divider>

            <Form.Item
              name="vkUrl"
              label="VK"
            >
              <Input size="large" placeholder="https://vk.com/your_profile" />
            </Form.Item>

            <Form.Item
              name="telegramUrl"
              label="Telegram"
            >
              <Input size="large" placeholder="https://t.me/your_username" />
            </Form.Item>

            <Form.Item
              name="whatsapp"
              label="WhatsApp"
            >
              <Input size="large" placeholder="+79001234567" />
            </Form.Item>

            {user?.userType === 'expert' && (
              <>
                <Divider />
                
                <Form.Item
                  name="consultationTypes"
                  label="Типы консультаций"
                >
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Выберите типы консультаций"
                    options={CONSULTATION_TYPES.map(t => ({ label: t, value: t }))}
                  />
                </Form.Item>

                <Form.Item
                  name="topics"
                  label="Тематики"
                >
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Выберите тематики"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={topics.map(t => ({ label: t.name, value: t.id }))}
                    maxTagCount="responsive"
                  />
                </Form.Item>
              </>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                Сохранить изменения
              </Button>
            </Form.Item>
          </Form>

          {user?.userType === 'expert' && (
            <>
              <Divider />
              
              {/* Галерея фотографий */}
              <div>
                <ProfileGallery userId={user.id} isOwner={true} />
              </div>
              
              <Divider />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>Мои услуги</Title>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowServiceForm(!showServiceForm)}
                  >
                    Добавить услугу
                  </Button>
                </div>

                {showServiceForm && (
                  <Card style={{ marginBottom: 16, background: '#fafafa' }}>
                    <Title level={5}>{editingService ? 'Редактировать услугу' : 'Добавить услугу'}</Title>
                    <Form
                      form={serviceForm}
                      layout="vertical"
                      onFinish={handleAddService}
                    >
                      <Form.Item
                        name="title"
                        label="Название"
                        rules={[{ required: true, message: 'Введите название услуги' }]}
                      >
                        <Input placeholder="Например: Консультация по таро" />
                      </Form.Item>

                      <Form.Item
                        name="description"
                        label="Описание"
                        rules={[{ required: true, message: 'Введите описание услуги' }]}
                      >
                        <TextArea rows={3} placeholder="Опишите вашу услугу..." />
                      </Form.Item>

                      <Space style={{ width: '100%' }} size="middle">
                        <Form.Item name="price" label="Цена (₽)">
                          <Input type="number" placeholder="3000" />
                        </Form.Item>

                        <Form.Item name="duration" label="Длительность (мин)">
                          <Input type="number" placeholder="60" />
                        </Form.Item>

                        <Form.Item
                          name="serviceType"
                          label="Тип"
                          rules={[{ required: true, message: 'Выберите тип' }]}
                        >
                          <Select style={{ width: 150 }} placeholder="Тип">
                            <Select.Option value="online">Онлайн</Select.Option>
                            <Select.Option value="offline">Офлайн</Select.Option>
                            <Select.Option value="both">Оба</Select.Option>
                          </Select>
                        </Form.Item>
                      </Space>

                      <Form.Item>
                        <Space>
                          <Button type="primary" htmlType="submit">
                            {editingService ? 'Сохранить' : 'Добавить'}
                          </Button>
                          <Button onClick={() => {
                            setShowServiceForm(false);
                            setEditingService(null);
                            serviceForm.resetFields();
                          }}>
                            Отмена
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                )}

                <List
                  dataSource={services}
                  locale={{ emptyText: 'Нет добавленных услуг' }}
                  renderItem={(service) => (
                    <List.Item
                      actions={[
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => handleEditService(service)}
                        >
                          Редактировать
                        </Button>,
                        <Popconfirm
                          title="Удалить услугу?"
                          description="Это действие нельзя отменить"
                          onConfirm={() => handleDeleteService(service.id)}
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
                            {service.title}
                            <Tag color={
                              service.service_type === 'online' ? 'blue' :
                              service.service_type === 'offline' ? 'green' : 'purple'
                            }>
                              {service.service_type === 'online' ? 'Онлайн' :
                               service.service_type === 'offline' ? 'Офлайн' : 'Оба'}
                            </Tag>
                          </Space>
                        }
                        description={
                          <>
                            <div>{service.description}</div>
                            <Space style={{ marginTop: 8 }}>
                              {service.price && <Text strong>{service.price} ₽</Text>}
                              {service.duration && <Text type="secondary">{service.duration} мин</Text>}
                            </Space>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default ProfilePage;
