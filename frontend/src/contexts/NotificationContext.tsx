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
  testNotification: () => void;
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
    console.log('🔔 NotificationContext: user changed', user);
    
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Слушаем новые сообщения через Socket.IO
    const handleNewMessage = (message: any) => {
      console.log('📨 Получено новое сообщение:', message);
      console.log('👤 Текущий пользователь:', user);
      
      // Проверяем, что сообщение не от текущего пользователя
      if (message.sender_id !== user.id) {
        console.log('✅ Показываем уведомление для сообщения от другого пользователя');
        
        // Обновляем счетчик
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        
        // Показываем уведомление в браузере
        if ('Notification' in window && Notification.permission === 'granted') {
          console.log('🔔 Показываем браузерное уведомление');
          new Notification(`💬 ${message.sender_name}`, {
            body: `${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            icon: '/logo.png',
            tag: `chat-${message.chat_id}`,
            requireInteraction: false,
            silent: false
          });
        } else {
          console.log('❌ Браузерные уведомления не разрешены');
        }

        // Показываем Ant Design уведомление
        console.log('📱 Показываем Ant Design уведомление');
        antMessage.info({
          content: `💬 Новое сообщение от ${message.sender_name}`,
          duration: 4,
          style: {
            marginTop: '20px'
          }
        });
      } else {
        console.log('❌ Сообщение от текущего пользователя, уведомление не показываем');
      }
      
      // Обновляем счетчик непрочитанных сообщений с сервера
      fetchUnreadCount();
    };

    console.log('🔌 Подключаемся к WebSocket для уведомлений');
    socketService.onNewMessage(handleNewMessage);

    return () => {
      console.log('🔌 Отключаемся от WebSocket');
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

  const markAsRead = async () => {
    setUnreadCount(0);
    // Также обновляем счетчик на сервере
    if (user) {
      try {
        await api.post('/chats/mark-all-read');
      } catch (error) {
        console.error('Ошибка отметки сообщений как прочитанных:', error);
      }
    }
  };

  const testNotification = () => {
    console.log('🧪 Тестируем уведомление');
    
    // Тестируем звук
    playNotificationSound();
    
    // Тестируем браузерное уведомление
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🧪 Тестовое уведомление', {
        body: 'Это тестовое уведомление для проверки работы системы',
        icon: '/logo.png',
        tag: 'test-notification'
      });
    } else {
      console.log('❌ Браузерные уведомления не разрешены');
    }
    
    // Тестируем Ant Design уведомление
    antMessage.info({
      content: '🧪 Тестовое уведомление',
      duration: 3
    });
    
    // Увеличиваем счетчик
    setUnreadCount(prev => prev + 1);
  };

  // Загружаем количество непрочитанных сообщений при входе пользователя
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Периодически обновляем счетчик каждые 30 секунд
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, playNotificationSound, markAsRead, fetchUnreadCount, testNotification }}>
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

