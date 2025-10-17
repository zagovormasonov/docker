import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Card, Space, Divider } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

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

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgb(180 194 255) 0%, rgb(245 236 255) 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: 24 }}
        >
          Назад
        </Button>

        <Card style={{ 
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          marginBottom: 24
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={1} style={{ color: '#1d1d1f', marginBottom: 16 }}>
              Привилегии эксперта
            </Title>
            <Paragraph style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
              Приобретая профессиональный профиль, вы получаете прямой доступ к активной аудитории, 
              выбирающей осознанное развитие и готовой к трансформации.
            </Paragraph>
          </div>

          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
            Преимущества экспертной подписки
          </Title>

          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <Card style={{ border: '1px solid #e8e8e8', borderRadius: 12 }}>
              <Title level={3} style={{ color: '#1d1d1f', marginBottom: 12 }}>
                Ваша анкета
              </Title>
              <Paragraph style={{ color: '#666', margin: 0 }}>
                Настройте ваши социальные сети, персональные ссылки и информацию. 
                Сделайте себя заметным для клиентов вашего города и вашего направления.
              </Paragraph>
            </Card>

            <Card style={{ border: '1px solid #e8e8e8', borderRadius: 12 }}>
              <Title level={3} style={{ color: '#1d1d1f', marginBottom: 12 }}>
                Ваши услуги
              </Title>
              <Paragraph style={{ color: '#666', margin: 0 }}>
                Размещайте ваши персональные услуги и получайте стабильные заказы. 
                Вас легко найдут, благодаря удобному расширенному поиску
              </Paragraph>
            </Card>

            <Card style={{ border: '1px solid #e8e8e8', borderRadius: 12 }}>
              <Title level={3} style={{ color: '#1d1d1f', marginBottom: 12 }}>
                Ваши знания
              </Title>
              <Paragraph style={{ color: '#666', margin: 0 }}>
                Публикуйте ваши статьи и материалы, вдохновляйте читателей и становитесь узнаваемым экспертом. 
                Ваши знания будут доступны не только на нашей платформе, но и в поисковиках Google, Yandex и других.
              </Paragraph>
            </Card>

            <Card style={{ border: '1px solid #e8e8e8', borderRadius: 12 }}>
              <Title level={3} style={{ color: '#1d1d1f', marginBottom: 12 }}>
                Ваши мероприятия
              </Title>
              <Paragraph style={{ color: '#666', margin: 0 }}>
                Организуйте ваши офлайн мероприятия: тренинги, семинары, ретриты, мастер-классы. 
                Пусть о вашем мероприятии узнают все!
              </Paragraph>
            </Card>

            <Card style={{ border: '1px solid #e8e8e8', borderRadius: 12 }}>
              <Title level={3} style={{ color: '#1d1d1f', marginBottom: 12 }}>
                Ваши цифровые продукты
              </Title>
              <Paragraph style={{ color: '#666', margin: 0 }}>
                Размещайте и продавайте ваши уникальные обучающие программы, полезные курсы и вебинары. 
                Найдите свою аудиторию и монетизируйте свой опыт!
              </Paragraph>
            </Card>

            <Card style={{ border: '1px solid #e8e8e8', borderRadius: 12 }}>
              <Title level={3} style={{ color: '#1d1d1f', marginBottom: 12 }}>
                Ваш бренд
              </Title>
              <Paragraph style={{ color: '#666', margin: 0 }}>
                Наслаждайтесь! Пока вы занимаетесь тем, что любите, наша платформа заботится о вашем успехе. 
                Прозрачные оценки и отзывы реальных людей помогут вам завоевать доверие и стать по-настоящему узнаваемым экспертом.
              </Paragraph>
            </Card>
          </Space>

          <Divider />

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ color: '#1d1d1f', marginBottom: 16 }}>
              Станьте тем, кто вдохновляет
            </Title>
            <Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
              Выберите профессиональный профиль эксперта — и начните формировать свой личный бренд, 
              который будет работать на вас!
            </Paragraph>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handlePayment}
              style={{
                height: 56,
                fontSize: 18,
                fontWeight: 600,
                background: '#1d1d1f',
                border: 'none',
                borderRadius: 28,
                padding: '0 48px',
                marginBottom: 16
              }}
            >
              Перейти к оплате
            </Button>
            <div style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 14, color: '#999' }}>
                Пожизненный доступ за 990 ₽
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ 
                  textDecoration: 'line-through', 
                  color: '#86868b',
                  fontSize: 16,
                  marginRight: 12
                }}>
                  3369 Р
                </Text>
                <Text style={{ 
                  color: '#ff4d4f',
                  fontSize: 20,
                  fontWeight: '600'
                }}>
                  990 Руб.
                </Text>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExpertLandingPage;
