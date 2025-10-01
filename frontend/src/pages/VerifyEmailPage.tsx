import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Result, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Токен верификации не найден');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      
      // Автоматический вход после верификации
      login(response.data.token, response.data.user);
      
      setStatus('success');
      setMessage('Email успешно подтвержден! Перенаправляем...');
      
      // Перенаправление через 2 секунды
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Ошибка верификации email');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ maxWidth: 500, width: '100%', margin: 20 }}>
        {status === 'loading' && (
          <Result
            icon={<Spin size="large" />}
            title="Подтверждение email"
            subTitle="Пожалуйста, подождите..."
          />
        )}

        {status === 'success' && (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Email подтвержден!"
            subTitle={message}
          />
        )}

        {status === 'error' && (
          <Result
            status="error"
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Ошибка верификации"
            subTitle={message}
          />
        )}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;

