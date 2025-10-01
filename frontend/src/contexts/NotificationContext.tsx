import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../api/socket';
import { message as antMessage } from 'antd';

interface NotificationContextType {
  unreadCount: number;
  playNotificationSound: () => void;
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [audio] = useState(() => new Audio('/notification.mp3'));

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
          new Notification('Новое сообщение', {
            body: `${message.sender_name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            icon: '/vite.svg',
            tag: 'chat-message'
          });
        }

        // Показываем Ant Design уведомление
        antMessage.info({
          content: `Новое сообщение от ${message.sender_name}`,
          duration: 3
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
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Не удалось воспроизвести звук:', err));
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, playNotificationSound, markAsRead }}>
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

