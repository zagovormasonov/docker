import React from 'react';
import { Card, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

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
        background: 'linear-gradient(135deg, rgb(180, 194, 255) 0%, rgb(245, 236, 255) 100%)',
        border: 'none',
        borderRadius: 12,
        marginBottom: 16,
        minHeight: '200px'
      }}
    >
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Text style={{ fontSize: 16, color: '#1d1d1f', marginBottom: 16, display: 'block', lineHeight: '1.5' }}>
          Монетизируйте свои знания, расширяйте аудиторию, станьте лидером мнений!
        </Text>
        
        <div style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: '#666', display: 'block', marginBottom: 8 }}>
            Пожизненный доступ
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 600,
              color: '#1d1d1f'
            }}>
              990 ₽
            </Text>
            <Text style={{ 
              fontSize: 16, 
              textDecoration: 'line-through', 
              color: '#86868b'
            }}>
              3369 ₽
            </Text>
          </div>
        </div>
        
        <Button 
          type="link"
          onClick={() => navigate('/expert-landing')}
          style={{ 
            color: '#6366f1',
            padding: 0,
            height: 'auto',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 16
          }}
        >
          Узнать о преимуществах Эксперта
        </Button>

        <div>
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
              borderRadius: 8,
              width: '100%'
            }}
          >
            Перейти к оплате
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ExpertBenefitsCard;

