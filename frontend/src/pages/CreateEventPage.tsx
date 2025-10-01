import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, message, Typography, Select, DatePicker, Switch,
  Upload, Space, Image
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, DollarOutlined, LinkOutlined,
  UploadOutlined, DeleteOutlined, PictureOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { EVENT_TYPES } from './EventsPage';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface City {
  id: number;
  name: string;
}

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (user?.userType !== 'expert') {
      message.error('Только эксперты могут создавать события');
      navigate('/events');
      return;
    }

    fetchCities();
    if (id) {
      fetchEvent();
    }
  }, [id, user, navigate]);

  const fetchCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      const event = response.data;

      setIsOnline(event.is_online);
      setCoverImageUrl(event.cover_image || '');

      form.setFieldsValue({
        title: event.title,
        description: event.description,
        coverImage: event.cover_image,
        eventType: event.event_type,
        isOnline: event.is_online,
        cityId: event.city_id,
        eventDate: event.event_date ? dayjs(event.event_date) : null,
        location: event.location,
        price: event.price,
        registrationLink: event.registration_link
      });
    } catch (error: any) {
      message.error('Ошибка загрузки события');
      navigate('/events');
    }
  };

  const handleCoverUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingCover(true);
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imageUrl = response.data.url;
      setCoverImageUrl(imageUrl);
      form.setFieldsValue({ coverImage: imageUrl });
      message.success('Обложка загружена');
    } catch (error: any) {
      console.error('Ошибка загрузки обложки:', error);
      message.error(error.response?.data?.error || 'Ошибка загрузки обложки');
    } finally {
      setUploadingCover(false);
    }

    return false; // Предотвращаем автоматическую загрузку
  };

  const handleRemoveCover = () => {
    setCoverImageUrl('');
    form.setFieldsValue({ coverImage: '' });
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const eventData = {
        title: values.title,
        description: values.description,
        coverImage: coverImageUrl || values.coverImage,
        eventType: values.eventType,
        isOnline: values.isOnline,
        cityId: values.isOnline ? null : values.cityId,
        eventDate: values.eventDate.toISOString(),
        location: values.location,
        price: values.price,
        registrationLink: values.registrationLink
      };

      if (id) {
        await api.put(`/events/${id}`, eventData);
        message.success('Событие обновлено');
      } else {
        await api.post('/events', eventData);
        message.success('Событие создано');
      }

      navigate('/events');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка сохранения события');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/events/${id}`);
      message.success('Событие удалено');
      navigate('/events');
    } catch (error: any) {
      message.error('Ошибка удаления события');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={2}>{id ? 'Редактировать событие' : 'Создать событие'}</Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ isOnline: false }}
        >
          <Form.Item
            label={<Text strong>Название события</Text>}
            name="title"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input size="large" placeholder="Например: Йога-ретрит в горах" />
          </Form.Item>

          <Form.Item
            label={<Text strong>Описание</Text>}
            name="description"
          >
            <TextArea
              rows={6}
              placeholder="Подробное описание события..."
            />
          </Form.Item>

          <Form.Item label={<Text strong>Обложка события</Text>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {coverImageUrl && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Image
                    src={coverImageUrl}
                    alt="Обложка"
                    style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveCover}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    Удалить
                  </Button>
                </div>
              )}

              {!coverImageUrl && (
                <>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleCoverUpload}
                    disabled={uploadingCover}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploadingCover}
                      size="large"
                    >
                      {uploadingCover ? 'Загрузка...' : 'Загрузить обложку'}
                    </Button>
                  </Upload>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    или введите URL изображения:
                  </Text>
                  <Form.Item name="coverImage" noStyle>
                    <Input
                      size="large"
                      placeholder="https://example.com/image.jpg"
                      prefix={<PictureOutlined />}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                    />
                  </Form.Item>
                </>
              )}
            </Space>
          </Form.Item>

          <Form.Item
            label={<Text strong>Тип мероприятия</Text>}
            name="eventType"
            rules={[{ required: true, message: 'Выберите тип' }]}
          >
            <Select size="large" placeholder="Выберите тип">
              {EVENT_TYPES.map(type => (
                <Select.Option key={type} value={type}>{type}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<Text strong>Формат проведения</Text>}
            name="isOnline"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Онлайн"
              unCheckedChildren="Офлайн"
              onChange={(checked) => {
                setIsOnline(checked);
                if (checked) {
                  form.setFieldsValue({ cityId: null });
                }
              }}
            />
          </Form.Item>

          {!isOnline && (
            <Form.Item
              label={<Text strong>Город</Text>}
              name="cityId"
              rules={[{ required: !isOnline, message: 'Выберите город' }]}
            >
              <Select
                size="large"
                placeholder="Выберите город"
                showSearch
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                }
                prefix={<EnvironmentOutlined />}
              >
                {cities.map(city => (
                  <Select.Option key={city.id} value={city.id}>
                    {city.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label={<Text strong>Дата и время</Text>}
            name="eventDate"
            rules={[{ required: true, message: 'Выберите дату' }]}
          >
            <DatePicker
              size="large"
              showTime
              format="DD.MM.YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Выберите дату и время"
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong>Место проведения</Text>}
            name="location"
          >
            <Input
              size="large"
              placeholder={isOnline ? "Ссылка на платформу (Zoom, etc.)" : "Адрес проведения"}
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong>Стоимость</Text>}
            name="price"
          >
            <Input
              size="large"
              placeholder="Например: 5000 ₽ или Бесплатно"
              prefix={<DollarOutlined />}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong>Ссылка на регистрацию</Text>}
            name="registrationLink"
          >
            <Input
              size="large"
              placeholder="https://..."
              prefix={<LinkOutlined />}
            />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Button size="large" onClick={() => navigate('/events')}>
                Отмена
              </Button>
              {id && (
                <Button size="large" danger onClick={handleDelete}>
                  Удалить
                </Button>
              )}
            </Space>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              {id ? 'Сохранить' : 'Создать событие'}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default CreateEventPage;

