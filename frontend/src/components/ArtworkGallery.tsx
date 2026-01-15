import React, { useState, useEffect } from 'react';
import {
  Card,
  Upload,
  Button,
  Image,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Typography,
  Popconfirm,
  Row,
  Col,
  Spin
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Artwork {
  id: number;
  user_id: number;
  image_url: string;
  title?: string;
  description?: string;
  price?: number;
  created_at: string;
}

interface ArtworkGalleryProps {
  userId: number;
  isOwner: boolean;
  onItemsCountChange?: (count: number) => void;
}

const ArtworkGallery: React.FC<ArtworkGalleryProps> = ({ userId, isOwner, onItemsCountChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [form] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    fetchArtworks();
  }, [userId]);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const endpoint = isOwner ? '/artworks' : `/artworks/user/${userId}`;
      const response = await api.get(endpoint);
      setArtworks(response.data);
      if (onItemsCountChange) {
        onItemsCountChange(response.data.length);
      }
    } catch (error) {
      console.error('Ошибка загрузки картин:', error);
      message.error('Ошибка загрузки картин');
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');

      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setUploadFile(file);
    return false; // Предотвращаем автоматическую загрузку
  };

  const handleAddArtwork = async (values: any) => {
    if (!uploadFile) {
      message.error('Выберите изображение');
      return;
    }

    setUploading(true);
    try {
      const compressedFile = await compressImage(uploadFile);
      const formData = new FormData();
      formData.append('image', compressedFile);
      formData.append('title', values.title || '');
      formData.append('description', values.description || '');
      formData.append('price', values.price ? values.price.toString() : '');

      const response = await api.post('/artworks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setArtworks(prev => {
        const newArtworks = [response.data, ...prev];
        if (onItemsCountChange) {
          onItemsCountChange(newArtworks.length);
        }
        return newArtworks;
      });
      message.success('Картина добавлена!');
      form.resetFields();
      setUploadFile(null);
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      message.error(error.response?.data?.error || 'Ошибка загрузки картины');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      if (!editingArtwork) return;

      setUploading(true);
      const formData = new FormData();
      if (uploadFile) {
        const compressedFile = await compressImage(uploadFile);
        formData.append('image', compressedFile);
      }
      formData.append('title', values.title || '');
      formData.append('description', values.description || '');
      formData.append('price', values.price ? values.price.toString() : '');

      await api.put(`/artworks/${editingArtwork.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Картина обновлена!');
      setEditingArtwork(null);
      setUploadFile(null);
      form.resetFields();
      fetchArtworks();
    } catch (error: any) {
      console.error('Ошибка обновления картины:', error);
      message.error(error.response?.data?.error || 'Ошибка обновления картины');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (artworkId: number) => {
    try {
      await api.delete(`/artworks/${artworkId}`);
      setArtworks(prev => {
        const newArtworks = prev.filter(art => art.id !== artworkId);
        if (onItemsCountChange) {
          onItemsCountChange(newArtworks.length);
        }
        return newArtworks;
      });
      message.success('Картина удалена');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      message.error('Ошибка удаления картины');
    }
  };

  const handleBuy = async (artwork: Artwork) => {
    if (!user) {
      message.warning('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    try {
      // Создаем или находим чат с владельцем картины
      const response = await api.post('/chats/create', { otherUserId: artwork.user_id });
      const chatId = response.data.id;

      // Создаем HTML-сообщение с карточкой товара (компактная версия)
      const escapedTitle = (artwork.title || 'Картина').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const escapedDescription = artwork.description ? artwork.description.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
      const artworkCardHtml = `
        <div class="artwork-card-chat" data-user-id="${artwork.user_id}" data-artwork-id="${artwork.id}" style="all: initial; display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: white; max-width: 340px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin: 4px 0; text-align: left !important;">
          <div style="display: block; width: 100%; height: 160px; overflow: hidden; background: #f3f4f6; margin: 0; padding: 0;">
            <img src="${artwork.image_url}" alt="${escapedTitle}" style="display: block; width: 100%; height: 100%; object-fit: cover; margin: 0; padding: 0; border: none;" />
          </div>
          <div style="display: block; padding: 12px 16px; text-align: left !important; background: white;">
            <h3 style="display: block; margin: 0 0 4px 0 !important; font-weight: 600; font-size: 16px; color: #111827; line-height: 1.3; text-align: left !important; padding: 0;">
              ${escapedTitle}
            </h3>
            ${escapedDescription ? `<p style="display: block; margin: 0 0 8px 0 !important; font-size: 14px; color: #4b5563; line-height: 1.4; text-align: left !important; padding: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${escapedDescription}</p>` : ''}
            ${artwork.price ? `<div style="display: block; margin: 0 0 12px 0 !important; font-weight: 700; font-size: 18px; color: #000000; text-align: left !important; padding: 0;">${artwork.price} ₽</div>` : ''}
            <div style="display: flex; align-items: center; gap: 8px; margin: 0 !important; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: left !important;">
              <span style="font-size: 14px;">🖼️</span> <span>Хочу купить эту картину</span>
            </div>
          </div>
        </div>
      `;

      await api.post(`/chats/${chatId}/messages`, {
        content: artworkCardHtml
      });

      // Переходим в чат
      navigate(`/chats/${chatId}`);
      message.success('Сообщение о покупке отправлено в чат!');
    } catch (error) {
      console.error('Ошибка покупки картины:', error);
      message.error('Ошибка покупки картины');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Галерея картин
        </Title>
        {isOwner && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingArtwork(null);
              form.resetFields();
            }}
          >
            Добавить картину
          </Button>
        )}
      </div>

      {isOwner && showAddForm && !editingArtwork && (
        <Card style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical" onFinish={handleAddArtwork}>
            <Form.Item name="title" label="Название">
              <Input placeholder="Название картины" />
            </Form.Item>
            <Form.Item name="description" label="Описание">
              <TextArea rows={3} placeholder="Описание картины" />
            </Form.Item>
            <Form.Item name="price" label="Цена (₽)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Цена" />
            </Form.Item>
            <Form.Item label="Изображение" required>
              <Upload
                accept="image/*"
                showUploadList={true}
                beforeUpload={handleFileSelect}
                fileList={uploadFile ? [{
                  uid: '-1',
                  name: uploadFile.name,
                  status: 'done',
                }] : []}
                onRemove={() => {
                  setUploadFile(null);
                  return true;
                }}
              >
                <Button icon={<PlusOutlined />}>
                  Выбрать изображение
                </Button>
              </Upload>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={uploading}>
                  {uploading ? 'Загрузка...' : 'Добавить картину'}
                </Button>
                <Button onClick={() => {
                  setShowAddForm(false);
                  form.resetFields();
                  setUploadFile(null);
                }}>
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {artworks.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">
            {isOwner ? 'Добавьте картины в галерею' : 'В галерее пока нет картин'}
          </Text>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {artworks.map((artwork) => (
            <Col key={artwork.id} xs={24} sm={12}>
              <Card
                id={`artwork-${artwork.id}`}
                hoverable
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                cover={
                  <div style={{ height: 250, overflow: 'hidden', cursor: 'pointer' }}>
                    <img
                      src={artwork.image_url}
                      alt={artwork.title || 'Картина'}
                      style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }}
                      onClick={() => {
                        setPreviewImage(artwork.image_url);
                        setPreviewVisible(true);
                      }}
                    />
                  </div>
                }
                actions={
                  isOwner
                    ? [
                      <Button
                        key="edit"
                        type="text"
                        icon={<EditOutlined />}
                        style={{ padding: '0 8px' }}
                        onClick={() => {
                          setEditingArtwork(artwork);
                          setShowAddForm(false);
                          setUploadFile(null);
                          form.setFieldsValue({
                            title: artwork.title,
                            description: artwork.description,
                            price: artwork.price
                          });
                        }}
                      >
                        Редактировать
                      </Button>,
                      <Popconfirm
                        key="delete"
                        title="Удалить картину?"
                        description="Это действие нельзя отменить"
                        onConfirm={() => handleDelete(artwork.id)}
                        okText="Да"
                        cancelText="Нет"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} style={{ padding: '0 8px' }}>
                          Удалить
                        </Button>
                      </Popconfirm>
                    ]
                    : artwork.price
                      ? [
                        <Button
                          key="buy"
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => handleBuy(artwork)}
                          block
                        >
                          Купить {artwork.price} ₽
                        </Button>
                      ]
                      : undefined
                }
              >
                <div style={{ flex: 1 }}>
                  <Card.Meta
                    title={
                      <Typography.Text strong style={{ fontSize: 16 }} ellipsis={{ tooltip: artwork.title }}>
                        {artwork.title || 'Без названия'}
                      </Typography.Text>
                    }
                    description={
                      <div style={{ height: 80, overflow: 'hidden' }}>
                        {artwork.description && (
                          <Typography.Paragraph
                            ellipsis={{ rows: 2, tooltip: artwork.description }}
                            style={{ fontSize: 13, color: '#666', marginBottom: 8 }}
                          >
                            {artwork.description}
                          </Typography.Paragraph>
                        )}
                        {artwork.price && (
                          <Typography.Text type="danger" strong style={{ fontSize: 16 }}>
                            {artwork.price} ₽
                          </Typography.Text>
                        )}
                      </div>
                    }
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        open={previewVisible}
        title="Просмотр картины"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        afterClose={() => {
          setPreviewVisible(false);
          setPreviewImage('');
          document.body.style.overflow = 'auto';
        }}
        destroyOnClose={true}
        maskClosable={true}
        width="90%"
        style={{ top: 20 }}
      >
        <img
          alt="Превью"
          style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          src={previewImage}
        />
      </Modal>

      {isOwner && editingArtwork && (
        <Modal
          title="Редактировать картину"
          open={!!editingArtwork}
          onOk={() => form.submit()}
          onCancel={() => {
            setEditingArtwork(null);
            form.resetFields();
          }}
          okText="Сохранить"
          cancelText="Отмена"
        >
          <Form form={form} layout="vertical" onFinish={handleUpdate}>
            <Form.Item name="title" label="Название">
              <Input placeholder="Название картины" />
            </Form.Item>
            <Form.Item name="description" label="Описание">
              <TextArea rows={3} placeholder="Описание картины" />
            </Form.Item>
            <Form.Item name="price" label="Цена (₽)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Цена" />
            </Form.Item>
            <Form.Item label="Изменить изображение">
              <Upload
                accept="image/*"
                showUploadList={true}
                beforeUpload={handleFileSelect}
                fileList={uploadFile ? [{
                  uid: '-1',
                  name: uploadFile.name,
                  status: 'done',
                }] : []}
                onRemove={() => {
                  setUploadFile(null);
                  return true;
                }}
              >
                <Button icon={<PlusOutlined />}>
                  Выбрать новое изображение
                </Button>
              </Upload>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Оставьте пустым, чтобы сохранить текущее изображение
              </Text>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default ArtworkGallery;
