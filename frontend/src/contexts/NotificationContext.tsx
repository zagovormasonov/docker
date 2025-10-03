import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../api/socket';
import api from '../api/axios';
import { message as antMessage } from 'antd';

interface NotificationContextType {
  unreadCount: number;
  playNotificationSound: () => void;
  markAsRead: () => void;
  fetchUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Создаем простой beep звук через Web Audio API
  const createNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Частота звука
    gainNode.gain.value = 0.3; // Громкость
    
    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2); // Длительность 200ms
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Слушаем новые сообщения через Socket.IO
    const handleNewMessage = (message: any) => {
      // Проверяем, что сообщение не от текущего пользователя
      if (message.sender_id !== user.id) {
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        
        // Показываем уведомление в браузере
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`💬 ${message.sender_name}`, {
            body: `${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            icon: '/logo.png',
            tag: `chat-${message.chat_id}`,
            requireInteraction: false,
            silent: false
          });
        }

        // Показываем Ant Design уведомление
        antMessage.info({
          content: `💬 Новое сообщение от ${message.sender_name}`,
          duration: 4,
          style: {
            marginTop: '20px'
          }
        });
      }
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.offNewMessage();
    };
  }, [user]);

  // Запрос разрешения на уведомления
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationSound = () => {
    try {
      createNotificationSound();
    } catch (err) {
      console.log('Не удалось воспроизвести звук:', err);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await api.get('/chats/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Ошибка получения количества непрочитанных сообщений:', error);
    }
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  // Загружаем количество непрочитанных сообщений при входе пользователя
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, playNotificationSound, markAsRead, fetchUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

