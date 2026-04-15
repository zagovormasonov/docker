import React, { useState } from 'react';
import { Form, Input, Button, Card, Space, List, Tag, Popconfirm, Typography, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Service {
  id: number;
  title: string;
  description: string;
  price?: number;
  duration?: number;
  service_type: 'online' | 'offline' | 'both';
}

interface ServiceManagerProps {
  user: any;
  services: Service[];
  onServicesUpdate: (services: Service[]) => void;
  isMobile: boolean;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ user, services, onServicesUpdate, isMobile }) => {
  const [form] = Form.useForm();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue({
      title: service.title,
      description: service.description,
      price: service.price,
      duration: service.duration,
      serviceType: service.service_type
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/experts/services/${id}`);
      onServicesUpdate(services.filter(s => s.id !== id));
      message.success('Услуга удалена');
    } catch (error) {
      message.error('Ошибка при удалении');
    }
  };

  const onFinish = async (values: any) => {
    try {
      if (editingService) {
        const response = await api.put(`/experts/services/${editingService.id}`, values);
        onServicesUpdate(services.map(s => s.id === editingService.id ? response.data : s));
        message.success('Услуга обновлена');
      } else {
        const response = await api.post('/experts/services', values);
        onServicesUpdate([...services, response.data]);
        message.success('Услуга добавлена');
      }
      setShowForm(false);
      setEditingService(null);
      form.resetFields();
    } catch (error) {
      message.error('Ошибка при сохранении');
    }
  };

  return (
    <div className="manager-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Мои услуги</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingService(null);
            form.resetFields();
            setShowForm(!showForm);
          }}
          style={{ borderRadius: 8 }}
        >
          {showForm ? 'Отмена' : 'Добавить услугу'}
        </Button>
      </div>

      {showForm && (
        <Card className="settings-sub-card" style={{ marginBottom: 24, borderRadius: 12, border: '1px solid #f0f0f0' }}>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
              <Input placeholder="Например: Консультация по таро" size="large" />
            </Form.Item>

            <Form.Item name="description" label="Описание" rules={[{ required: true, message: 'Введите описание' }]}>
              <TextArea rows={4} placeholder="Опишите вашу услугу..." />
            </Form.Item>

            <Space wrap size="middle" style={{ width: '100%', marginBottom: 16 }}>
              <Form.Item name="price" label="Цена (₽)" style={{ marginBottom: 0 }}>
                <Input type="number" placeholder="3000" size="large" />
              </Form.Item>
              <Form.Item name="duration" label="Длительность (мин)" style={{ marginBottom: 0 }}>
                <Input type="number" placeholder="60" size="large" />
              </Form.Item>
              <Form.Item name="serviceType" label="Формат" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Select style={{ width: 140 }} size="large">
                  <Select.Option value="online">Онлайн</Select.Option>
                  <Select.Option value="offline">Офлайн</Select.Option>
                  <Select.Option value="both">Оба</Select.Option>
                </Select>
              </Form.Item>
            </Space>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block={isMobile}>
                {editingService ? 'Сохранить изменения' : 'Создать услугу'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      <List
        dataSource={services}
        locale={{ emptyText: 'У вас пока нет добавленных услуг' }}
        renderItem={(service) => (
          <List.Item
            className="settings-list-item"
            actions={[
              <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => handleEdit(service)} />,
              <Popconfirm
                key="delete"
                title="Удалить услугу?"
                onConfirm={() => handleDelete(service.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <span style={{ fontWeight: 600 }}>{service.title}</span>
                  <Tag color={service.service_type === 'online' ? 'blue' : service.service_type === 'offline' ? 'green' : 'purple'}>
                    {service.service_type === 'online' ? 'Онлайн' : service.service_type === 'offline' ? 'Офлайн' : 'Оба'}
                  </Tag>
                </Space>
              }
              description={
                <div>
                  <div style={{ color: '#86868b', marginBottom: 6 }}>{service.description}</div>
                  <Space size="middle">
                    {service.price && <Text strong>{service.price} ₽</Text>}
                    {service.duration && <Text type="secondary">{service.duration} мин</Text>}
                  </Space>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default ServiceManager;
