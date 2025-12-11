import React from 'react';
import { Modal, Card, Typography, Space, Tag, Button, Image } from 'antd';
import { RussianRuble } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;

interface Product {
  id: number;
  title: string;
  description: string;
  price?: number;
  product_type: 'digital' | 'physical' | 'service';
  image_url?: string;
}

interface ProductModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onBuy: (product: Product) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, visible, onClose, onBuy }) => {
  if (!product) return null;

  const formatDescription = (description: string) => {
    // Заменяем \n на <br> для поддержки переносов строк
    return description.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < description.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <Modal
      title={product.title}
      open={visible}
      onCancel={onClose}
      afterClose={() => {
        // Возвращаем фокус на страницу после закрытия модального окна
        document.body.style.overflow = 'auto';
      }}
      destroyOnClose={true}
      maskClosable={true}
      footer={[
        <Button key="close" onClick={onClose}>
          Закрыть
        </Button>,
        <Button key="buy" type="primary" onClick={() => onBuy(product)}>
          Купить за {product.price} ₽
        </Button>
      ]}
      width={800}
      centered
    >
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {product.image_url && (
            <div style={{ textAlign: 'center' }}>
              <Image
                src={product.image_url}
                alt={product.title}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 400, 
                  objectFit: 'contain',
                  borderRadius: 8
                }}
                preview={{
                  mask: 'Увеличить'
                }}
              />
            </div>
          )}
          
          <div>
            <Title level={4}>Описание</Title>
            <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.6' }}>
              {formatDescription(product.description)}
            </Paragraph>
          </div>
          
          <div>
            {product.price && (
              <div style={{ marginBottom: 12 }}>
                <Space>
                  <RussianRuble size={18} />
                  <Text strong style={{ fontSize: '18px' }}>{product.price} ₽</Text>
                </Space>
              </div>
            )}
            <div>
              <Tag color={
                product.product_type === 'digital' ? 'blue' :
                product.product_type === 'physical' ? 'green' : 'purple'
              } style={{ fontSize: '14px', padding: '4px 12px' }}>
                {product.product_type === 'digital' ? 'Цифровой продукт' :
                 product.product_type === 'physical' ? 'Физический продукт' : 'Услуга'}
              </Tag>
            </div>
          </div>
        </Space>
      </Card>
    </Modal>
  );
};

export default ProductModal;
