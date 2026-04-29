import React, { useState } from 'react';
import { Form, Input, Button, Space, Tag, Popconfirm, Typography, Select, Upload, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Text } = Typography;
const { TextArea } = Input;

interface ProductManagerProps {
  products: any[];
  onProductsUpdate: (products: any[]) => void;
  isMobile: boolean;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, onProductsUpdate, isMobile }) => {
  const [form] = Form.useForm();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const handleEdit = (p: any) => {
    setEditing(p);
    form.setFieldsValue({
      title: p.title,
      description: p.description,
      price: p.price,
      productType: p.product_type,
      imageUrl: p.image_url
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      onProductsUpdate(products.filter(p => p.id !== id));
      message.success('Удалено');
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('Ошибка');
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      form.setFieldsValue({ imageUrl: r.data.url });
      message.success('Фото загружено');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const onFinish = async (values: any) => {
    try {
      // Отправляем данные в формате, который ожидает бэкенд
      const payload = {
        title: values.title,
        description: values.description,
        price: values.price ? Number(values.price) : null,
        productType: values.productType,
        imageUrl: values.imageUrl || null
      };

      if (editing) {
        const r = await api.put(`/products/${editing.id}`, payload);
        onProductsUpdate(products.map(p => p.id === editing.id ? r.data : p));
        message.success('Обновлено');
      } else {
        const r = await api.post('/products', payload);
        onProductsUpdate([...products, r.data]);
        message.success('Добавлено');
      }
      setShowForm(false);
      setEditing(null);
      form.resetFields();
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errMsg = error?.response?.data?.errors?.[0]?.msg || error?.response?.data?.error || 'Ошибка сохранения';
      message.error(errMsg);
    }
  };

  return (
    <div className="section-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="section-title" style={{ margin: 0 }}>🛍️ Готовые продукты</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ borderRadius: 12, background: '#1d1d1f', border: 'none' }}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Отмена' : 'Добавить'}
        </Button>
      </div>

      {showForm && (
        <div style={{ padding: 24, background: '#f5f5f7', borderRadius: 20, marginBottom: 20 }}>
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="title"
              label="Название"
              rules={[{ required: true, message: 'Минимум 3 символа' }, { min: 3, message: 'Минимум 3 символа' }]}
            >
              <Input size="large" placeholder="Название продукта" style={{ borderRadius: 12 }} />
            </Form.Item>

            <Form.Item
              name="description"
              label="Описание"
              rules={[{ required: true, message: 'Минимум 10 символов' }, { min: 10, message: 'Минимум 10 символов' }]}
              extra="Используйте Enter для переноса строк"
            >
              <TextArea rows={4} placeholder="Подробное описание продукта..." style={{ borderRadius: 12 }} />
            </Form.Item>

            <Space wrap size="middle">
              <Form.Item name="price" label="Цена (₽)">
                <Input type="number" size="large" placeholder="1500" style={{ borderRadius: 12, width: 140 }} />
              </Form.Item>

              <Form.Item
                name="productType"
                label="Тип продукта"
                rules={[{ required: true, message: 'Выберите тип' }]}
              >
                <Select style={{ width: 160 }} size="large" placeholder="Выберите тип">
                  <Select.Option value="digital">Цифровой</Select.Option>
                  <Select.Option value="physical">Физический</Select.Option>
                  <Select.Option value="service">Услуга</Select.Option>
                </Select>
              </Form.Item>
            </Space>

            <Form.Item name="imageUrl" label="Изображение">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Upload
                  showUploadList={false}
                  beforeUpload={handleImageUpload}
                  accept="image/*"
                >
                  <Button icon={<PlusOutlined />} loading={uploading} style={{ borderRadius: 12 }}>
                    Загрузить фото
                  </Button>
                </Upload>
                {form.getFieldValue('imageUrl') && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={form.getFieldValue('imageUrl')}
                      alt="Preview"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }}
                    />
                    <Button
                      size="small"
                      type="text"
                      danger
                      onClick={() => form.setFieldsValue({ imageUrl: '' })}
                      style={{ display: 'block', marginTop: 4 }}
                    >
                      Удалить фото
                    </Button>
                  </div>
                )}
              </Space>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{ borderRadius: 12, background: '#1d1d1f', border: 'none', marginTop: 8 }}
            >
              {editing ? 'Сохранить изменения' : 'Создать продукт'}
            </Button>
          </Form>
        </div>
      )}

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#86868b' }}>
          Нет добавленных продуктов
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(p => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', background: '#f5f5f7', borderRadius: 16
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minWidth: 0 }}>
                {p.image_url && (
                  <img src={p.image_url} alt={p.title}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.title}</div>
                  <Space size="small">
                    {p.price && <Text type="secondary">{p.price} ₽</Text>}
                    <Tag color={p.product_type === 'digital' ? 'blue' : p.product_type === 'physical' ? 'green' : 'purple'} style={{ borderRadius: 10 }}>
                      {p.product_type === 'digital' ? 'Цифровой' : p.product_type === 'physical' ? 'Физический' : 'Услуга'}
                    </Tag>
                  </Space>
                </div>
              </div>
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(p)} />
                <Popconfirm title="Удалить продукт?" onConfirm={() => handleDelete(p.id)} okText="Да" cancelText="Нет">
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductManager;
