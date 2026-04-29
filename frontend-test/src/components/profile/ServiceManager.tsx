import React, { useState } from 'react';
import { Form, Input, Button, Space, List, Tag, Popconfirm, Typography, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ServiceManagerProps {
  user: any;
  services: any[];
  onServicesUpdate: (services: any[]) => void;
  isMobile: boolean;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ user, services, onServicesUpdate, isMobile }) => {
  const [form] = Form.useForm();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const handleEdit = (s: any) => {
    setEditing(s);
    form.setFieldsValue({ title: s.title, description: s.description, price: s.price, duration: s.duration, serviceType: s.service_type });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/experts/services/${id}`); onServicesUpdate(services.filter(s => s.id !== id)); message.success('Удалено'); }
    catch { message.error('Ошибка'); }
  };

  const onFinish = async (values: any) => {
    try {
      if (editing) {
        const r = await api.put(`/experts/services/${editing.id}`, values);
        onServicesUpdate(services.map(s => s.id === editing.id ? r.data : s));
        message.success('Обновлено');
      } else {
        const r = await api.post('/experts/services', values);
        onServicesUpdate([...services, r.data]);
        message.success('Добавлено');
      }
      setShowForm(false); setEditing(null); form.resetFields();
    } catch { message.error('Ошибка'); }
  };

  return (
    <div className="section-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="section-title" style={{ margin: 0 }}>💼 Мои услуги</h2>
        <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 12, background: '#1d1d1f', border: 'none' }}
          onClick={() => { setEditing(null); form.resetFields(); setShowForm(!showForm); }}>
          {showForm ? 'Отмена' : 'Добавить'}
        </Button>
      </div>

      {showForm && (
        <div style={{ padding: 20, background: '#f5f5f7', borderRadius: 20, marginBottom: 20 }}>
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
              <Input size="large" placeholder="Название услуги" style={{ borderRadius: 12 }} />
            </Form.Item>
            <Form.Item name="description" label="Описание" rules={[{ required: true }]}>
              <TextArea rows={3} placeholder="Опишите вашу услугу..." style={{ borderRadius: 12 }} />
            </Form.Item>
            <Space wrap size="middle">
              <Form.Item name="price" label="Цена (₽)">
                <Input type="number" placeholder="3000" size="large" style={{ borderRadius: 12, width: 140 }} />
              </Form.Item>
              <Form.Item name="duration" label="Длительность (мин)">
                <Input type="number" placeholder="60" size="large" style={{ borderRadius: 12, width: 140 }} />
              </Form.Item>
              <Form.Item name="serviceType" label="Формат" rules={[{ required: true }]}>
                <Select style={{ width: 140 }} size="large" placeholder="Тип">
                  <Select.Option value="online">Онлайн</Select.Option>
                  <Select.Option value="offline">Офлайн</Select.Option>
                  <Select.Option value="both">Оба</Select.Option>
                </Select>
              </Form.Item>
            </Space>
            <Button type="primary" htmlType="submit" size="large" style={{ borderRadius: 12, marginTop: 8, background: '#1d1d1f', border: 'none' }}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </Form>
        </div>
      )}

      {services.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#86868b' }}>Нет добавленных услуг</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {services.map(s => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', background: '#f5f5f7', borderRadius: 16, transition: 'all 0.2s'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                <Space size="small">
                  {s.price && <Text type="secondary">{s.price} ₽</Text>}
                  {s.duration && <Text type="secondary">· {s.duration} мин</Text>}
                  <Tag color={s.service_type === 'online' ? 'blue' : s.service_type === 'offline' ? 'green' : 'purple'} style={{ borderRadius: 10 }}>
                    {s.service_type === 'online' ? 'Онлайн' : s.service_type === 'offline' ? 'Офлайн' : 'Оба'}
                  </Tag>
                </Space>
              </div>
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(s)} />
                <Popconfirm title="Удалить?" onConfirm={() => handleDelete(s.id)}>
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

export default ServiceManager;
