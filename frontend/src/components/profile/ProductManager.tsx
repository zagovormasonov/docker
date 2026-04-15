import React, { useState } from 'react';
import { Form, Input, Button, Card, Space, List, Tag, Popconfirm, Typography, Select, Upload, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Product {
  id: number;
  title: string;
  description: string;
  price?: number;
  image_url?: string;
  product_type: 'digital' | 'physical' | 'service';
}

interface ProductManagerProps {
  products: Product[];
  onProductsUpdate: (products: Product[]) => void;
  isMobile: boolean;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, onProductsUpdate, isMobile }) => {
  const [form] = Form.useForm();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      title: product.title,
      description: product.description,
      price: product.price,
      productType: product.product_type,
      imageUrl: product.image_url
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      onProductsUpdate(products.filter(p => p.id !== id));
      message.success('Продукт удален');
    } catch (error) {
      message.error('Ошибка при удалении');
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      form.setFieldsValue({ imageUrl: response.data.url });
      message.success('Изображение загружено');
    } catch (error) {
      message.error('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const onFinish = async (values: any) => {
    try {
      if (editingProduct) {
        const response = await api.put(`/products/${editingProduct.id}`, values);
        onProductsUpdate(products.map(p => p.id === editingProduct.id ? response.data : p));
        message.success('Продукт обновлен');
      } else {
        const response = await api.post('/products', values);
        onProductsUpdate([...products, response.data]);
        message.success('Продукт добавлен');
      }
      setShowForm(false);
      setEditingProduct(null);
      form.resetFields();
    } catch (error) {
      message.error('Ошибка при сохранении');
    }
  };

  return (
    <div className="manager-section" style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Готовые продукты</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingProduct(null);
            form.resetFields();
            setShowForm(!showForm);
          }}
          style={{ borderRadius: 8 }}
        >
          {showForm ? 'Отмена' : 'Добавить продукт'}
        </Button>
      </div>

      {showForm && (
        <Card className="settings-sub-card" style={{ marginBottom: 24, borderRadius: 12, border: '1px solid #f0f0f0' }}>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
              <Input size="large" />
            </Form.Item>

            <Form.Item name="description" label="Описание" rules={[{ required: true }]}>
              <TextArea rows={4} />
            </Form.Item>

            <Space wrap size="middle">
              <Form.Item name="price" label="Цена (₽)">
                <Input type="number" size="large" />
              </Form.Item>
              <Form.Item name="productType" label="Тип" rules={[{ required: true }]}>
                <Select style={{ width: 140 }} size="large">
                  <Select.Option value="digital">Цифровой</Select.Option>
                  <Select.Option value="physical">Физический</Select.Option>
                  <Select.Option value="service">Услуга</Select.Option>
                </Select>
              </Form.Item>
            </Space>

            <Form.Item name="imageUrl" label="Изображение">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Upload showUploadList={false} beforeUpload={handleImageUpload} accept="image/*">
                  <Button icon={<PlusOutlined />} loading={uploading}>
                    {form.getFieldValue('imageUrl') ? 'Заменить фото' : 'Загрузить фото'}
                  </Button>
                </Upload>
                {form.getFieldValue('imageUrl') && (
                  <img
                    src={form.getFieldValue('imageUrl')}
                    alt="Preview"
                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, marginTop: 12 }}
                  />
                )}
              </Space>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block={isMobile}>
                {editingProduct ? 'Сохранить изменения' : 'Создать проект'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      <List
        dataSource={products}
        locale={{ emptyText: 'У вас пока нет продуктов' }}
        renderItem={(product) => (
          <List.Item
            className="settings-list-item"
            actions={[
              <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => handleEdit(product)} />,
              <Popconfirm key="delete" title="Удалить продукт?" onConfirm={() => handleDelete(product.id)}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              avatar={product.image_url && <img src={product.image_url} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />}
              title={
                <Space>
                  <span style={{ fontWeight: 600 }}>{product.title}</span>
                  <Tag color={product.product_type === 'digital' ? 'blue' : 'green'}>{product.product_type}</Tag>
                </Space>
              }
              description={
                <div>
                  <div style={{ color: '#86868b', fontSize: 13, marginBottom: 4 }}>{product.description}</div>
                  {product.price && <Text strong>{product.price} ₽</Text>}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default ProductManager;
