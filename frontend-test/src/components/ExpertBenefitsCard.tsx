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

  const handleSelectPlan = () => {
    // Переходим на лендинг и прокручиваем к секции с оплатой
    navigate('/expert-landing#pricing');
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
        onClick={handleSelectPlan}
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
    </div>
  );
};

export default ExpertBenefitsCard;

