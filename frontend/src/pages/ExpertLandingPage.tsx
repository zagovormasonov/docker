import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import './ExpertLandingPage.css';

const { Title, Paragraph } = Typography;

const ExpertLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: "ВАША АНКЕТА",
      description: "Сделайте себя заметным для клиентов вашего города и вашего направления. Настройте ваши социальные сети, персональные ссылки и информацию.",
      image: "/anketa.png"
    },
    {
      title: "ВАШИ УСЛУГИ", 
      description: "Вас легко найдут, благодаря удобному расширенному поиску. Размещайте ваши персональные услуги и получайте стабильные заказы.",
      image: "/serv.png"
    },
    {
      title: "ВАШИ ЗНАНИЯ",
      description: "Ваши знания будут доступны не только на нашей платформе, но и в поисковиках Google, Yandex и других. Публикуйте ваши статьи и материалы, вдохновляйте читателей и становитесь узнаваемым",
      image: "/anketa.png" // Заглушка, так как изображение не указано
    },
    {
      title: "ВАШИ МЕРОПРИЯТИЯ",
      description: "Пусть о вашем мероприятии узнают все! Организуйте ваши офлайн мероприятия: тренинги, семинары, ретриты, мастер-классы",
      image: "/events.png"
    },
    {
      title: "ВАШИ ЦИФРОВЫЕ ПРОДУКТЫ",
      description: "Найдите свою аудиторию и монетизируйте свой опыт! Размещайте и продавайте ваши уникальные обучающие программы, полезные курсы и вебинары.",
      image: "/prod.png"
    },
    {
      title: "ВАШ БРЕНД",
      description: "Наслаждайтесь! Пока вы занимаетесь тем, что любите, наша платформа заботится о вашем успехе. Прозрачные оценки и отзывы реальных людей помогут вам завоевать доверие и стать по-настоящему узнаваемым экспертом.",
      image: "/brand.png"
    }
  ];

  return (
    <div className="expert-landing-container">
      {/* Header Image Placeholder */}
      <div className="header-image">
        <div className="header-icon-main">🧘‍♀️</div>
        <div className="header-icon-1">✨</div>
        <div className="header-icon-2">🌟</div>
      </div>

      {/* Back Button */}
      <div className="back-button-container">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="back-button"
        >
          Назад
        </Button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Title Section */}
        <div className="title-section">
          <Title level={1} className="title">
            ВОЗМОЖНОСТИ ЭКСПЕРТА:
          </Title>
          <div className="title-line"></div>
        </div>

        {/* Features Container */}
        <div className="features-container">
          {features.map((feature, index) => (
            <div key={index} className="feature-block">
              <div className="feature-content">
                <Title level={3} className="feature-title">
                  {feature.title}
                </Title>
                
                <Paragraph className="feature-description">
                  {feature.description}
                </Paragraph>
              </div>
              
              <div className="feature-image">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '16px'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f0f0f0; color: #8b5cf6; font-size: 48px; opacity: 0.3;">📷</div>';
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action Section */}
        <div className="cta-section">
          {/* Background Pattern Placeholder */}
          <div className="cta-pattern-1">🌸</div>
          <div className="cta-pattern-2">🌺</div>
          
          <Title level={2} className="cta-title">
            Выберите профессиональный профиль эксперта — и начните формировать свой личный бренд, который будет работать на вас!
          </Title>
          
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handlePayment}
            className="cta-button"
          >
            Перейти к оплате
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpertLandingPage;
