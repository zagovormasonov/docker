import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Space } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftOutlined, DownOutlined } from '@ant-design/icons';
import './ExpertLandingPage.css';

// Предзагрузка изображений
const preloadImages = () => {
  const imageUrls = [
    '/hero.png',
    '/anketa.png',
    '/serv.png',
    '/know.png',
    '/events.png',
    '/prod.png',
    '/brand.png',
    '/bg.png'
  ];

  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

const { Title, Paragraph } = Typography;

const ExpertLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isExpertOrAdmin = user?.userType === 'expert' || user?.userType === 'admin';
  const [loading, setLoading] = useState(false);
  const [useBonuses, setUseBonuses] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingYearly, setLoadingYearly] = useState(false);

  useEffect(() => {
    // Предзагружаем изображения при загрузке компонента
    preloadImages();

    const handleScroll = () => {
      // Отключаем параллакс на мобильных устройствах для лучшей производительности
      if (window.innerWidth > 768) {
        const maxScroll = 400; // Максимальное смещение в пикселях
        const currentScroll = Math.min(window.scrollY, maxScroll);
        setScrollY(currentScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Проверяем якор #pricing и прокручиваем к секции оплаты
    if (window.location.hash === '#pricing') {
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing-section');
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handlePayment = async (amount: number, isMonthly: boolean) => {
    const setPlanLoading = isMonthly ? setLoadingMonthly : setLoadingYearly;
    setPlanLoading(true);

    try {
      if (!user) {
        navigate('/register');
        return;
      }

      const response = await fetch('/api/users/become-expert', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      navigate(response.ok ? '/expert-dashboard' : '/profile');
    } catch (error) {
      console.error('Expert activation error:', error);
      navigate('/profile');
    } finally {
      setPlanLoading(false);
    }
    return;

    const isLoading = isMonthly ? loadingMonthly : loadingYearly;
    if (isLoading) return; // Предотвращаем двойной клик

    if (isMonthly) {
      setLoadingMonthly(true);
    } else {
      setLoadingYearly(true);
    }

    try {
      // Создаем платеж через Юкассу
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: isMonthly ? 'monthly' : 'yearly',
          amount: amount,
          description: isMonthly
            ? 'Ежемесячная подписка на функции эксперта'
            : 'Ежегодная подписка на функции эксперта',
          isRecurring: true,
          recurringInterval: isMonthly ? 'month' : 'year',
          useBonuses: useBonuses
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
      if (isMonthly) {
        setLoadingMonthly(false);
      } else {
        setLoadingYearly(false);
      }
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
      image: "/know.png" // Заглушка, так как изображение не указано
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

  const faqData = [
    {
      question: 'Что такое Soul Synergy и для кого эта платформа?',
      answer:
        'Soul Synergy - это платформа, объединяющая экспертов и клиентов в сфере духовного, личностного и физического развития. Если вы терапевт, психолог, нумеролог, целитель, рунический специалист, массажист или предлагаете другие услуги помощи людям, наша платформа - идеальное место для привлечения новых клиентов и развития вашего личного бренда.'
    },
    {
      question: 'Что входит в профиль эксперта ',
      answer:
        'Профиль эксперта даёт вам возможность создать полноценную страницу с информацией о ваших услугах, опыте и квалификации. Вы сможете настроить свою анкету, указать ссылки на социальные сети, добавить подробное описание своих услуг и консультаций, указать их стоимость, делиться знаниями через статьи и добавлять информацию о предстоящих мероприятиях. Также вы сможете размещать цифровые товары, такие как курсы, интенсивы и гайды, и продавать их прямо в своём профиле. Период доступа к возможностям определяется выбранным планом подписки.'
    },
    {
      question: 'Как я могу привлекать клиентов через Soul Synergy?',
      answer:
        'Благодаря SEO-оптимизации ваши статьи, профиль и события легко находятся в поисковых системах Google и Яндекс. Дополнительно продвигайте профиль и статьи в соцсетях, направляя трафик на платформу.'
    },
    {
      question: 'Могу ли я публиковать статьи на платформе? Какие требования к ним предъявляются?',
      answer:
        'Да. Публикуйте материалы на духовные и оздоровительные темы. Требование — полезный контент без прямой рекламы услуг. Все статьи проходят модерацию для поддержания качества.'
    },
    {
      question: 'Как я могу размещать свои мероприятия и события на платформе?',
      answer:
        'В разделе «События» размещайте информацию о предстоящих мастер-классах, семинарах, ретритах и др. Это помогает привлекать аудиторию и повышать узнаваемость бренда.'
    },
    {
      question: 'Как я могу продавать свои цифровые товары на Soul Synergy?',
      answer:
        'Размещайте курсы, интенсивы, медитации и другие цифровые продукты в профиле, указывая стоимость и условия приобретения.'
    },
    {
      question: 'Если я не эксперт, могу ли я зарегистрироваться на платформе?',
      answer:
        'Да. Регистрируйтесь как пользователь, чтобы читать статьи, следить за событиями, находить экспертов и приобретать цифровые товары.'
    },
    {
      question: 'Что делать, если у меня возникли вопросы по работе с платформой?',
      answer:
        'Обратитесь в службу поддержки Soul Synergy через кнопку «Поддержка» рядом со значком профиля или по электронной почте — мы поможем разобраться с любыми вопросами.'
    }
  ];

  return (
    <div className="expert-landing-container">
      {/* Header Image */}
      <div
        className="header-image"
        style={{
          backgroundPosition: `center ${50 - scrollY * 0.3}%`
        }}
      >
        <div className="header-text-container">
          <div className="header-text-main">
            СТАНЬТЕ ТЕМ, КТО ВДОХНОВЛЯЕТ
          </div>
          <div className="header-text-subtitle">
            SOUL SYNERGY: СИНЕРГИЯ В ЕДИНСТВЕ
          </div>
        </div>
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
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
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

        {/* Call to Action Section - без подложки, на весь контейнер */}
        <div style={{
          marginBottom: 40
        }} id="pricing-section">
          {isExpertOrAdmin ? (
            <div style={{
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: 24,
              padding: '40px 24px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
            }}>
              <Title level={2} style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 700,
                fontSize: 32,
                color: '#1d1d1f',
                margin: '0 0 16px 0'
              }}>
                Вы уже эксперт SoulSynergy
              </Title>
              <p style={{
                fontSize: 14,
                color: 'grey',
                lineHeight: 1.6,
                margin: '0 0 24px',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                Управляйте профилем, расписанием, услугами и цифровыми продуктами в кабинете мастера.
              </p>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/expert-dashboard')}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: 'Montserrat, sans-serif',
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: 25,
                  padding: '0 28px'
                }}
              >
                Перейти в кабинет
              </Button>
            </div>
          ) : (
            <>
              <div style={{
                textAlign: 'center',
                marginBottom: 48
              }}>
                <Title level={2} style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: 32,
                  color: '#1d1d1f',
                  margin: '0 0 16px 0'
                }}>
                  Выберите профессиональный профиль
                </Title>

                <p style={{
                  fontSize: 14,
                  color: 'grey',
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  Начните формировать свой личный бренд, который будет работать на вас!
                </p>
              </div>

              {/* Pricing Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 24,
                marginBottom: 32
              }}>
            {/* Monthly Plan */}
            <div style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: 32,
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 20,
                fontWeight: 600,
                color: '#1d1d1f',
                margin: '0 0 12px 0'
              }}>
                Месячный план
              </h3>
              <div style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 44,
                fontWeight: 700,
                color: 'black',
                margin: '12px 0 24px 0'
              }}>
                Бесплатно
              </div>
              <p style={{
                fontSize: 14,
                color: 'gray',
                lineHeight: 1.6,
                margin: '0 0 24px 0',
                fontFamily: 'Montserrat, sans-serif',
                flex: 1
              }}>
                Месячная подписка - твой комфортный старт. Ты можешь узнать платформу поближе и исследовать все возможности
              </p>
              <Button
                type="primary"
                size="large"
                loading={loadingMonthly}
                onClick={() => handlePayment(790, true)}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: 'Montserrat, sans-serif',
                  background: '#d4c5f9',
                  border: 'none',
                  borderRadius: 25,
                  width: '100%',
                  color: 'rgb(123, 88, 209)'
                }}
              >
                Выбрать
              </Button>
            </div>

            {/* Yearly Plan */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
              borderRadius: 20,
              padding: 32,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                position: 'absolute',
                top: -12,
                right: 20,
                background: '#ffffff',
                color: '#6366f1',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Цена раннего доступа
              </div>

              <h3 style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 20,
                fontWeight: 600,
                color: '#ffffff',
                margin: '0 0 12px 0'
              }}>
                Годовой план
              </h3>
              <div style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 44,
                fontWeight: 700,
                color: '#ffffff',
                margin: '12px 0 8px 0'
              }}>
                Бесплатно
              </div>
              {user?.referredById && (
                <div style={{ color: 'white', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                  Экспертный статус теперь доступен без оплаты
                </div>
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24,
                fontFamily: 'Montserrat, sans-serif'
              }}>
                <span style={{
                  textDecoration: 'line-through',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: 14
                }}>
                  0 ₽
                </span>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  -85%
                </span>
              </div>
              <p style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.6,
                margin: '0 0 24px 0',
                fontFamily: 'Montserrat, sans-serif',
                flex: 1
              }}>
                Присоединись на целый год - получи лучшие условия! Пока мы в стадии предзапуска действует уникальная цена для первых участников.
              </p>
              <Button
                type="primary"
                size="large"
                loading={loadingYearly}
                onClick={() => handlePayment(3369, false)}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: 'Montserrat, sans-serif',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: 25,
                  width: '100%',
                  color: '#6366f1'
                }}
              >
                Выбрать
              </Button>
              {user && user.bonuses && user.bonuses > 0 ? (
                <div
                  onClick={() => setUseBonuses(!useBonuses)}
                  style={{
                    marginTop: 12,
                    color: 'white',
                    fontSize: 12,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {useBonuses ? `Списать ${user.bonuses} бонусов (отмена)` : `Списать ${user.bonuses} бонусов`}
                </div>
              ) : null}
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <div className="main-content">
          <Title level={2} className="faq-title">
            Часто задаваемые вопросы
          </Title>

          {faqData.map((faq, index) => (
            <div key={index} className="faq-item">
              <div
                className="faq-question"
                onClick={() => toggleFaq(index)}
              >
                <span>{faq.question}</span>
                <DownOutlined
                  className={`faq-icon ${openFaq === index ? 'active' : ''}`}
                />
              </div>
              <div className={`faq-answer ${openFaq === index ? 'active' : ''}`}>
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Background Image */}
      <div className="footer-bg"></div>
    </div >
  );
};

export default ExpertLandingPage;
