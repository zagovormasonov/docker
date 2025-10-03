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
  
  // Предварительно загружаем звук уведомления
  useEffect(() => {
    const audio = new Audio('/notificate.mp3');
    audio.preload = 'auto';
    audio.load();
    console.log('🔊 Звук уведомления предварительно загружен');
  }, []);
  
  // Воспроизводим звук уведомления из файла
  const createNotificationSound = () => {
    console.log('🔊 Пытаемся воспроизвести звук уведомления');
    
    const audio = new Audio('/notificate.mp3');
    audio.volume = 0.7; // Устанавливаем громкость
    
    // Добавляем обработчики событий для отладки
    audio.addEventListener('loadstart', () => console.log('🔊 Начало загрузки звука'));
    audio.addEventListener('canplay', () => console.log('🔊 Звук готов к воспроизведению'));
    audio.addEventListener('error', (e) => console.error('🔊 Ошибка загрузки звука:', e));
    audio.addEventListener('ended', () => console.log('🔊 Звук воспроизведен полностью'));
    
    audio.play().then(() => {
      console.log('✅ Звук уведомления воспроизведен успешно');
    }).catch(error => {
      console.error('❌ Не удалось воспроизвести звук уведомления:', error);
      console.log('💡 Возможные причины:');
      console.log('   - Браузер блокирует автовоспроизведение');
      console.log('   - Пользователь не взаимодействовал со страницей');
      console.log('   - Файл notificate.mp3 не найден');
    });
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
      
      // Проверяем, что сообщение не от текущего пользователя
      if (message.sender_id !== user.id) {
        console.log('✅ Показываем уведомление для сообщения от другого пользователя');
        
        // Мгновенно обновляем счетчик
        setUnreadCount(prev => prev + 1);
        
        // Воспроизводим звук
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
        
        // Обновляем счетчик с сервера для точности
        fetchUnreadCount();
      }
    };

    console.log('🔌 Подключаемся к WebSocket для уведомлений');
    socketService.onNewMessage(handleNewMessage);

    return () => {
      console.log('🔌 Отключаемся от WebSocket');
      socketService.offNewMessage();
    };
  }, [user?.id]); // Изменили зависимость на user.id вместо всего объекта user

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
      // Fallback на программный звук
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        
        oscillator.type = 'sine';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        
        console.log('🔊 Использован fallback программный звук');
      } catch (fallbackErr) {
        console.error('❌ Не удалось воспроизвести даже fallback звук:', fallbackErr);
      }
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
      
      // Периодически обновляем счетчик каждые 10 секунд (уменьшили с 30)
      const interval = setInterval(fetchUnreadCount, 10000);
      
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

