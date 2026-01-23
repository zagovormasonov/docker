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
  const [useBonuses, setUseBonuses] = useState(false);

  const fromRegistration = searchParams.get('from') === 'registration';

  useEffect(() => {
    // Проверяем, пришли ли мы с регистрации
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
      price: 3369,
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
        // Если есть данные регистрации и пользователь НЕ авторизован
        if (registrationData && !user) {
          try {
            await register(
              registrationData.email,
              registrationData.password,
              registrationData.name,
              'client',
              registrationData.referralCode
            );
          } catch (regError: any) {
            // Если пользователь уже существует (400 или 409), просто продолжаем к логину
            if (regError.response?.status !== 409 && regError.response?.status !== 400) {
              throw regError;
            }
          }

          // Очищаем данные регистрации
          localStorage.removeItem('registrationData');

          // Автоматически авторизуем пользователя
          try {
            await login(registrationData.email, registrationData.password);
          } catch (loginError: any) {
            if (loginError.response?.status === 403) {
              Modal.success({
                title: 'Регистрация успешна!',
                content: 'Аккаунт создан. Пожалуйста, подтвердите свой email из письма, которое мы вам отправили. После подтверждения вы сможете стать экспертом по специальной цене.',
                onOk: () => {
                  navigate('/login');
                }
              });
              setLoading(false);
              return;
            }
            throw loginError;
          }

          Modal.success({
            title: 'Регистрация успешна!',
            content: 'Теперь вы зарегистрированы. Перейдите в профиль, чтобы продолжить.',
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
            const data = await response.json();

            // Сохраняем новый токен и обновляем пользователя
            if (data.token && data.user) {
              localStorage.setItem('token', data.token);
              await login(data.token, data.user);
            } else {
              // Fallback: обновляем только локальное состояние
              updateUser({ ...user, userType: 'expert' });
            }

            Modal.success({
              title: 'Поздравляем!',
              content: 'Теперь вы эксперт! Вы можете публиковать статьи и события.',
              onOk: () => {
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
      let plan = paymentPlans.find(p => p.id === selectedPlan);
      if (!plan) return;

      // Если это реферальная ссылка и выбран годовой план - перезаписываем базовую цену на 400
      const isReferredYearly = selectedPlan === 'yearly' && (user?.referredById || registrationData?.referralCode);
      if (isReferredYearly) {
        plan = { ...plan, price: 400 };
      }

      setLoading(true);
      try {
        // Если есть данные регистрации и пользователь НЕ авторизован
        if (registrationData && !user) {
          try {
            await register(
              registrationData.email,
              registrationData.password,
              registrationData.name,
              'client',
              registrationData.referralCode
            );
          } catch (regError: any) {
            // Если пользователь уже существует (400 или 409), просто продолжаем к логину
            if (regError.response?.status !== 409 && regError.response?.status !== 400) {
              throw regError;
            }
          }

          // Автоматически авторизуем пользователя
          try {
            await login(registrationData.email, registrationData.password);
          } catch (loginError: any) {
            // Если email не подтвержден, показываем модальное окно
            if (loginError.response?.status === 403) {
              Modal.success({
                title: 'Регистрация успешна!',
                content: 'Аккаунт создан. Для получения скидки по реферальной ссылке и проведения оплаты, пожалуйста, подтвердите свой email из письма, которое мы вам отправили.',
                onOk: () => {
                  navigate('/login');
                }
              });
              setLoading(false);
              return;
            }
            throw loginError;
          }

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
            description: `Подписка "${plan.name}" - ${plan.description}`,
            useBonuses: useBonuses
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
              {paymentPlans
                .filter(plan => {
                  if (fromRegistration) {
                    return plan.id === 'yearly';
                  }
                  return true;
                })
                .map((originalPlan) => {
                  const isReferredYearly = originalPlan.id === 'yearly' && (user?.referredById || registrationData?.referralCode);

                  // If referred, force the base price to be 400
                  const plan = isReferredYearly
                    ? { ...originalPlan, price: 400 }
                    : originalPlan;

                  const isVerified = user?.emailVerified;
                  const displayPrice = (isReferredYearly && isVerified) ? Math.max(0, plan.price - 300) : plan.price;

                  return (
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
                                {displayPrice === 0 ? 'Бесплатно' : `${displayPrice} ₽`}
                              </Text>
                              <Text type="secondary" style={{ marginLeft: 8 }}>
                                {plan.duration}
                              </Text>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            {displayPrice === 0 ? (
                              <Text style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                                Бесплатно
                              </Text>
                            ) : (
                              <div>
                                <Text style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f' }}>
                                  {displayPrice} ₽
                                </Text>
                                {(plan.id === 'yearly' || isReferredYearly) && (
                                  <div style={{ marginTop: 4 }}>
                                    <Text
                                      style={{
                                        textDecoration: 'line-through',
                                        color: '#86868b',
                                        fontSize: 14
                                      }}
                                    >
                                      {plan.price === 400 ? '400 ₽' : '3499 ₽'}
                                    </Text>
                                    {isReferredYearly && (
                                      <div style={{ color: isVerified ? '#52c41a' : '#faad14', fontSize: 12 }}>
                                        {isVerified
                                          ? 'Скидка по приглашению -300₽ (Итого: 100₽)'
                                          : 'Подтвердите email, чтобы получить скидку 300₽'}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Radio>
                  );
                })}
            </Space>
          </Radio.Group>

          {selectedPlan !== 'free' && user?.bonuses ? (
            <div style={{ marginTop: 24, padding: '16px', background: '#f5f5f5', borderRadius: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>У вас есть {user.bonuses} бонусов</Text>
                  <Button
                    type={useBonuses ? "primary" : "default"}
                    size="small"
                    onClick={() => setUseBonuses(!useBonuses)}
                  >
                    {useBonuses ? "Использовать" : "Применить"}
                  </Button>
                </div>
                {useBonuses && (
                  <Text type="success" style={{ fontSize: 12 }}>
                    Будет списано до {user.bonuses} бонусов при оплате
                  </Text>
                )}
              </Space>
            </div>
          ) : null}

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
    </div >
  );
};

export default BecomeExpertPage;

