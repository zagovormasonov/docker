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

const { Title, Text } = Typography;
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
        instagramUrl: user.instagramUrl,
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
      const endpoint = user?.userType === 'expert' ? '/experts/profile' : '/users/profile';
      await api.put(endpoint, {
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
      
      updateUser(values);
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
            <Title level={3}>{user?.name}</Title>
            <Text type="secondary">{user?.email}</Text>
          </div>

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
              name="instagramUrl"
              label="Instagram"
            >
              <Input size="large" placeholder="https://instagram.com/your_profile" />
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
                    options={topics.map(t => ({ label: t.name, value: t.id }))}
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
