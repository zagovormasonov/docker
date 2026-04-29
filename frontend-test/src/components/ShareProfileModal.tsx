import React from 'react';
import { Modal, Avatar, Typography, Space, Tag, Button, Divider, message } from 'antd';
import { UserOutlined, EnvironmentOutlined, CopyOutlined, ShareAltOutlined } from '@ant-design/icons';
import './ShareProfileModal.css';

const { Title, Text, Paragraph } = Typography;

interface ShareProfileModalProps {
  visible: boolean;
  onClose: () => void;
  expert: {
    id: number;
    name: string;
    slug?: string;
    avatar_url?: string;
    bio?: string;
    city?: string;
    topics?: Array<{ id: number; name: string }>;
    telegram_url?: string;
    whatsapp?: string;
    customSocials?: Array<{ id: number; name: string; url: string }>;
  };
}

const ShareProfileModal: React.FC<ShareProfileModalProps> = ({ visible, onClose, expert }) => {
  console.log('ShareProfileModal opened with expert:', expert);
  console.log('Custom socials:', expert.customSocials);

  const profileUrl = `${window.location.origin}/experts/${expert.slug || expert.id}`;

  const contactsText = [];
  if (expert.telegram_url) contactsText.push(`📱 Telegram: ${expert.telegram_url}`);
  if (expert.whatsapp) contactsText.push(`📱 WhatsApp: ${expert.whatsapp}`);
  if (expert.customSocials && expert.customSocials.length > 0) {
    expert.customSocials.forEach(social => {
      contactsText.push(`🔗 ${social.name}: ${social.url}`);
    });
  }

  const shareText = `🌟 ${expert.name}

${expert.bio || 'Духовный наставник на платформе SoulSynergy'}

${expert.city ? `📍 ${expert.city}` : ''}

${expert.topics && expert.topics.length > 0 ? `🎯 Направления:\n${expert.topics.map(t => `• ${t.name}`).join('\n')}` : ''}

${contactsText.length > 0 ? `📞 Контакты:\n${contactsText.join('\n')}` : ''}

🔗 Профиль: ${profileUrl}

SoulSynergy — Синергия душ — пространство совместного духовного развития`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      message.success('Ссылка скопирована в буфер обмена!');
    } catch (error) {
      message.error('Не удалось скопировать ссылку');
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      message.success('Информация скопирована в буфер обмена!');
    } catch (error) {
      message.error('Не удалось скопировать информацию');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Профиль эксперта ${expert.name}`,
          text: shareText,
          url: profileUrl
        });
        message.success('Поделились успешно!');
      } catch (error: any) {
        // Пользователь отменил или ошибка
        if (error.name !== 'AbortError') {
          console.error('Ошибка при попытке поделиться:', error);
          handleCopyAll(); // Fallback на копирование
        }
      }
    } else {
      handleCopyAll(); // Fallback для браузеров без Web Share API
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      afterClose={() => {
        // Возвращаем фокус на страницу после закрытия модального окна
        document.body.style.overflow = 'auto';
      }}
      destroyOnClose={true}
      footer={null}
      width={600}
      centered
      maskClosable={true}
      bodyStyle={{ padding: 0 }}
      style={{ maxWidth: '95vw' }}
    >
      <div style={{
        background: 'linear-gradient(135deg, rgb(180 194 255) 0%, rgb(245 236 255) 100%)',
        padding: 'clamp(20px, 5vw, 40px) clamp(15px, 4vw, 30px) clamp(15px, 4vw, 30px) clamp(15px, 4vw, 30px)',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          borderRadius: 16,
          padding: 'clamp(20px, 5vw, 30px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Аватар */}
          <Avatar
            size={100}
            src={expert.avatar_url}
            icon={!expert.avatar_url && <UserOutlined />}
            style={{
              border: '4px solid #6366f1',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              marginBottom: 16
            }}
          />

          {/* Имя */}
          <Title level={3} style={{ marginBottom: 8, color: '#1d1d1f' }}>
            {expert.name}
          </Title>

          {/* Город */}
          {expert.city && (
            <Space style={{ marginBottom: 16, color: '#666' }}>
              <EnvironmentOutlined />
              <Text type="secondary">{expert.city}</Text>
            </Space>
          )}

          {/* Описание */}
          {expert.bio && (
            <Paragraph
              style={{
                fontSize: 15,
                color: '#666',
                marginBottom: 20,
                lineHeight: 1.6
              }}
            >
              {expert.bio.length > 150 ? `${expert.bio.substring(0, 150)}...` : expert.bio}
            </Paragraph>
          )}

          {/* Тематики */}
          {expert.topics && expert.topics.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1d1d1f' }}>
                🎯 Направления:
              </Text>
              <Space wrap size={[8, 8]}>
                {expert.topics.slice(0, 5).map((topic) => (
                  <Tag
                    key={topic.id}
                    color="purple"
                    style={{
                      fontSize: 13,
                      padding: '4px 12px',
                      borderRadius: 12
                    }}
                  >
                    {topic.name}
                  </Tag>
                ))}
                {expert.topics.length > 5 && (
                  <Tag style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12 }}>
                    +{expert.topics.length - 5}
                  </Tag>
                )}
              </Space>
            </div>
          )}

          {/* Контакты */}
          {(expert.telegram_url || expert.whatsapp || (expert.customSocials && expert.customSocials.length > 0)) && (
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1d1d1f' }}>
                📞 Контакты:
              </Text>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {expert.telegram_url && (
                  <Text style={{ fontSize: 13, color: '#666' }}>
                    📱 Telegram: {expert.telegram_url}
                  </Text>
                )}
                {expert.whatsapp && (
                  <Text style={{ fontSize: 13, color: '#666' }}>
                    📱 WhatsApp: {expert.whatsapp}
                  </Text>
                )}
                {expert.customSocials && expert.customSocials.map((social) => (
                  <Text key={social.id} style={{ fontSize: 13, color: '#666' }}>
                    🔗 {social.name}: {social.url}
                  </Text>
                ))}
              </Space>
            </div>
          )}

          <Divider style={{ margin: '20px 0' }} />

          {/* Ссылка */}
          <div style={{
            background: '#f5f5f5',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            wordBreak: 'break-all',
            fontSize: 13,
            color: '#6366f1',
            fontFamily: 'monospace'
          }}>
            {profileUrl}
          </div>

          {/* Кнопки действий */}
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              block
              style={{
                background: '#6366f1',
                borderColor: '#6366f1',
                height: 48,
                fontSize: 16,
                fontWeight: 500
              }}
            >
              Поделиться
            </Button>

            <div className="share-buttons-container">
              <Button
                size="large"
                icon={<CopyOutlined />}
                onClick={handleCopyLink}
                className="share-button"
                style={{
                  flex: 1,
                  height: 48,
                  minWidth: 0
                }}
              >
                Копировать ссылку
              </Button>
              <Button
                size="large"
                icon={<CopyOutlined />}
                onClick={handleCopyAll}
                className="share-button"
                style={{
                  flex: 1,
                  height: 48,
                  minWidth: 0
                }}
              >
                Копировать всё
              </Button>
            </div>
          </Space>

          {/* Футер */}
          <div style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid #eee',
            color: '#999',
            fontSize: 13
          }}>
            <div style={{
              fontWeight: 600,
              color: '#6366f1',
              fontSize: '16px',
              lineHeight: 1
            }}>
              SoulSynergy
            </div>
            <div style={{ fontSize: '10px', color: '#6366f1', textTransform: 'lowercase', opacity: 0.8, marginBottom: 8, letterSpacing: '1px' }}>синергия душ</div>
            <div style={{ color: '#999' }}>пространство совместного духовного развития</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShareProfileModal;

