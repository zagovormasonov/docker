import React from 'react';
import { Card, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CrownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ExpertBenefitsCardProps {
  showPricing?: boolean;
}

const ExpertBenefitsCard: React.FC<ExpertBenefitsCardProps> = ({ showPricing = true }) => {
  const navigate = useNavigate();

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
        background: 'linear-gradient(135deg, rgb(180, 140, 255) 0%, rgb(240, 200, 255) 100%)',
        border: 'none',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
      }}
      bodyStyle={{ padding: '40px' }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Icon */}
        <div style={{ marginBottom: 24 }}>
          <CrownOutlined style={{ fontSize: 48, color: '#fff', opacity: 0.8 }} />
        </div>

        {/* Main Title */}
        <Title 
          level={2} 
          style={{ 
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            color: '#fff',
            marginBottom: 12,
            fontSize: 28
          }}
        >
          Выберите профессиональный профиль эксперта
        </Title>
        
        {/* Subtitle */}
        <Text style={{ 
          fontSize: 16, 
          color: '#fff',
          opacity: 0.95,
          display: 'block',
          marginBottom: 24,
          lineHeight: '1.6'
        }}>
          Начните формировать свой личный бренд, который будет работать на вас!
        </Text>
        
        {/* Learn More Link */}
        <Button 
          type="link"
          onClick={() => navigate('/expert-landing')}
          style={{ 
            color: '#fff',
            padding: 0,
            height: 'auto',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            textDecoration: 'underline'
          }}
        >
          Узнать о преимуществах Эксперта
        </Button>

        {/* Pricing Section */}
        <div style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 14, 
            color: '#fff',
            opacity: 0.9,
            display: 'block',
            marginBottom: 12
          }}>
            Пожизненный доступ к полным возможностям:
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Text style={{ 
              fontSize: 32, 
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              990 ₽
            </Text>
            <Text style={{ 
              fontSize: 18, 
              textDecoration: 'line-through', 
              color: '#fff',
              opacity: 0.7
            }}>
              3369 ₽
            </Text>
          </div>
        </div>
        
        {/* Primary Button */}
        <Button
          type="primary"
          size="large"
          onClick={handlePayment}
          style={{
            height: 52,
            fontSize: 16,
            fontWeight: 600,
            background: '#fff',
            color: '#7c3aed',
            border: 'none',
            borderRadius: 12,
            width: '100%',
            fontFamily: 'Montserrat, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Выбрать тариф
        </Button>
      </div>
    </Card>
  );
};

export default ExpertBenefitsCard;

