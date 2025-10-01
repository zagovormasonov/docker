import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Card, message, Switch, Typography, Space, Divider, Spin } from 'antd';
import { ArrowLeftOutlined, PictureOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../api/axios';

const { Title, Text } = Typography;

const CreateArticlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    setLoadingArticle(true);
    try {
      const response = await api.get(`/articles/${id}`);
      const article = response.data;
      
      form.setFieldsValue({
        title: article.title,
        coverImage: article.cover_image || '',
        isPublished: article.is_published
      });
      setContent(article.content || '');
    } catch (error) {
      console.error('Ошибка загрузки статьи:', error);
      message.error('Ошибка загрузки статьи');
      navigate('/my-articles');
    } finally {
      setLoadingArticle(false);
    }
  };

  const onFinish = async (values: any) => {
    if (!content.trim() || content === '<p><br></p>') {
      message.error('Содержание статьи не может быть пустым');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: values.title,
        content,
        coverImage: values.coverImage || null,
        isPublished: values.isPublished !== false
      };

      if (isEdit) {
        await api.put(`/articles/${id}`, data);
        message.success('Статья успешно обновлена!');
        navigate('/my-articles');
      } else {
        const response = await api.post('/articles', data);
        message.success('Статья успешно создана!');
        navigate(`/articles/${response.data.id}`);
      }
    } catch (error: any) {
      console.error('Ошибка сохранения статьи:', error);
      const errorMsg = error.response?.data?.error || 'Ошибка сохранения статьи';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик загрузки изображений
  const imageHandler = () => {
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
  };

  const modules = {
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
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'align'
  ];

  if (loadingArticle) {
    return (
      <div className="container" style={{ maxWidth: 900, textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" tip="Загрузка статьи..." />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/my-articles')}
        >
          К моим статьям
        </Button>
      </div>

      <Card>
        <Title level={2} style={{ marginBottom: 24 }}>
          {isEdit ? 'Редактировать статью' : 'Создать статью'}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ isPublished: true }}
        >
          <Form.Item
            name="title"
            label={<Text strong>Заголовок</Text>}
            rules={[
              { required: true, message: 'Введите заголовок' },
              { min: 5, message: 'Минимум 5 символов' },
              { max: 200, message: 'Максимум 200 символов' }
            ]}
          >
            <Input 
              size="large" 
              placeholder="Введите заголовок статьи" 
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="coverImage"
            label={<Text strong>Обложка статьи (URL изображения)</Text>}
            extra="Вставьте ссылку на изображение, например: https://example.com/image.jpg"
          >
            <Input 
              size="large" 
              placeholder="https://example.com/image.jpg"
              prefix={<PictureOutlined />}
            />
          </Form.Item>

          <Form.Item 
            label={<Text strong>Содержание статьи</Text>}
            required
          >
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: 8,
              overflow: 'hidden'
            }}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Напишите вашу статью здесь..."
                style={{ 
                  minHeight: 400,
                  backgroundColor: 'white'
                }}
              />
            </div>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              Минимум 50 символов
            </Text>
          </Form.Item>

          <Form.Item
            name="isPublished"
            label={<Text strong>Статус</Text>}
            valuePropName="checked"
          >
            <Space>
              <Switch />
              <Text>Опубликовать сразу</Text>
              <Text type="secondary">(можно изменить позже)</Text>
            </Space>
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
              >
                {isEdit ? 'Сохранить изменения' : 'Создать статью'}
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/my-articles')}
              >
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateArticlePage;