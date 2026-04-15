import React from 'react';
import { Space, Card, Typography, Tag, Button, Divider, message } from 'antd';
import { RocketOutlined, CalendarOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface ExpertStatusSectionProps {
  user: any;
}

const ExpertStatusSection: React.FC<ExpertStatusSectionProps> = ({ user }) => {
  const navigate = useNavigate();

  if (user?.userType === 'client') return null;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 32 }}>
      {/* Статус подписки */}
      <Card
        className="settings-dashboard-card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          borderRadius: 16,
          border: 'none',
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={4} style={{ color: 'white', margin: '0 0 8px 0' }}>
              <RocketOutlined style={{ marginRight: 8 }} />
              Статус Эксперта
            </Title>
            <Tag color="#10b981" style={{ borderRadius: 12, border: 'none', fontWeight: 600 }}>Активен</Tag>
            <div style={{ marginTop: 16 }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', fontSize: 13 }}>Тариф:</Text>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>
                {user?.subscriptionPlan === 'yearly' ? 'Годовой' : user?.subscriptionPlan === 'monthly' ? 'Месячный' : 'Не указан'}
              </Text>
            </div>
            <div style={{ marginTop: 12 }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', fontSize: 13 }}>Действует до:</Text>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>
                <CalendarOutlined style={{ marginRight: 6, fontSize: 14 }} />
                {user?.subscriptionExpiresAt
                  ? new Date(user.subscriptionExpiresAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Дата не определена'}
              </Text>
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => navigate('/expert-landing#pricing')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              borderRadius: 8,
              height: 40
            }}
          >
            Продлить
          </Button>
        </div>
      </Card>

      {/* Реферальная программа */}
      <Card
        className="settings-dashboard-card"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          color: 'white',
          borderRadius: 16,
          border: 'none',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ color: 'white', margin: 0 }}>Реферальная программа</Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Приглашайте друзей и получайте бонусы
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{user?.bonuses || 0}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>бонусов</div>
          </div>
        </div>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.2)', margin: '16px 0' }} />

        <div>
          <Text style={{ color: 'white', display: 'block', marginBottom: 8 }}>Ваша уникальная ссылка:</Text>
          <div style={{
            display: 'flex',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.1)',
            padding: 8,
            borderRadius: 8,
            alignItems: 'center'
          }}>
            <Text style={{ color: 'white', flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {`${window.location.origin}/register?ref=${user?.referralCode}&plan=yearly`}
            </Text>
            <Button
              size="small"
              icon={<LinkOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.referralCode}&plan=yearly`);
                message.success('Ссылка скопирована!');
              }}
              style={{ background: 'white', border: 'none' }}
            >
              Копировать
            </Button>
          </div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, display: 'block', marginTop: 8 }}>
            Друзья получат скидку от 10%, а вам начислятся бонусы. Текущий бонус — <strong style={{ color: 'white' }}>{user?.referralRewardPercent || 10}%</strong>
          </Text>
        </div>
      </Card>
    </Space>
  );
};

export default ExpertStatusSection;
