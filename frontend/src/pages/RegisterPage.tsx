import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Radio, Modal, Checkbox, Space, Divider } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import emailjs from '@emailjs/browser';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('client');
  const { register } = useAuth();
  const navigate = useNavigate();

  const sendVerificationEmail = async (email: string, name: string, verificationToken: string) => {
    try {
      const verificationUrl = `${window.location.origin}/verify-email?token=${verificationToken}`;
      
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_VERIFICATION_TEMPLATE_ID,
        {
          to_email: email,
          to_name: name,
          verification_url: verificationUrl,
          app_name: 'SoulSynergy'
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      
      return true;
    } catch (error) {
      console.error('Ошибка отправки email:', error);
      return false;
    }
  };

  const onFinish = async (values: any) => {
    // Если выбран тип "эксперт", регистрируем и переходим к оплате
    if (values.userType === 'expert') {
      setLoading(true);
      try {
        // Сначала регистрируем пользователя
        const result = await register(values.email, values.password, values.name, 'expert');
        
        // Создаем платеж через Юкассу
        const paymentResponse = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${result.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            planId: 'lifetime',
            amount: 990,
            description: 'Пожизненный доступ к функциям эксперта'
          })
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          
          // Перенаправляем на страницу оплаты Юкассы
          if (paymentData.payment_url) {
            window.location.href = paymentData.payment_url;
          } else {
            message.error('Ошибка создания платежа');
          }
        } else {
          const error = await paymentResponse.json();
          message.error(error.error || 'Ошибка создания платежа');
        }
      } catch (error: any) {
        if (error.response?.status === 409) {
          message.error('Email уже занят в системе. Пожалуйста, введите другой email.');
        } else {
          message.error(error.response?.data?.error || 'Ошибка регистрации');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Обычная регистрация для клиентов
    setLoading(true);
    try {
      const result = await register(values.email, values.password, values.name, values.userType);
      
      // Отправка email верификации
      const emailSent = await sendVerificationEmail(
        result.user.email,
        result.user.name,
        result.user.verificationToken
      );
      
      if (emailSent) {
        Modal.success({
          title: 'Регистрация успешна!',
          content: (
            <div>
              <p>На ваш email <strong>{result.user.email}</strong> отправлено письмо с подтверждением.</p>
              <p>Пожалуйста, проверьте почту и перейдите по ссылке для активации аккаунта.</p>
            </div>
          ),
          okText: 'Понятно',
          onOk: () => navigate('/login')
        });
      } else {
        message.warning('Регистрация выполнена, но не удалось отправить email. Обратитесь в поддержку.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, rgb(180 194 255) 0%, rgb(245 236 255) 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>Регистрация</Title>
          <Text type="secondary">Присоединяйтесь к сообществу Synergy</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          initialValues={{ userType: 'client' }}
        >
          <Form.Item
            name="name"
            rules={[
              { required: true, message: 'Введите имя' },
              { min: 2, message: 'Минимум 2 символа' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Имя"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Неверный формат email' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Минимум 6 символов' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
            />
          </Form.Item>

          <Form.Item
            name="userType"
            label="Тип аккаунта"
            rules={[{ required: true }]}
          >
            <Radio.Group 
              onChange={(e) => setSelectedUserType(e.target.value)}
            >
              <Radio.Button 
                value="client" 
                style={{ 
                  width: '50%', 
                  textAlign: 'center', 
                  whiteSpace: 'nowrap',
                  background: selectedUserType === 'client' ? '#6366f1' : '#fff',
                  color: selectedUserType === 'client' ? '#fff' : '#000',
                  borderColor: selectedUserType === 'client' ? '#6366f1' : '#d9d9d9'
                }}
              >
                Я - клиент
              </Radio.Button>
              <Radio.Button 
                value="expert" 
                style={{ 
                  width: '50%', 
                  textAlign: 'center', 
                  marginLeft: '0%', 
                  whiteSpace: 'nowrap',
                  background: selectedUserType === 'expert' ? '#6366f1' : '#fff',
                  color: selectedUserType === 'expert' ? '#fff' : '#000',
                  borderColor: selectedUserType === 'expert' ? '#6366f1' : '#d9d9d9'
                }}
              >
                Я - эксперт
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* Блок описания для клиента */}
          {selectedUserType === 'client' && (
            <Card 
              style={{ 
                background: '#fff',
                border: '1px solid #e8e8e8',
                borderRadius: 12,
                marginBottom: 16,
                minHeight: '200px'
              }}
            >
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Title level={3} style={{ margin: '0 0 16px 0', color: '#1d1d1f' }}>
                  Я - клиент
                </Title>
                <Text style={{ fontSize: '16px', color: '#666', lineHeight: '1.5', display: 'block', marginBottom: '16px' }}>
                  Найдите лучших специалистов, получите ценные знания, откройте новые горизонты!
                </Text>
                <Text style={{ fontSize: '14px', color: '#999' }}>
                  Вы можете изменить тип аккаунта и стать экспертом позже
                </Text>
              </div>
            </Card>
          )}

          {/* Блок преимуществ эксперта */}
          {selectedUserType === 'expert' && (
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
                    fontWeight: 500
                  }}
                >
                  Узнать о преимуществах Эксперта
                </Button>
              </div>
            </Card>
          )}

          <Form.Item>
            <Checkbox
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
            >
              <Text>
                Регистрируясь я соглашаюсь с{' '}
                <Link to="/offer" target="_blank" style={{ color: '#6366f1' }}>
                  публичной офертой
                </Link>
                {' '}и{' '}
                <Link to="/user-agreement" target="_blank" style={{ color: '#6366f1' }}>
                  пользовательским соглашением
                </Link>
              </Text>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!consentChecked}
              block
              style={{ height: 48 }}
            >
              {selectedUserType === 'expert' ? 'Перейти к оплате' : 'Зарегистрироваться'}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
