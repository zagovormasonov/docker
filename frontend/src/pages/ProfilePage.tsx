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
  List
} from 'antd';
import { UserOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Topic {
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

// Список городов РФ (сокращенный)
const CITIES = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
  'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
  'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград', 'Краснодар',
  'Саратов', 'Тюмень', 'Тольятти', 'Ижевск'
];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form] = Form.useForm();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceForm] = Form.useForm();
  const [showServiceForm, setShowServiceForm] = useState(false);

  useEffect(() => {
    fetchTopics();
    if (user?.userType === 'expert') {
      fetchServices();
    }
    
    form.setFieldsValue({
      name: user?.name,
      email: user?.email,
      bio: user?.bio,
      city: user?.city,
      topics: user?.topics?.map((t: any) => t.id) || []
    });
  }, [user]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Ошибка загрузки тематик:', error);
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
        topics: values.topics
      });
      
      updateUser(values);
      message.success('Профиль обновлен');
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      message.error('Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (values: any) => {
    try {
      await api.post('/experts/services', values);
      message.success('Услуга добавлена');
      serviceForm.resetFields();
      setShowServiceForm(false);
      fetchServices();
    } catch (error) {
      console.error('Ошибка добавления услуги:', error);
      message.error('Ошибка добавления услуги');
    }
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
                options={CITIES.map(city => ({ label: city, value: city }))}
              />
            </Form.Item>

            {user?.userType === 'expert' && (
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
                    <Form
                      form={serviceForm}
                      layout="vertical"
                      onFinish={handleAddService}
                    >
                      <Form.Item
                        name="title"
                        label="Название"
                        rules={[{ required: true }]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        name="description"
                        label="Описание"
                        rules={[{ required: true }]}
                      >
                        <TextArea rows={3} />
                      </Form.Item>

                      <Space style={{ width: '100%' }} size="middle">
                        <Form.Item name="price" label="Цена (₽)">
                          <Input type="number" />
                        </Form.Item>

                        <Form.Item name="duration" label="Длительность (мин)">
                          <Input type="number" />
                        </Form.Item>

                        <Form.Item
                          name="serviceType"
                          label="Тип"
                          rules={[{ required: true }]}
                        >
                          <Select style={{ width: 150 }}>
                            <Select.Option value="online">Онлайн</Select.Option>
                            <Select.Option value="offline">Офлайн</Select.Option>
                            <Select.Option value="both">Оба</Select.Option>
                          </Select>
                        </Form.Item>
                      </Space>

                      <Form.Item>
                        <Space>
                          <Button type="primary" htmlType="submit">
                            Добавить
                          </Button>
                          <Button onClick={() => setShowServiceForm(false)}>
                            Отмена
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                )}

                <List
                  dataSource={services}
                  renderItem={(service) => (
                    <List.Item
                      actions={[
                        <Button
                          danger
                          onClick={() => handleDeleteService(service.id)}
                        >
                          Удалить
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={service.title}
                        description={service.description}
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
