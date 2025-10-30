import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
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
  const [loading, setLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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
        'Soul Synergy — платформа, объединяющая экспертов и клиентов в сфере духовного и оздоровительного развития. Если вы терапевт, психолог, нумеролог, целитель, рунический специалист, массажист или предлагаете другие услуги помощи людям — это идеальное место для привлечения новых клиентов и развития личного бренда.'
    },
    {
      question: 'Что входит в профиль эксперта за 3369 рублей?',
      answer:
        'Профиль эксперта — это полноценная страница с вашими услугами, опытом и квалификацией. Вы настраиваете анкету, добавляете соцсети, описания услуг и консультаций с ценами, публикуете статьи и мероприятия. Также можно размещать цифровые товары: курсы, интенсивы, гайды — и продавать их прямо из профиля.'
    },
    {
      question: 'На какой срок приобретается профиль эксперта? Нужно ли его продлевать?',
      answer:
        'Профиль эксперта приобретается пожизненно. Разовая покупка — и неограниченный доступ ко всем возможностям платформы без ежемесячных или ежегодных платежей.'
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

        {/* Call to Action Section */}
        <div className="cta-section">
          <div className="cta-content">
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
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <span style={{ 
                textDecoration: 'line-through', 
                color: '#86868b',
                fontSize: '18px',
                marginRight: '12px',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                3369 ₽
              </span>
              <span style={{ 
                color: '#ff4d4f',
                fontSize: '24px',
                fontWeight: '600',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                990 ₽
              </span>
            </div>
          </div>
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
    </div>
  );
};

export default ExpertLandingPage;
