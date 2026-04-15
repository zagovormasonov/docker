import React from 'react';
import { Typography, Button, message } from 'antd';
import { RocketOutlined, CalendarOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface ExpertStatusSectionProps {
  user: any;
}

const ExpertStatusSection: React.FC<ExpertStatusSectionProps> = ({ user }) => {
  const navigate = useNavigate();

  if (!user || (user.userType !== 'expert' && user.userType !== 'admin')) return null;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referralCode}&plan=yearly`);
    message.success('Ссылка скопирована!');
  };

  return (
    <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Статус */}
      <div style={{
        background: 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)',
        padding: '28px 32px', color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <RocketOutlined style={{ fontSize: 18 }} />
              </div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>Статус Эксперта</Title>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(48, 209, 88, 0.15)', padding: '3px 12px',
              borderRadius: 20, fontSize: 12, color: '#30d158', fontWeight: 600
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158' }}></span>
              Активен
            </div>
          </div>
          <Button onClick={() => navigate('/expert-landing#pricing')} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', borderRadius: 12, fontWeight: 500
          }}>
            Продлить
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', marginBottom: 4 }}>Тариф</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {user.subscriptionPlan === 'yearly' ? 'Годовой' : user.subscriptionPlan === 'monthly' ? 'Месячный' : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', marginBottom: 4 }}>Действует до</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              <CalendarOutlined style={{ marginRight: 6 }} />
              {user.subscriptionExpiresAt
                ? new Date(user.subscriptionExpiresAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Реферальная программа */}
      <div style={{
        background: 'linear-gradient(135deg, #5856d6 0%, #af52de 100%)',
        padding: '24px 32px', color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={5} style={{ color: '#fff', margin: '0 0 2px 0' }}>Партнёрская программа</Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Приглашайте друзей и получайте бонусы</Text>
          </div>
          <div style={{
            background: '#fff', padding: '6px 16px', borderRadius: 16,
            display: 'flex', alignItems: 'baseline', gap: 3
          }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#5856d6' }}>{user.bonuses || 0}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#5856d6', opacity: 0.7 }}>₽</span>
          </div>
        </div>

        <div onClick={copyLink} style={{
          background: 'rgba(0,0,0,0.15)', borderRadius: 14, padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff', opacity: 0.8 }}>
            {`${window.location.origin.replace('https://', '').split('/')[0]}/...${user.referralCode || ''}`}
          </span>
          <CopyOutlined style={{ color: '#fff', fontSize: 15 }} />
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
          Друзья получат <strong style={{ color: '#fff' }}>скидку 10%</strong>, а вам вернётся <strong style={{ color: '#fff' }}>{user.referralRewardPercent || 10}%</strong> кэшбэка
        </div>
      </div>
    </div>
  );
};

export default ExpertStatusSection;
