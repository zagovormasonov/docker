import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    // Обычная регистрация клиента
    setLoading(true);
    try {
      const result = await register(values.email, values.password, values.name, 'client');
      
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
              Зарегистрироваться
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
