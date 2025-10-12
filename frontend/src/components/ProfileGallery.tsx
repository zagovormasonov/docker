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
  Spin,
  Carousel
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  LeftOutlined,
  RightOutlined
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageCount, setImageCount] = useState(0);

  console.log('🖼️ ProfileGallery props:', { userId, isOwner });

  useEffect(() => {
    fetchGallery();
  }, [userId, isOwner]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      // Если это владелец профиля, используем защищенный эндпоинт
      // Если это другой пользователь, используем публичный эндпоинт
      const endpoint = isOwner ? '/gallery' : `/gallery/user/${userId}`;
      console.log('📸 Загружаем галерею с эндпоинта:', endpoint);
      
      const response = await api.get(endpoint);
      setImages(response.data);
      setImageCount(response.data.length);
    } catch (error) {
      console.error('Ошибка загрузки галереи:', error);
      message.error('Ошибка загрузки галереи');
    } finally {
      setLoading(false);
    }
  };

  // Функция сжатия изображения
  const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');

      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
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

        // Рисуем сжатое изображение
        ctx?.drawImage(img, 0, 0, width, height);

        // Конвертируем в blob
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

  const handleUpload = async (file: File) => {
    if (imageCount >= 20) {
      message.error('Максимальное количество фотографий: 20');
      return false;
    }

    setUploading(true);
    try {
      console.log('📸 Исходный размер файла:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Сжимаем изображение
      const compressedFile = await compressImage(file);
      console.log('📸 Сжатый размер файла:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      const formData = new FormData();
      formData.append('image', compressedFile);

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
    const index = images.findIndex(img => img.id === image.id);
    setCurrentImageIndex(index);
    setPreviewImage(image.image_url);
    setPreviewTitle('Фотография'); // Упрощенное название
    setPreviewVisible(true);
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      setPreviewImage(images[newIndex].image_url);
      setPreviewTitle('Фотография');
    }
  };

  const handleNext = () => {
    if (currentImageIndex < images.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      setPreviewImage(images[newIndex].image_url);
      setPreviewTitle('Фотография');
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
        <>
          {/* Карусель для листания */}
          <div style={{ position: 'relative' }}>
            <Carousel
              dots={true}
              infinite={true}
              speed={500}
              slidesToShow={Math.min(4, images.length)}
              slidesToScroll={1}
              arrows={true}
              prevArrow={<div className="custom-prev-arrow">‹</div>}
              nextArrow={<div className="custom-next-arrow">›</div>}
              responsive={[
                {
                  breakpoint: 1200,
                  settings: {
                    slidesToShow: 3,
                    arrows: true,
                  }
                },
                {
                  breakpoint: 768,
                  settings: {
                    slidesToShow: 2,
                    arrows: true,
                  }
                },
                {
                  breakpoint: 480,
                  settings: {
                    slidesToShow: 1,
                    arrows: true,
                  }
                }
              ]}
              style={{ marginBottom: 16 }}
            >
            {images.map((image) => (
              <div key={image.id} style={{ padding: '0 8px' }}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: 200, overflow: 'hidden' }}>
                      <Image
                        src={image.image_url}
                        alt={image.image_name}
                        style={{ width: '100%', height: 200, objectFit: 'cover' }}
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
                  bodyStyle={{ padding: 0 }}
                >
                </Card>
              </div>
            ))}
            </Carousel>
          </div>
        </>
      )}

      <Modal
        open={previewVisible}
        title={`${previewTitle} (${currentImageIndex + 1} из ${images.length})`}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ top: 20 }}
      >
        <div style={{ position: 'relative' }}>
          <img
            alt={previewTitle}
            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            src={previewImage}
          />
          
          {/* Кнопки навигации */}
          {images.length > 1 && (
            <>
              <Button
                type="primary"
                shape="circle"
                icon={<LeftOutlined />}
                onClick={handlePrevious}
                disabled={currentImageIndex === 0}
                style={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10
                }}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<RightOutlined />}
                onClick={handleNext}
                disabled={currentImageIndex === images.length - 1}
                style={{
                  position: 'absolute',
                  right: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10
                }}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProfileGallery;
