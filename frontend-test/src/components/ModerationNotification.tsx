import { useState, useEffect } from 'react';
import { Card, Typography, Tag, Space, Button, Modal } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;

interface ModerationNotificationProps {
  eventId: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  onStatusChange?: (status: string) => void;
}

const ModerationNotification = ({ 
  eventId, 
  status, 
  reason, 
  onStatusChange 
}: ModerationNotificationProps) => {
  const [visible, setVisible] = useState(true);

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <ClockCircleOutlined />,
          color: 'orange',
          text: 'На модерации',
          description: 'Ваше событие отправлено на модерацию. Мы уведомим вас о результате.'
        };
      case 'approved':
        return {
          icon: <CheckCircleOutlined />,
          color: 'green',
          text: 'Одобрено',
          description: 'Ваше событие одобрено и опубликовано!'
        };
      case 'rejected':
        return {
          icon: <CloseCircleOutlined />,
          color: 'red',
          text: 'Отклонено',
          description: reason || 'Событие не соответствует требованиям платформы.'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config || !visible) return null;

  return (
    <Card 
      style={{ 
        marginBottom: 16,
        border: `2px solid ${config.color === 'orange' ? '#faad14' : config.color === 'green' ? '#52c41a' : '#ff4d4f'}`
      }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space>
          <Tag 
            icon={config.icon} 
            color={config.color}
            style={{ fontSize: 14, padding: '4px 12px' }}
          >
            {config.text}
          </Tag>
        </Space>
        
        <Text type="secondary" style={{ fontSize: 14 }}>
          {config.description}
        </Text>
        
        {status === 'rejected' && reason && (
          <div style={{ 
            background: '#fff2f0', 
            border: '1px solid #ffccc7', 
            borderRadius: 6, 
            padding: 12,
            marginTop: 8
          }}>
            <Text type="danger" style={{ fontSize: 13 }}>
              <strong>Причина отклонения:</strong> {reason}
            </Text>
          </div>
        )}
        
        <Button 
          type="text" 
          size="small" 
          onClick={() => setVisible(false)}
          style={{ alignSelf: 'flex-start' }}
        >
          Скрыть уведомление
        </Button>
      </Space>
    </Card>
  );
};

export default ModerationNotification;
