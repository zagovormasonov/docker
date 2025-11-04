import React, { useState, useEffect } from 'react';
import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface ExpertBenefitsCardProps {
  showPricing?: boolean;
}

const ExpertBenefitsCard: React.FC<ExpertBenefitsCardProps> = ({ showPricing = true }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      borderRadius: 24,
      padding: isMobile ? '32px 20px' : '48px 40px',
      textAlign: 'center',
      marginBottom: 16
    }}>
      <h2 style={{ 
        fontFamily: 'Montserrat, sans-serif',
        fontSize: isMobile ? 24 : 32,
        fontWeight: 700,
        color: '#1d1d1f',
        margin: '0 0 16px 0',
        lineHeight: 1.3
      }}>
        Выберите ваш профессиональный профиль
      </h2>
      
      <p style={{ 
        fontSize: 14,
        color: '#666666',
        margin: '0 0 20px 0',
        lineHeight: 1.6,
        fontFamily: 'Montserrat, sans-serif'
      }}>
        Начните формировать свой личный бренд, который будет работать на вас!
      </p>
      
      <div style={{ 
        marginBottom: 24
      }}>
        <a 
          onClick={() => navigate('/expert-landing')}
          style={{ 
            color: '#6366f1',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: 14,
            fontFamily: 'Montserrat, sans-serif',
            cursor: 'pointer'
          }}
        >
          Узнать о преимуществах Эксперта
        </a>
      </div>

      <Button 
        type="primary"
        size="large"
        onClick={handlePayment}
        style={{
          height: 52,
          fontSize: 16,
          fontWeight: 600,
          fontFamily: 'Montserrat, sans-serif',
          background: '#6366f1',
          border: 'none',
          borderRadius: 30,
          width: 190,
          margin: '0 auto 24px'
        }}
      >
        Выбрать тариф
      </Button>

      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <Text style={{ 
          fontSize: 16, 
          textDecoration: 'line-through', 
          color: '#86868b',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 500
        }}>
          3369 ₽
        </Text>
        <div style={{
          background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
          padding: '8px 24px',
          borderRadius: 20
        }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            990 ₽
          </Text>
        </div>
      </div>
    </div>
  );
};

export default ExpertBenefitsCard;

