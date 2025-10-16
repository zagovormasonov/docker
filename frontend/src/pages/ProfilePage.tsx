import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import ExpertBenefitsCard from '../components/ExpertBenefitsCard';

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
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceForm] = Form.useForm();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [customSocials, setCustomSocials] = useState<Array<{id: number, name: string, url: string, created_at: string}>>([]);

  useEffect(() => {
    fetchTopics();
    fetchCities();
    fetchCustomSocials();
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

  const fetchCustomSocials = async () => {
    try {
      const response = await api.get('/users/custom-socials');
      setCustomSocials(response.data);
    } catch (error) {
      console.error('Ошибка загрузки кастомных соцсетей:', error);
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

  const handleAddSocial = async () => {
    if (!newSocialName.trim() || !newSocialUrl.trim()) {
      message.error('Заполните все поля');
      return;
    }
    
    try {
      // Отправляем на сервер
      const response = await api.post('/users/custom-socials', {
        name: newSocialName.trim(),
        url: newSocialUrl.trim()
      });
      
      // Добавляем новую соцсеть в состояние
      setCustomSocials([...customSocials, response.data]);
      message.success(`Соцсеть "${newSocialName}" добавлена`);
      setNewSocialName('');
      setNewSocialUrl('');
      setShowAddSocial(false);
    } catch (error) {
      console.error('Ошибка добавления соцсети:', error);
      message.error('Ошибка добавления соцсети');
    }
  };

  const handleCancelSocial = () => {
    setNewSocialName('');
    setNewSocialUrl('');
    setShowAddSocial(false);
  };

  const handleDeleteSocial = async (socialId: number) => {
    try {
      await api.delete(`/users/custom-socials/${socialId}`);
      setCustomSocials(customSocials.filter(social => social.id !== socialId));
      message.success('Соцсеть удалена');
    } catch (error) {
      console.error('Ошибка удаления соцсети:', error);
      message.error('Ошибка удаления соцсети');
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

  const handleBecomeExpert = () => {
    navigate('/become-expert');
  };

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar
              size={100}
              src={user?.avatarUrl || '/emp.jpg'}
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
              <ExpertBenefitsCard />
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

            {/* Отображение добавленных соцсетей */}
            {customSocials.length > 0 && (
              <Form.Item label="Добавленные соцсети">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {customSocials.map((social) => (
                    <div key={social.id} style={{
                      padding: 12,
                      border: '1px solid #d9d9d9',
                      borderRadius: 6,
                      backgroundColor: '#fafafa',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Space>
                        <Text strong>{social.name}</Text>
                        <Text type="secondary">{social.url}</Text>
                      </Space>
                      <Button 
                        type="text" 
                        danger 
                        size="small"
                        onClick={() => handleDeleteSocial(social.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  ))}
                </Space>
              </Form.Item>
            )}

            {/* Кнопка добавления новой соцсети */}
            <Form.Item>
              {!showAddSocial ? (
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />}
                  style={{ 
                    width: '100%',
                    borderStyle: 'dashed',
                    borderColor: '#d9d9d9',
                    color: '#8c8c8c'
                  }}
                  onClick={() => setShowAddSocial(true)}
                >
                  Добавить соцсеть
                </Button>
              ) : (
                <div style={{ 
                  padding: 16, 
                  border: '1px dashed #d9d9d9', 
                  borderRadius: 6,
                  backgroundColor: '#fafafa'
                }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                      placeholder="Название соцсети (например: YouTube, Instagram)"
                      value={newSocialName}
                      onChange={(e) => setNewSocialName(e.target.value)}
                      size="large"
                    />
                    <Input
                      placeholder="Ссылка на профиль"
                      value={newSocialUrl}
                      onChange={(e) => setNewSocialUrl(e.target.value)}
                      size="large"
                    />
                    <Space>
                      <Button 
                        type="primary" 
                        onClick={handleAddSocial}
                        size="small"
                      >
                        Добавить
                      </Button>
                      <Button 
                        onClick={handleCancelSocial}
                        size="small"
                      >
                        Отмена
                      </Button>
                    </Space>
                  </Space>
                </div>
              )}
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
