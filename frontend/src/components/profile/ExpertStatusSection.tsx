import React from 'react';
import { Space, Card, Typography, Tag, Button, message } from 'antd';
import { RocketOutlined, CalendarOutlined, CopyOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface ExpertStatusSectionProps {
  user: any;
}

const ExpertStatusSection: React.FC<ExpertStatusSectionProps> = ({ user }) => {
  const navigate = useNavigate();

  if (user?.userType === 'client') return null;

  const copyToClipboard = () => {
    const link = `${window.location.origin}/register?ref=${user?.referralCode}&plan=yearly`;
    navigator.clipboard.writeText(link);
    message.success('Ссылка скопирована!');
  };

  return (
    <div className="settings-expert-section">
      <div className="premium-status-grid">
        {/* Карточка статуса */}
        <div className="premium-status-card expert-status">
          <div className="card-top">
            <div className="status-title-group">
              <div className="icon-box">
                <RocketOutlined />
              </div>
              <div>
                <Title level={4} className="white-text m-0">Статус Эксперта</Title>
                <div className="status-badge">
                  <span className="dot active"></span>
                  Активен
                </div>
              </div>
            </div>
            <Button 
              className="premium-glass-btn" 
              onClick={() => navigate('/expert-landing#pricing')}
            >
              Продлить
            </Button>
          </div>

          <div className="card-info-footer">
            <div className="info-item">
              <span className="info-label">Тариф</span>
              <span className="info-value">
                {user?.subscriptionPlan === 'yearly' ? 'Годовой' : 'Месячный'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Действует до</span>
              <span className="info-value">
                <CalendarOutlined style={{ marginRight: 6 }} />
                {user?.subscriptionExpiresAt
                  ? new Date(user.subscriptionExpiresAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Карточка рефералки */}
        <div className="premium-status-card referral-status">
          <div className="card-top">
            <div>
              <Title level={4} className="white-text m-0">Партнерская программа</Title>
              <Text className="white-text-50">Приглашайте друзей и получайте бонусы</Text>
            </div>
            <div className="bonus-pill">
              <span className="bonus-amount">{user?.bonuses || 0}</span>
              <span className="bonus-label">₽</span>
            </div>
          </div>

          <div className="referral-link-container">
            <div className="referral-link-box" onClick={copyToClipboard}>
              <span className="link-text">
                {`${window.location.origin.replace('https://', '')}/...${user?.referralCode}`}
              </span>
              <CopyOutlined className="copy-icon" />
            </div>
            <div className="referral-note">
              Друзья получат <span className="highlight">скидку 10%</span>, а вам вернется <span className="highlight">{user?.referralRewardPercent || 10}%</span> кэшбэка
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertStatusSection;
