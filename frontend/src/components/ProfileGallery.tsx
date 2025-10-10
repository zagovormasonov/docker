import React, { useState, useEffect } from 'react';
import {
  Card,
  Upload,
  Button,
  Image,
  Modal,
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
  EyeOutlined,
  UploadOutlined
} from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;

interface GalleryImage {
  id: number;
  image_url: string;
  image_name: string;
  image_size: number;
  created_at: string;
}

interface ProfileGalleryProps {
  userId: number;
  isOwner: boolean;
}

const ProfileGallery: React.FC<ProfileGalleryProps> = ({ userId, isOwner }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [imageCount, setImageCount] = useState(0);

  useEffect(() => {
    fetchGallery();
  }, [userId]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gallery');
      setImages(response.data);
      setImageCount(response.data.length);
    } catch (error) {
      console.error('Ошибка загрузки галереи:', error);
      message.error('Ошибка загрузки галереи');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (imageCount >= 20) {
      message.error('Максимальное количество фотографий: 20');
      return false;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/gallery/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImages(prev => [response.data, ...prev]);
      setImageCount(prev => prev + 1);
      message.success('Фотография загружена!');
    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      message.error(error.response?.data?.error || 'Ошибка загрузки фотографии');
    } finally {
      setUploading(false);
    }
    return false; // Предотвращаем автоматическую загрузку
  };

  const handleDelete = async (imageId: number) => {
    try {
      await api.delete(`/gallery/${imageId}`);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setImageCount(prev => prev - 1);
      message.success('Фотография удалена');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      message.error('Ошибка удаления фотографии');
    }
  };

  const handlePreview = (image: GalleryImage) => {
    setPreviewImage(image.image_url);
    setPreviewTitle(image.image_name);
    setPreviewVisible(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          Галерея фотографий ({imageCount}/20)
        </Title>
        {isOwner && (
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleUpload}
            disabled={uploading || imageCount >= 20}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={uploading}
              disabled={imageCount >= 20}
            >
              {uploading ? 'Загрузка...' : 'Добавить фото'}
            </Button>
          </Upload>
        )}
      </div>

      {imageCount >= 20 && isOwner && (
        <div style={{ 
          background: '#fff7e6', 
          border: '1px solid #ffd591', 
          borderRadius: 6, 
          padding: 12, 
          marginBottom: 16 
        }}>
          <Text type="warning">
            Достигнуто максимальное количество фотографий (20). Удалите некоторые фотографии, чтобы добавить новые.
          </Text>
        </div>
      )}

      {images.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">
            {isOwner ? 'Добавьте фотографии в галерею' : 'В галерее пока нет фотографий'}
          </Text>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {images.map((image) => (
            <Col xs={12} sm={8} md={6} lg={4} key={image.id}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 150, overflow: 'hidden' }}>
                    <Image
                      src={image.image_url}
                      alt={image.image_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      preview={false}
                      onClick={() => handlePreview(image)}
                    />
                  </div>
                }
                actions={isOwner ? [
                  <Button
                    key="view"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(image)}
                  />,
                  <Popconfirm
                    key="delete"
                    title="Удалить фотографию?"
                    description="Это действие нельзя отменить"
                    onConfirm={() => handleDelete(image.id)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                ] : [
                  <Button
                    key="view"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(image)}
                  />
                ]}
                bodyStyle={{ padding: 12 }}
              >
                <div style={{ textAlign: 'center' }}>
                  <Text ellipsis style={{ fontSize: 12, display: 'block' }}>
                    {image.image_name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>
                    {formatFileSize(image.image_size)}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ top: 20 }}
      >
        <img
          alt={previewTitle}
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default ProfileGallery;
