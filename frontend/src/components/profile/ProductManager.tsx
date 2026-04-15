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
    form.setFieldsValue({ title: p.title, description: p.description, price: p.price, productType: p.product_type, imageUrl: p.image_url });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/products/${id}`); onProductsUpdate(products.filter(p => p.id !== id)); message.success('Удалено'); }
    catch { message.error('Ошибка'); }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const r = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      form.setFieldsValue({ imageUrl: r.data.url });
      message.success('Фото загружено');
    } catch { message.error('Ошибка загрузки'); }
    finally { setUploading(false); }
    return false;
  };

  const onFinish = async (values: any) => {
    try {
      if (editing) {
        const r = await api.put(`/products/${editing.id}`, values);
        onProductsUpdate(products.map(p => p.id === editing.id ? r.data : p));
        message.success('Обновлено');
      } else {
        const r = await api.post('/products', values);
        onProductsUpdate([...products, r.data]);
        message.success('Добавлено');
      }
      setShowForm(false); setEditing(null); form.resetFields();
    } catch { message.error('Ошибка'); }
  };

  return (
    <div className="section-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="section-title" style={{ margin: 0 }}>🛍️ Готовые продукты</h2>
        <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 12, background: '#1d1d1f', border: 'none' }}
          onClick={() => { setEditing(null); form.resetFields(); setShowForm(!showForm); }}>
          {showForm ? 'Отмена' : 'Добавить'}
        </Button>
      </div>

      {showForm && (
        <div style={{ padding: 20, background: '#f5f5f7', borderRadius: 20, marginBottom: 20 }}>
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="title" label="Название" rules={[{ required: true }]}>
              <Input size="large" style={{ borderRadius: 12 }} />
            </Form.Item>
            <Form.Item name="description" label="Описание" rules={[{ required: true }]}
              extra="Используйте Enter для переноса строк">
              <TextArea rows={3} style={{ borderRadius: 12 }} />
            </Form.Item>
            <Space wrap size="middle">
              <Form.Item name="price" label="Цена (₽)">
                <Input type="number" size="large" style={{ borderRadius: 12, width: 140 }} />
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
                  <Button icon={<PlusOutlined />} loading={uploading} style={{ borderRadius: 12 }}>
                    Загрузить фото
                  </Button>
                </Upload>
                {form.getFieldValue('imageUrl') && (
                  <img src={form.getFieldValue('imageUrl')} alt="Preview"
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, marginTop: 8 }} />
                )}
              </Space>
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" style={{ borderRadius: 12, background: '#1d1d1f', border: 'none' }}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </Form>
        </div>
      )}

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#86868b' }}>Нет добавленных продуктов</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(p => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', background: '#f5f5f7', borderRadius: 16
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {p.image_url && (
                  <img src={p.image_url} alt={p.title}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.title}</div>
                  <Space size="small">
                    {p.price && <Text type="secondary">{p.price} ₽</Text>}
                    <Tag color={p.product_type === 'digital' ? 'blue' : 'green'} style={{ borderRadius: 10 }}>
                      {p.product_type === 'digital' ? 'Цифровой' : p.product_type === 'physical' ? 'Физический' : 'Услуга'}
                    </Tag>
                  </Space>
                </div>
              </div>
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(p)} />
                <Popconfirm title="Удалить?" onConfirm={() => handleDelete(p.id)}>
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
