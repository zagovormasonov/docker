import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '../api/axios';
import emailjs from '@emailjs/browser';

const { Title, Text } = Typography;

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const sendResetEmail = async (email: string, name: string, resetToken: string) => {
    try {
      const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
      
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID,
        {
          to_email: email,
          to_name: name,
          reset_url: resetUrl,
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
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { 
        email: values.email 
      });
      
      // Отправка email через EmailJS
      if (response.data.user) {
        const emailSuccess = await sendResetEmail(
          response.data.user.email,
          response.data.user.name,
          response.data.user.resetToken
        );
        
        if (emailSuccess) {
          setEmailSent(true);
        } else {
          message.error('Не удалось отправить email. Попробуйте позже.');
        }
      } else {
        // Даже если пользователя нет, показываем успех (безопасность)
        setEmailSent(true);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка запроса');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 500, width: '100%' }}>
          <Result
            status="success"
            title="Письмо отправлено!"
            subTitle="Проверьте вашу почту и перейдите по ссылке для восстановления пароля."
            extra={
              <Link to="/login">
                <Button type="primary">Вернуться на страницу входа</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        <div style={{ marginBottom: 16 }}>
          <Link to="/login">
            <Button type="text" icon={<ArrowLeftOutlined />}>
              Назад к входу
            </Button>
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>Забыли пароль?</Title>
          <Text type="secondary">
            Введите email и мы отправим вам ссылку для восстановления
          </Text>
        </div>

        <Form
          name="forgot-password"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 48 }}
            >
              Отправить ссылку для восстановления
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;

