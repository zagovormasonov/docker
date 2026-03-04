import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Modal, Checkbox } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import emailjs from '@emailjs/browser';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const plan = searchParams.get('plan') || '';

  const sendVerificationEmail = async (email: string, name: string, verificationToken: string) => {
    try {
      const baseUrlRaw =
        (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) ||
        window.location.origin;

      const baseUrl = baseUrlRaw.replace(/\/+$/, '');
      const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_VERIFICATION_TEMPLATE_ID,
        {
          to_email: email,
          to_name: name,
          verification_url: verificationUrl,
          verification_token: verificationToken,
          app_name: 'SoulSynergy — Синергия душ'
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
    if (plan) {
      // Если указан план, сохраняем данные и перенаправляем на страницу оплаты
      localStorage.setItem('registrationData', JSON.stringify({
        ...values,
        referralCode
      }));
      navigate(`/become-expert?from=registration&plan=${plan}`);
      return;
    }

    // Обычная регистрация клиента
    setLoading(true);
    try {
      const result = await register(values.email, values.password, values.name, 'client', referralCode);
      // ... rest of the existing code ...
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
              <p style={{ color: '#ff4d4f', fontWeight: 500, marginTop: 8 }}>
                ⚠️ Если письмо не пришло, проверьте папку "Спам" или "Нежелательная почта"
              </p>
            </div>
          ),
          okText: 'Понятно',
          onOk: () => navigate('/login')
        });
      } else {
        message.warning('Регистрация выполнена, но не удалось отправить email. Обратитесь в поддержку.');
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
          maxWidth: '440px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: 'none',
          padding: '10px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1a1a1a' }}>Регистрация</Title>
          <Text style={{ color: '#666', fontSize: '15px' }}>Присоединяйтесь к сообществу SoulSynergy — Синергия душ</Text>
        </div>

        {referralCode && (
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            padding: '16px',
            borderRadius: '16px',
            marginBottom: '24px',
            border: '1px solid #bae6fd',
            textAlign: 'center'
          }}>
            <Text strong style={{ color: '#0369a1', display: 'block' }}>🎁 Вам доступен бонус!</Text>
            <Text style={{ color: '#0c4a6e', fontSize: '13px' }}>
              Скидка по приглашению на подписку эксперта применится автоматически после подтверждения email.
              {plan === 'yearly' ? ' Сейчас вы перейдете к выбору тарифа.' : ''}
            </Text>
          </div>
        )}

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
              {plan ? 'Продолжить к оплате' : 'Зарегистрироваться'}
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
