import React from 'react';
import { Card, Button, Typography, Space, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

interface ExpertBenefitsCardProps {
  showPricing?: boolean;
}

const ExpertBenefitsCard: React.FC<ExpertBenefitsCardProps> = ({ showPricing = true }) => {
  const navigate = useNavigate();

  const handleBecomeExpert = () => {
    navigate('/become-expert');
  };

  const handlePayment = async () => {
    try {
      // Создаем платеж через Юкассу
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: 'lifetime',
          amount: 990,
          description: 'Пожизненный доступ к функциям эксперта'
        })
      });

      if (response.ok) {
        const paymentData = await response.json();
        
        // Перенаправляем на страницу оплаты Юкассы
        if (paymentData.payment_url) {
          window.location.href = paymentData.payment_url;
        } else {
          console.error('Ошибка создания платежа');
        }
      } else {
        const error = await response.json();
        console.error(error.error || 'Ошибка создания платежа');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  return (
    <Card 
      style={{ 
        background: 'linear-gradient(135deg, rgb(180, 194, 255) 0%, rgb(245, 236, 255) 100%)',
        border: 'none',
        borderRadius: 16,
        marginBottom: 24
      }}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Title level={3} style={{ color: '#1d1d1f', marginBottom: 16 }}>
          🚀 Станьте экспертом прямо сейчас!
        </Title>
        
        {showPricing && (
          <div style={{ marginBottom: 20 }}>
            <Space direction="vertical" size={16}>
              <div>
                <Text 
                  style={{ 
                    fontSize: 24, 
                    textDecoration: 'line-through', 
                    color: '#86868b',
                    marginRight: 12
                  }}
                >
                  3499 ₽/мес
                </Text>
                <div 
                  style={{ 
                    display: 'inline-block',
                    background: '#ff4d4f',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  СЕЙЧАС БЕСПЛАТНО!
                </div>
              </div>
              
              <Divider style={{ margin: '8px 0' }} />
              
              <div>
                <Text style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f' }}>
                  Или выберите тариф:
                </Text>
                <div style={{ marginTop: 12 }}>
                  <Space direction="vertical" size={8}>
                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.8)', 
                      padding: '12px 20px', 
                      borderRadius: 12,
                      border: '2px solid #6366f1'
                    }}>
                      <Text strong style={{ fontSize: 16, color: '#1d1d1f' }}>
                        Эксперт на год: 990 ₽
                      </Text>
                    </div>
                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.8)', 
                      padding: '12px 20px', 
                      borderRadius: 12,
                      border: '2px solid #52c41a'
                    }}>
                      <Text strong style={{ fontSize: 16, color: '#1d1d1f' }}>
                        Пожизненный доступ: 3369 ₽
                      </Text>
                    </div>
                  </Space>
                </div>
              </div>
            </Space>
          </div>
        )}
        
        <Paragraph style={{ fontSize: 16, color: '#1d1d1f', marginBottom: 24 }}>
          Получите все права эксперта: создавайте статьи, добавляйте услуги, 
          общайтесь с клиентами и зарабатывайте на своей экспертизе!
        </Paragraph>
        
        <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#1d1d1f', fontSize: 14 }}>✅</Text>
            <Text style={{ marginLeft: 8, color: '#1d1d1f' }}>Размещение персонального профиля в каталоге</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#1d1d1f', fontSize: 14 }}>✅</Text>
            <Text style={{ marginLeft: 8, color: '#1d1d1f' }}>Публикация и продажа онлайн-курсов</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#1d1d1f', fontSize: 14 }}>✅</Text>
            <Text style={{ marginLeft: 8, color: '#1d1d1f' }}>Размещение и продвижение мероприятий</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#1d1d1f', fontSize: 14 }}>✅</Text>
            <Text style={{ marginLeft: 8, color: '#1d1d1f' }}>Публикация экспертных статей</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#1d1d1f', fontSize: 14 }}>✅</Text>
            <Text style={{ marginLeft: 8, color: '#1d1d1f' }}>Прямая продажа услуг через платформу</Text>
          </div>
        </Space>
        
        <Space size="large">
          <Button
            type="primary"
            size="large"
            onClick={handlePayment}
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              background: '#6366f1',
              border: 'none',
              borderRadius: 24,
              padding: '0 32px'
            }}
          >
            Перейти к оплате
          </Button>
          <Button
            size="large"
            onClick={handleBecomeExpert}
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              background: '#1d1d1f',
              border: 'none',
              borderRadius: 24,
              padding: '0 32px',
              color: '#fff'
            }}
          >
            Стать экспертом
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default ExpertBenefitsCard;

