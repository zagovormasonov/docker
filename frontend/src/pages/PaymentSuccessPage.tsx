import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Typography, Space, Spin, message } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Paragraph } = Typography;

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const paymentId = searchParams.get('payment_id');
        if (!paymentId) {
          message.error('Не найден ID платежа');
          navigate('/profile');
          return;
        }

        const response = await fetch(`/api/payments/status/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPaymentStatus(data);
          
          if (data.status === 'succeeded' && data.user_type === 'expert') {
            updateUser({ ...user, userType: 'expert' });
            
            // Отправляем письмо с подтверждением регистрации
            try {
              await fetch('/api/auth/send-confirmation-email', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  email: user?.email,
                  name: user?.name
                })
              });
            } catch (error) {
              console.error('Ошибка отправки письма подтверждения:', error);
            }
          }
        } else {
          message.error('Ошибка проверки статуса платежа');
        }
      } catch (error) {
        console.error('Ошибка:', error);
        message.error('Ошибка соединения с сервером');
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams, user, updateUser, navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Card style={{ textAlign: 'center' }}>
          {paymentStatus?.status === 'succeeded' ? (
            <>
              <CheckCircleOutlined 
                style={{ 
                  fontSize: 64, 
                  color: '#52c41a', 
                  marginBottom: 24 
                }} 
              />
              <Title level={2} style={{ color: '#52c41a', marginBottom: 16 }}>
                Оплата успешна!
              </Title>
              <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
                Поздравляем! Вы успешно стали экспертом. Теперь у вас есть доступ ко всем функциям эксперта.
                На ваш email отправлено письмо с подтверждением регистрации.
              </Paragraph>
              
              <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 32 }}>
                <div style={{ 
                  background: '#f6ffed', 
                  border: '1px solid #b7eb8f', 
                  borderRadius: 8, 
                  padding: 16 
                }}>
                  <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                    Что дальше?
                  </Title>
                  <ul style={{ textAlign: 'left', marginTop: 12 }}>
                    <li>Заполните свой профиль эксперта</li>
                    <li>Добавьте тематики вашей экспертизы</li>
                    <li>Создайте первую статью</li>
                    <li>Добавьте услуги и мероприятия</li>
                  </ul>
                </div>
              </Space>

              <Space size="large">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => navigate('/profile')}
                  style={{
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    background: '#1d1d1f',
                    border: 'none',
                    borderRadius: 24,
                    padding: '0 32px'
                  }}
                >
                  Перейти в профиль
                </Button>
                <Button 
                  size="large"
                  onClick={() => navigate('/')}
                  style={{
                    height: 48,
                    fontSize: 16,
                    borderRadius: 24,
                    padding: '0 32px'
                  }}
                >
                  На главную
                </Button>
              </Space>
            </>
          ) : (
            <>
              <Title level={2} style={{ color: '#ff4d4f', marginBottom: 16 }}>
                Ошибка оплаты
              </Title>
              <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
                К сожалению, произошла ошибка при обработке платежа. 
                Статус: {paymentStatus?.status || 'неизвестно'}
              </Paragraph>
              
              <Space size="large">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => navigate('/become-expert')}
                  style={{
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    background: '#1d1d1f',
                    border: 'none',
                    borderRadius: 24,
                    padding: '0 32px'
                  }}
                >
                  Попробовать снова
                </Button>
                <Button 
                  size="large"
                  onClick={() => navigate('/profile')}
                  style={{
                    height: 48,
                    fontSize: 16,
                    borderRadius: 24,
                    padding: '0 32px'
                  }}
                >
                  В профиль
                </Button>
              </Space>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

