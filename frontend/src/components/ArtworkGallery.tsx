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
}

const ArtworkGallery: React.FC<ArtworkGalleryProps> = ({ userId, isOwner }) => {
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

      setArtworks(prev => [response.data, ...prev]);
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
      
      await api.put(`/artworks/${editingArtwork.id}`, values);
      message.success('Картина обновлена!');
      setEditingArtwork(null);
      form.resetFields();
      fetchArtworks();
    } catch (error) {
      console.error('Ошибка обновления картины:', error);
      message.error('Ошибка обновления картины');
    }
  };

  const handleDelete = async (artworkId: number) => {
    try {
      await api.delete(`/artworks/${artworkId}`);
      setArtworks(prev => prev.filter(art => art.id !== artworkId));
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
        <div class="artwork-card-chat" data-user-id="${artwork.user_id}" data-artwork-id="${artwork.id}" style="border: 1px solid #d9d9d9; border-radius: 8px; overflow: hidden; background: white; max-width: 350px; margin: 4px 0; box-shadow: 0 1px 4px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; text-align: left;" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 1px 4px rgba(0,0,0,0.1)';">
          <div style="height: 120px; overflow: hidden; background: #f5f5f5;">
            <img src="${artwork.image_url}" alt="${escapedTitle}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="padding: 8px 12px; text-align: left;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 30px; color: #1d1d1f; line-height: 1.3; text-align: left;">
              ${escapedTitle}
            </div>
            ${escapedDescription ? `<div style="font-size: 12px; color: #666; margin-bottom: 30px; line-height: 1.4; text-align: left; max-height: 36px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${escapedDescription.length > 80 ? escapedDescription.substring(0, 80) + '...' : escapedDescription}</div>` : ''}
            ${artwork.price ? `<div style="font-weight: 600; font-size: 16px; color: #1d1d1f; margin-top: 30px; text-align: left;">${artwork.price} ₽</div>` : ''}
            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #f0f0f0; font-size: 11px; color: #8c8c8c; text-align: left;">
              🖼️ Хочу купить это
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
        <Row gutter={[16, 16]}>
          {artworks.map((artwork) => (
            <Col key={artwork.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 200, overflow: 'hidden', cursor: 'pointer' }}>
                    <Image
                      src={artwork.image_url}
                      alt={artwork.title || 'Картина'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      preview={false}
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
                          onClick={() => {
                            setEditingArtwork(artwork);
                            setShowAddForm(false);
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
                          <Button type="text" danger icon={<DeleteOutlined />}>
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
                <Card.Meta
                  title={artwork.title || 'Без названия'}
                  description={
                    <>
                      {artwork.description && (
                        <div style={{ marginBottom: 8, fontSize: 12 }}>
                          {artwork.description.length > 100
                            ? `${artwork.description.substring(0, 100)}...`
                            : artwork.description}
                        </div>
                      )}
                      {artwork.price && (
                        <Text strong style={{ fontSize: 16 }}>
                          {artwork.price} ₽
                        </Text>
                      )}
                    </>
                  }
                />
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
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default ArtworkGallery;
