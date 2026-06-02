import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, message, Typography, Select, DatePicker, Switch, AutoComplete,
  Upload, Space, Image
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, LinkOutlined,
  UploadOutlined, DeleteOutlined, PictureOutlined
} from '@ant-design/icons';
import { RussianRuble } from 'lucide-react';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { marked } from 'marked';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import EventMap, { getYandexAddressSuggestions } from '../components/EventMap';
import { EVENT_TYPES } from './EventsPage';

const { Title, Text } = Typography;

marked.setOptions({
  breaks: true
});

const MARKDOWN_PATTERNS = [
  /\*\*(.*?)\*\*/,
  /__(.*?)__/,
  /`{1,3}[^`]+`{1,3}/,
  /^>{1,}\s/m,
  /^#{1,6}\s/m,
  /^\s*[-*+]\s+/m,
  /\[(.*?)\]\((.*?)\)/,
  /!\[(.*?)\]\((.*?)\)/
];

const looksLikeMarkdown = (text: string) => MARKDOWN_PATTERNS.some((pattern) => pattern.test(text));

interface City {
  id: number;
  name: string;
}

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

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
  const [description, setDescription] = useState('');
  const [addressOptions, setAddressOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [addressSuggestLoading, setAddressSuggestLoading] = useState(false);
  const [selectedMapAddress, setSelectedMapAddress] = useState('');
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (user?.userType !== 'expert' && user?.userType !== 'admin') {
      message.error('Только эксперты и администраторы могут создавать события');
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
      setDescription(event.description || '');
      setSelectedMapAddress(event.location || '');

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
    if (!description.trim() || description === '<p><br></p>') {
      message.error('Описание события не может быть пустым');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        title: stripHtml(values.title),
        description,
        coverImage: coverImageUrl || values.coverImage,
        eventType: values.eventType,
        isOnline: values.isOnline,
        cityId: values.isOnline ? null : values.cityId,
        eventDate: values.eventDate.toISOString(),
        location: values.location,
        price: values.price,
        registrationLink: values.registrationLink
      };

      console.log('📝 Отправляем данные события:', eventData);

      if (id) {
        console.log('📝 Обновляем событие:', id);
        const response = await api.put(`/events/${id}`, eventData);

        // Показываем уведомление в зависимости от ответа сервера
        if (response.data.message) {
          message.success(response.data.message);
        } else {
          message.success('Событие обновлено');
        }
      } else {
        console.log('📝 Создаем новое событие');
        const response = await api.post('/events', eventData);

        if (response.data.message) {
          message.success(response.data.message);
        } else {
          message.success('Событие опубликовано');
        }
      }

      navigate('/events');
    } catch (error: any) {
      console.error('❌ Ошибка создания события:', error);
      console.error('❌ Детали ошибки:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
          const hide = message.loading('Загрузка изображения...', 0);
          const response = await api.post('/upload/image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          hide();

          const imageUrl = response.data.url;
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', imageUrl);
            quill.setSelection(range.index + 1, 0);
          }
          message.success('Изображение загружено!');
        } catch (error) {
          console.error('Ошибка загрузки изображения:', error);
          message.error('Ошибка загрузки изображения');
        }
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link', 'image'],
        [{ align: [] }],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'align'
  ], []);

  useEffect(() => {
    const quillInstance = quillRef.current?.getEditor();
    const quillRoot = quillInstance?.root;

    if (!quillInstance || !quillRoot) {
      return;
    }

    const handleMarkdownPaste = (event: ClipboardEvent) => {
      const plainText = event.clipboardData?.getData('text/plain');

      if (!plainText || !looksLikeMarkdown(plainText)) {
        return;
      }

      const htmlFromMarkdown = marked.parse(plainText);

      if (typeof htmlFromMarkdown !== 'string') {
        return;
      }

      const normalizedHtml = htmlFromMarkdown.trim();

      if (!normalizedHtml) {
        return;
      }

      event.preventDefault();

      const selection = quillInstance.getSelection(true);
      const insertIndex = selection ? selection.index : quillInstance.getLength();

      if (selection?.length) {
        quillInstance.deleteText(selection.index, selection.length, 'user');
      }

      quillInstance.clipboard.dangerouslyPasteHTML(insertIndex, normalizedHtml, 'user');
    };

    quillRoot.addEventListener('paste', handleMarkdownPaste);

    return () => {
      quillRoot.removeEventListener('paste', handleMarkdownPaste);
    };
  }, []);

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    form.setFieldValue('description', value);
  };

  useEffect(() => {
    if (!id) {
      form.setFieldValue('description', '');
    }
  }, [form, id]);

  const watchedTitle = Form.useWatch('title', form);
  const watchedLocation = Form.useWatch('location', form);
  const watchedCityId = Form.useWatch('cityId', form);
  const selectedCityName = useMemo(
    () => cities.find((city) => city.id === watchedCityId)?.name || '',
    [cities, watchedCityId]
  );
  const normalizedLocation = typeof watchedLocation === 'string' ? watchedLocation.trim() : '';
  const addressForMap = selectedMapAddress.trim();
  const shouldShowMapPreview = !isOnline && Boolean(selectedCityName) && addressForMap.length >= 3;

  useEffect(() => {
    if (isOnline || !selectedCityName || normalizedLocation.length < 2) {
      setAddressOptions([]);
      return;
    }

    let cancelled = false;
    const query = normalizedLocation.toLowerCase().includes(selectedCityName.toLowerCase())
      ? normalizedLocation
      : `${selectedCityName}, ${normalizedLocation}`;

    const timer = window.setTimeout(async () => {
      try {
        setAddressSuggestLoading(true);
        const suggestions = await getYandexAddressSuggestions(query);

        if (cancelled) return;

        setAddressOptions(suggestions.map((suggestion) => ({
          value: suggestion.value || suggestion.displayName,
          label: suggestion.displayName || suggestion.value,
        })));
      } catch (error) {
        console.warn('Yandex address suggest error:', error);
        if (!cancelled) {
          setAddressOptions([]);
        }
      } finally {
        if (!cancelled) {
          setAddressSuggestLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOnline, normalizedLocation, selectedCityName]);

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
            rules={[{ required: true, message: 'Введите описание' }]}
          >
            <div style={{
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              overflow: 'hidden'
            }}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={description}
                onChange={handleDescriptionChange}
                modules={modules}
                formats={formats}
                placeholder="Подробное описание события..."
                style={{
                  minHeight: 300,
                  backgroundColor: 'white'
                }}
              />
            </div>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              Поддерживается форматирование, списки и изображения
            </Text>
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
                  form.setFieldsValue({ cityId: null, location: '' });
                  setSelectedMapAddress('');
                  setAddressOptions([]);
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
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                onChange={() => {
                  setSelectedMapAddress('');
                  setAddressOptions([]);
                  form.setFieldValue('location', '');
                }}
                options={cities.map(city => ({
                  value: city.id,
                  label: city.name
                }))}
              />
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
            {isOnline ? (
              <Input
                size="large"
                placeholder="Ссылка на платформу (Zoom, etc.)"
                prefix={<EnvironmentOutlined />}
              />
            ) : (
              <AutoComplete
                size="large"
                options={addressOptions}
                notFoundContent={addressSuggestLoading ? 'Загрузка адресов...' : 'Начните вводить адрес'}
                onChange={(value) => {
                  if (!addressOptions.some((option) => option.value === value)) {
                    setSelectedMapAddress('');
                  }
                }}
                onSelect={(value) => {
                  setSelectedMapAddress(value);
                }}
              >
                <Input
                  size="large"
                  placeholder="Начните вводить адрес и выберите вариант из списка"
                  prefix={<EnvironmentOutlined />}
                />
              </AutoComplete>
            )}
          </Form.Item>

          {shouldShowMapPreview && (
            <div style={{ marginTop: -8, marginBottom: 24 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                Метка на Яндекс.Карте обновляется по выбранному городу и адресу
              </Text>
              <EventMap
                location={addressForMap}
                cityName={selectedCityName}
                eventTitle={typeof watchedTitle === 'string' && watchedTitle.trim() ? watchedTitle : 'Место проведения'}
              />
            </div>
          )}

          <Form.Item
            label={<Text strong>Стоимость</Text>}
            name="price"
          >
            <Input
              size="large"
              placeholder="Например: 5000 ₽ или Бесплатно"
              prefix={<RussianRuble size={14} />}
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
