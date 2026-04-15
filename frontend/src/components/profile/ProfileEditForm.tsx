import React, { useState } from 'react';
import { Form, Input, Button, Card, Space, Divider, Select, message, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { TextArea, Text } = Typography;

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
      setNewSocialName('');
      setNewSocialUrl('');
      setShowAddSocial(false);
      message.success('Соцсеть добавлена');
    } catch (error) {
       message.error('Ошибка при добавлении');
    }
  };

  const handleDeleteSocial = async (id: number) => {
    try {
      await api.delete(`/users/custom-socials/${id}`);
      onSocialsUpdate(customSocials.filter(s => s.id !== id));
      message.success('Удалено');
    } catch (error) {
      message.error('Ошибка при удалении');
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
      <Card className="settings-section-card" title="Основная информация" bordered={false}>
        <Form.Item name="name" label="Имя" rules={[{ required: true, message: 'Введите имя' }]}>
          <Input size="large" placeholder="Как вас зовут?" />
        </Form.Item>

        <Form.Item name="bio" label="О себе">
          <TextArea rows={4} placeholder="Расскажите о себе, своей практике и опыте..." />
        </Form.Item>

        {isMobile ? (
          <Form.Item label="Город">
            <Input
              size="large"
              placeholder="Выберите город"
              value={selectedCity || ''}
              readOnly
              onClick={() => openMobileSelect('city')}
              suffix={<PlusOutlined style={{ color: '#86868b' }} />}
            />
            <Form.Item name="city" noStyle><Input type="hidden" /></Form.Item>
          </Form.Item>
        ) : (
          <Form.Item name="city" label="Город">
            <Select
              size="large"
              showSearch
              placeholder="Где вы находитесь?"
              options={cities.map(c => ({ label: c.name, value: c.name }))}
            />
          </Form.Item>
        )}
      </Card>

      <Card className="settings-section-card" title="Контакты и социальные сети" bordered={false} style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Form.Item name="vkUrl" label="ВКонтакте" style={{ marginBottom: 0 }}>
            <Input size="large" placeholder="vk.com/username" prefix={<LinkOutlined />} />
          </Form.Item>
          <Form.Item name="telegramUrl" label="Telegram" style={{ marginBottom: 0 }}>
            <Input size="large" placeholder="t.me/username" prefix={<LinkOutlined />} />
          </Form.Item>
          <Form.Item name="whatsapp" label="WhatsApp" style={{ marginBottom: 0 }}>
            <Input size="large" placeholder="+7 (999) 000-00-00" prefix={<LinkOutlined />} />
          </Form.Item>

          {customSocials.length > 0 && (
            <div className="custom-socials-list">
              {customSocials.map(social => (
                <div key={social.id} className="custom-social-item">
                  <Text strong>{social.name}: </Text>
                  <a href={social.url} target="_blank" rel="noreferrer" style={{ flex: 1 }}>{social.url}</a>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSocial(social.id)} />
                </div>
              ))}
            </div>
          )}

          {!showAddSocial ? (
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setShowAddSocial(true)} block>
              Добавить ссылку
            </Button>
          ) : (
            <div className="add-social-form">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="Название (например, Behance)" value={newSocialName} onChange={e => setNewSocialName(e.target.value)} />
                <Input placeholder="Ссылка (https://...)" value={newSocialUrl} onChange={e => setNewSocialUrl(e.target.value)} />
                <Space>
                  <Button type="primary" onClick={handleAddSocial}>Сохранить</Button>
                  <Button onClick={() => setShowAddSocial(false)}>Отмена</Button>
                </Space>
              </Space>
            </div>
          )}
        </Space>
      </Card>

      {(user?.userType === 'expert' || user?.userType === 'admin') && (
        <Card className="settings-section-card" title="Специализация" bordered={false} style={{ marginTop: 24 }}>
          {isMobile ? (
            <>
              <Form.Item label="Типы консультаций">
                <Input size="large" value={selectedConsultationTypesLabel} readOnly onClick={() => openMobileSelect('consultationTypes')} />
                <Form.Item name="consultationTypes" noStyle><Input type="hidden" /></Form.Item>
              </Form.Item>
              <Form.Item label="Тематики">
                <Input size="large" value={selectedTopicsLabel} readOnly onClick={() => openMobileSelect('topics')} />
                <Form.Item name="topics" noStyle><Input type="hidden" /></Form.Item>
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="consultationTypes" label="Типы консультаций">
                <Select mode="multiple" size="large" options={['Офлайн', 'Онлайн', 'Групповые', 'Индивидуальные'].map(t => ({ label: t, value: t }))} />
              </Form.Item>
              <Form.Item name="topics" label="Тематики">
                <Select mode="multiple" size="large" options={topics.map(t => ({ label: t.name, value: t.id }))} />
              </Form.Item>
            </>
          )}
        </Card>
      )}

      <div style={{ marginTop: 32 }}>
        <Button type="primary" htmlType="submit" loading={loading} size="large" block style={{ height: 56, borderRadius: 16, fontSize: 18, fontWeight: 600 }}>
          Сохранить профиль
        </Button>
      </div>
    </Form>
  );
};

export default ProfileEditForm;
