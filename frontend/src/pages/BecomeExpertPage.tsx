import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Typography, Space, Radio, message, Modal } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import ExpertBenefitsCard from '../components/ExpertBenefitsCard';

const { Title, Text } = Typography;

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  popular?: boolean;
}

const BecomeExpertPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser, register, login } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);

  useEffect(() => {
    // Проверяем, пришли ли мы с регистрации
    const fromRegistration = searchParams.get('from') === 'registration';
    const planFromUrl = searchParams.get('plan');
    
    if (fromRegistration) {
      // Загружаем данные регистрации из localStorage
      const savedData = localStorage.getItem('registrationData');
      if (savedData) {
        setRegistrationData(JSON.parse(savedData));
      }
      
      // Устанавливаем предвыбранный план
      if (planFromUrl === 'yearly') {
        setSelectedPlan('yearly');
      }
    }
  }, [searchParams]);

  const paymentPlans: PaymentPlan[] = [
    {
      id: 'free',
      name: 'Бесплатно',
      price: 0,
      duration: 'Пробный период',
      description: 'Получите доступ к функциям эксперта на ограниченное время'
    },
    {
      id: 'yearly',
      name: 'Эксперт на год',
      price: 990,
      duration: '365 дней',
      description: 'Полный доступ ко всем функциям эксперта на год',
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Пожизненный доступ',
      price: 3369,
      duration: 'Навсегда',
      description: 'Пожизненный доступ ко всем функциям эксперта'
    }
  ];

  const handlePayment = async () => {
    if (selectedPlan === 'free') {
      // Бесплатное становление экспертом
      setLoading(true);
      try {
        // Если есть данные регистрации, сначала регистрируем пользователя
        if (registrationData) {
          const result = await register(
            registrationData.email, 
            registrationData.password, 
            registrationData.name, 
            'expert'
          );
          
          // Очищаем данные регистрации
          localStorage.removeItem('registrationData');
          
          // Автоматически авторизуем пользователя
          await login(registrationData.email, registrationData.password);
          
          Modal.success({
            title: 'Регистрация и активация эксперта успешны!',
            content: 'Теперь вы зарегистрированы как эксперт. Проверьте email для подтверждения аккаунта.',
            onOk: () => {
              navigate('/profile');
            }
          });
        } else {
          // Обычное становление экспертом для уже зарегистрированного пользователя
          const response = await fetch('/api/users/become-expert', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            Modal.success({
              title: 'Поздравляем!',
              content: 'Теперь вы эксперт! Обновите страницу для применения изменений.',
              onOk: () => {
                updateUser({ ...user, userType: 'expert' });
                navigate('/profile');
              }
            });
          } else {
            const error = await response.json();
            message.error(error.error || 'Ошибка становления экспертом');
          }
        }
      } catch (error: any) {
        console.error('Ошибка:', error);
        message.error(error.response?.data?.error || 'Ошибка соединения с сервером');
      } finally {
        setLoading(false);
      }
    } else {
      // Платное становление экспертом через Юкассу
      const plan = paymentPlans.find(p => p.id === selectedPlan);
      if (!plan) return;

      setLoading(true);
      try {
        // Если есть данные регистрации, сначала регистрируем пользователя
        if (registrationData) {
          const result = await register(
            registrationData.email, 
            registrationData.password, 
            registrationData.name, 
            'expert'
          );
          
          // Автоматически авторизуем пользователя
          await login(registrationData.email, registrationData.password);
          
          // Очищаем данные регистрации
          localStorage.removeItem('registrationData');
        }

        // Создаем платеж через Юкассу
        const response = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            planId: selectedPlan,
            amount: plan.price,
            description: `Подписка "${plan.name}" - ${plan.description}`
          })
        });

        if (response.ok) {
          const paymentData = await response.json();
          
          // Перенаправляем на страницу оплаты Юкассы
          if (paymentData.payment_url) {
            window.location.href = paymentData.payment_url;
          } else {
            message.error('Ошибка создания платежа');
          }
        } else {
          const error = await response.json();
          message.error(error.error || 'Ошибка создания платежа');
        }
      } catch (error) {
        console.error('Ошибка:', error);
        message.error('Ошибка соединения с сервером');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Назад
      </Button>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={1} style={{ textAlign: 'center', marginBottom: 32 }}>
          {registrationData ? 'Завершите регистрацию эксперта' : 'Стать экспертом'}
        </Title>
        
        {registrationData && (
          <Card style={{ marginBottom: 24, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                Регистрация: {registrationData.name} ({registrationData.email})
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                После оплаты ваш аккаунт будет активирован как эксперт
              </Text>
            </div>
          </Card>
        )}

        <ExpertBenefitsCard showPricing={false} />

        <Card style={{ marginBottom: 24 }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
            Выберите тариф
          </Title>

          <Radio.Group 
            value={selectedPlan} 
            onChange={(e) => setSelectedPlan(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {paymentPlans.map((plan) => (
                <Radio key={plan.id} value={plan.id} style={{ width: '100%' }}>
                  <Card
                    style={{
                      width: '100%',
                      border: selectedPlan === plan.id ? '2px solid #6366f1' : '1px solid #d9d9d9',
                      background: plan.popular ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : '#fff',
                      position: 'relative'
                    }}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute',
                        top: -8,
                        right: 16,
                        background: '#52c41a',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Популярный
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Title level={4} style={{ margin: 0, color: '#1d1d1f' }}>
                          {plan.name}
                        </Title>
                        <Text type="secondary">{plan.description}</Text>
                        <div style={{ marginTop: 8 }}>
                          <Text strong style={{ color: '#1d1d1f' }}>
                            {plan.price === 0 ? 'Бесплатно' : `${plan.price} ₽`}
                          </Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            {plan.duration}
                          </Text>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        {plan.price === 0 ? (
                          <Text style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                            Бесплатно
                          </Text>
                        ) : (
                          <div>
                            <Text style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f' }}>
                              {plan.price} ₽
                            </Text>
                            {plan.id === 'yearly' && (
                              <div style={{ marginTop: 4 }}>
                                <Text 
                                  style={{ 
                                    textDecoration: 'line-through', 
                                    color: '#86868b',
                                    fontSize: 14
                                  }}
                                >
                                  3499 ₽
                                </Text>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Radio>
              ))}
            </Space>
          </Radio.Group>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handlePayment}
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                background: '#1d1d1f',
                border: 'none',
                borderRadius: 24,
                padding: '0 48px'
              }}
            >
              {selectedPlan === 'free' ? 'Получить бесплатно' : 'Оплатить'}
            </Button>
          </div>
        </Card>

        <Card>
          <Title level={4} style={{ textAlign: 'center', marginBottom: 16 }}>
            Что вы получите:
          </Title>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 12 }} />
              <Text>Размещение персональной информации и уникального профиля в каталоге</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 12 }} />
              <Text>Публикация, продвижение и продажа собственных онлайн-курсов</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 12 }} />
              <Text>Размещение и продвижение собственных мероприятий</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 12 }} />
              <Text>Публикация статей и экспертных материалов</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 12 }} />
              <Text>Прямая продажа услуг через платформу</Text>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default BecomeExpertPage;

