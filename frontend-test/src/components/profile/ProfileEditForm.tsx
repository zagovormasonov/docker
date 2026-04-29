import React, { useState } from 'react';
import { Form, Input, Button, Card, Space, Select, message, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Text } = Typography;
const { TextArea } = Input;

interface ProfileEditFormProps {
  user: any;
  form: any;
  cities: any[];
  topics: any[];
  customSocials: any[];
  onSocialsUpdate: (socials: any[]) => void;
  onFinish: (values: any) => Promise<void>;
  loading: boolean;
  isMobile: boolean;
  openMobileSelect: (type: string) => void;
  selectedCity: string;
  selectedTopicsLabel: string;
  selectedConsultationTypesLabel: string;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  user, form, cities, topics, customSocials, onSocialsUpdate, onFinish, loading, isMobile, openMobileSelect,
  selectedCity, selectedTopicsLabel, selectedConsultationTypesLabel
}) => {
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  const handleAddSocial = async () => {
    if (!newSocialName || !newSocialUrl) return;
    try {
      const response = await api.post('/users/custom-socials', { name: newSocialName, url: newSocialUrl });
      onSocialsUpdate([...customSocials, response.data]);
      setNewSocialName(''); setNewSocialUrl(''); setShowAddSocial(false);
      message.success('Ссылка добавлена');
    } catch (error) { message.error('Ошибка при добавлении'); }
  };

  const handleDeleteSocial = async (id: number) => {
    try {
      await api.delete(`/users/custom-socials/${id}`);
      onSocialsUpdate(customSocials.filter(s => s.id !== id));
      message.success('Удалено');
    } catch (error) { message.error('Ошибка при удалении'); }
  };

  const isExpert = user?.userType === 'expert' || user?.userType === 'admin';

  return (
    <div className="section-card">
      <h2 className="section-title" style={{ marginBottom: 24 }}>⚙️ Настройки профиля</h2>
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        {/* Основная информация */}
        <div style={{ marginBottom: 32 }}>
          <Text strong style={{ display: 'block', marginBottom: 16, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11 }}>Основная информация</Text>
          <Form.Item name="name" label="Имя" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input size="large" placeholder="Как вас зовут?" style={{ borderRadius: 12 }} />
          </Form.Item>
          <Form.Item name="bio" label="О себе">
            <TextArea rows={4} placeholder="Расскажите о себе..." style={{ borderRadius: 12 }} />
          </Form.Item>
          {isMobile ? (
            <Form.Item label="Город">
              <Input size="large" placeholder="Выберите город" value={selectedCity || ''} readOnly
                onClick={() => openMobileSelect('city')} style={{ borderRadius: 12, cursor: 'pointer' }} />
              <Form.Item name="city" noStyle><Input type="hidden" /></Form.Item>
            </Form.Item>
          ) : (
            <Form.Item name="city" label="Город">
              <Select size="large" showSearch placeholder="Выберите город"
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={cities.map(c => ({ label: c.name, value: c.name }))} />
            </Form.Item>
          )}
        </div>

        {/* Контакты */}
        <div style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 11, display: 'block', marginBottom: 16, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Контакты и социальные сети</Text>
          <Form.Item name="vkUrl" label="ВКонтакте">
            <Input size="large" placeholder="https://vk.com/username" prefix={<LinkOutlined />} style={{ borderRadius: 12 }} />
          </Form.Item>
          <Form.Item name="telegramUrl" label="Telegram">
            <Input size="large" placeholder="https://t.me/username" prefix={<LinkOutlined />} style={{ borderRadius: 12 }} />
          </Form.Item>
          <Form.Item name="whatsapp" label="WhatsApp">
            <Input size="large" placeholder="+7 (999) 123-45-67" prefix={<LinkOutlined />} style={{ borderRadius: 12 }} />
          </Form.Item>

          {customSocials.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {customSocials.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: '#f5f5f7', borderRadius: 12, marginBottom: 8
                }}>
                  <Text strong style={{ fontSize: 13 }}>{s.name}</Text>
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ flex: 1, color: '#6366f1', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</a>
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteSocial(s.id)} />
                </div>
              ))}
            </div>
          )}

          {!showAddSocial ? (
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setShowAddSocial(true)} block style={{ borderRadius: 12, height: 44 }}>
              Добавить ссылку
            </Button>
          ) : (
            <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Input placeholder="Название (напр. Behance)" value={newSocialName} onChange={e => setNewSocialName(e.target.value)} style={{ borderRadius: 10 }} />
                <Input placeholder="https://..." value={newSocialUrl} onChange={e => setNewSocialUrl(e.target.value)} style={{ borderRadius: 10 }} />
                <Space>
                  <Button type="primary" onClick={handleAddSocial} style={{ borderRadius: 10 }}>Сохранить</Button>
                  <Button onClick={() => setShowAddSocial(false)} style={{ borderRadius: 10 }}>Отмена</Button>
                </Space>
              </Space>
            </div>
          )}
        </div>

        {/* Специализация (только для экспертов) */}
        {isExpert && (
          <div style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 11, display: 'block', marginBottom: 16, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Специализация</Text>
            {isMobile ? (
              <>
                <Form.Item label="Типы консультаций">
                  <Input size="large" value={selectedConsultationTypesLabel} readOnly onClick={() => openMobileSelect('consultationTypes')} style={{ borderRadius: 12, cursor: 'pointer' }} />
                  <Form.Item name="consultationTypes" noStyle><Input type="hidden" /></Form.Item>
                </Form.Item>
                <Form.Item label="Тематики">
                  <Input size="large" value={selectedTopicsLabel} readOnly onClick={() => openMobileSelect('topics')} style={{ borderRadius: 12, cursor: 'pointer' }} />
                  <Form.Item name="topics" noStyle><Input type="hidden" /></Form.Item>
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="consultationTypes" label="Типы консультаций">
                  <Select mode="multiple" size="large" placeholder="Выберите типы"
                    options={['Онлайн', 'Офлайн', 'Выезд на дом', 'Групповые сессии', 'Индивидуальные сессии'].map(t => ({ label: t, value: t }))} />
                </Form.Item>
                <Form.Item name="topics" label="Тематики">
                  <Select mode="multiple" size="large" showSearch placeholder="Выберите тематики"
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    options={topics.map(t => ({ label: t.name, value: t.id }))} maxTagCount="responsive" />
                </Form.Item>
              </>
            )}
          </div>
        )}

        <Button type="primary" htmlType="submit" loading={loading} size="large" block
          style={{ height: 52, borderRadius: 16, fontSize: 16, fontWeight: 600, background: '#1d1d1f', border: 'none' }}>
          Сохранить изменения
        </Button>
      </Form>
    </div>
  );
};

export default ProfileEditForm;
