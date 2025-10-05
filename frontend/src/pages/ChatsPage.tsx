import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  List,
  Avatar,
  Input,
  Button,
  Typography,
  Space,
  Badge,
  Empty
} from 'antd';
import { SendOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '../api/axios';
import socketService from '../api/socket';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Chat {
  id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar?: string;
  other_user_online: boolean;
  last_message?: string;
  last_message_time?: string;
  last_message_sender_id?: number;
  unread_count?: number;
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

const ChatsPage = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const { fetchUnreadCount, markAsRead } = useNotifications();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(
    chatId ? parseInt(chatId) : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    // НЕ сбрасываем счетчик непрочитанных сообщений при входе в чаты
    // markAsRead();
    
    // Определяем мобильную версию
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Периодическое обновление счетчиков каждые 30 секунд (реже)
    const interval = setInterval(() => {
      fetchChats();
    }, 30000);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      socketService.joinChat(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    const handleNewMessage = (message: any) => {
      console.log('📨 Получено новое сообщение в ChatsPage:', message);
      
      if (message.chat_id === selectedChat) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      
      // Принудительно обновить список чатов для показа новых непрочитанных сообщений
      // С дебаунсом, чтобы не обновлять слишком часто
      setTimeout(() => {
        fetchChats();
      }, 1000);
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.offNewMessage();
    };
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Обработчик прокрутки для отметки сообщений как прочитанных
  useEffect(() => {
    const handleScroll = () => {
      if (!selectedChat) return;
      
      const messagesContainer = document.querySelector('.messages-container');
      if (!messagesContainer) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px допуск
      
      if (isAtBottom) {
        markMessagesAsRead(selectedChat);
      }
    };

    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => messagesContainer.removeEventListener('scroll', handleScroll);
    }
  }, [selectedChat, messages]);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data);
      // Обновляем счетчик непрочитанных сообщений
      fetchUnreadCount();
      console.log('📊 Загружены чаты:', response.data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      setMessages(response.data);
      
      // НЕ отмечаем сообщения как прочитанные при входе в чат
      // Это будет делаться только при прокрутке до конца
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedChat) return;

    socketService.sendMessage(selectedChat, messageText.trim());
    setMessageText('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async (chatId: number) => {
    try {
      await api.post(`/chats/${chatId}/mark-read`);
      // Обновляем список чатов для обновления счетчиков с дебаунсом
      setTimeout(() => {
        fetchChats();
      }, 500);
    } catch (error) {
      console.error('Ошибка отметки сообщений как прочитанных:', error);
    }
  };

  const handleChatSelect = (chatId: number) => {
    setSelectedChat(chatId);
    if (isMobile) {
      setShowChatList(false);
    }
    // НЕ обновляем список чатов при выборе чата
  };

  const handleBackToChatList = () => {
    setShowChatList(true);
    setSelectedChat(null);
    // НЕ обновляем список чатов при возврате к списку
  };

  // Мобильная версия - список чатов
  if (isMobile && showChatList) {
    return (
      <div className="container">
        <Card
          title="Чаты"
          style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, overflow: 'auto', padding: 0 }}
        >
          <div style={{ padding: 16 }}>
            <List
              dataSource={chats}
              renderItem={(chat) => (
                <List.Item
                  onClick={() => handleChatSelect(chat.id)}
                  style={{
                    cursor: 'pointer',
                    background: selectedChat === chat.id ? '#f0f0f0' : 
                               (chat.unread_count && chat.unread_count > 0 ? '#fff2f0' : 'transparent'),
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    border: chat.unread_count && chat.unread_count > 0 ? '1px solid #ffccc7' : '1px solid transparent'
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        dot={chat.other_user_online} 
                        color="green"
                        count={chat.unread_count && chat.unread_count > 0 ? chat.unread_count : 0}
                        offset={[-5, 5]}
                      >
                        <Avatar
                          src={chat.other_user_avatar}
                          icon={!chat.other_user_avatar && <UserOutlined />}
                          size={48}
                        />
                      </Badge>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{chat.other_user_name}</span>
                        {chat.last_message_sender_id === user?.id && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            (Вы)
                          </Text>
                        )}
                      </div>
                    }
                    description={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text ellipsis type="secondary" style={{ flex: 1 }}>
                          {chat.last_message || 'Нет сообщений'}
                        </Text>
                        {chat.unread_count && chat.unread_count > 0 && (
                          <Badge 
                            count={chat.unread_count} 
                            size="small" 
                            style={{ 
                              marginLeft: 8,
                              backgroundColor: '#ff4d4f',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                      </div>
                    }
                  />
                  {chat.last_message_time && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(chat.last_message_time).format('HH:mm')}
                    </Text>
                  )}
                </List.Item>
              )}
            />
          </div>
        </Card>
      </div>
    );
  }

  // Мобильная версия - активный чат
  if (isMobile && !showChatList && selectedChat) {
    return (
      <div className="container">
        <Card
          style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
        >
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10
          }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToChatList}
              type="text"
            />
            <Text strong>Чаты</Text>
          </div>
          
          <div
            className="messages-container"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.sender_id === user?.id ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    display: 'flex',
                    gap: 8,
                    flexDirection: message.sender_id === user?.id ? 'row-reverse' : 'row',
                    alignItems: 'flex-start'
                  }}
                >
                  <Avatar
                    src={message.sender_avatar}
                    icon={!message.sender_avatar && <UserOutlined />}
                    size={32}
                    style={{ 
                      flexShrink: 0,
                      width: 32,
                      height: 32
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        background: message.sender_id === user?.id 
                          ? 'linear-gradient(135deg, rgb(180, 194, 255) 0%, rgb(245, 236, 255) 100%)'
                          : '#f0f0f0',
                        color: 'black',
                        padding: '12px 16px',
                        borderRadius: 12,
                        marginBottom: 4,
                        wordWrap: 'break-word',
                        wordBreak: 'break-word'
                      }}
                    >
                      {message.content}
                    </div>
                    <div
                      style={{
                        textAlign: message.sender_id === user?.id ? 'right' : 'left'
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          display: 'block'
                        }}
                      >
                        {dayjs(message.created_at).format('HH:mm')}
                      </Text>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 10,
                          display: 'block',
                          marginTop: 2
                        }}
                      >
                        {dayjs(message.created_at).format('DD.MM.YYYY')}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onPressEnter={sendMessage}
                placeholder="Введите сообщение..."
                size="large"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendMessage}
                size="large"
              >
                Отправить
              </Button>
            </Space.Compact>
          </div>
        </Card>
      </div>
    );
  }

  // Десктопная версия
  return (
    <div className="container">
      <Row gutter={16} style={{ height: 'calc(100vh - 200px)' }}>
        <Col xs={24} md={8}>
          <Card
            title="Чаты"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'auto', padding: 0 }}
          >
            <div style={{ padding: 16 }}>
              <List
                dataSource={chats}
                renderItem={(chat) => (
                <List.Item
                  onClick={() => handleChatSelect(chat.id)}
                  style={{
                    cursor: 'pointer',
                    background: selectedChat === chat.id ? '#f0f0f0' : 'transparent',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        dot={chat.other_user_online} 
                        color="green"
                        count={chat.unread_count && chat.unread_count > 0 ? chat.unread_count : 0}
                        offset={[-5, 5]}
                      >
                        <Avatar
                          src={chat.other_user_avatar}
                          icon={!chat.other_user_avatar && <UserOutlined />}
                          size={48}
                        />
                      </Badge>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{chat.other_user_name}</span>
                        {chat.last_message_sender_id === user?.id && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            (Вы)
                          </Text>
                        )}
                      </div>
                    }
                    description={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text ellipsis type="secondary" style={{ flex: 1 }}>
                          {chat.last_message || 'Нет сообщений'}
                        </Text>
                        {chat.unread_count && chat.unread_count > 0 && (
                          <Badge 
                            count={chat.unread_count} 
                            size="small" 
                            style={{ 
                              marginLeft: 8,
                              backgroundColor: '#ff4d4f',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                      </div>
                    }
                  />
                  {chat.last_message_time && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(chat.last_message_time).format('HH:mm')}
                    </Text>
                  )}
                </List.Item>
              )}
            />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
          >
            {selectedChat ? (
              <>
                <div
                  className="messages-container"
                  style={{
                    height: 'calc(100vh - 300px)', // Фиксированная высота по высоте экрана
                    overflowY: 'auto',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    border: '1px solid #d9d9d9',
                    borderRadius: 8,
                    margin: 16
                  }}
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: message.sender_id === user?.id ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          display: 'flex',
                          gap: 8,
                          flexDirection: message.sender_id === user?.id ? 'row-reverse' : 'row',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Avatar
                          src={message.sender_avatar}
                          icon={!message.sender_avatar && <UserOutlined />}
                          size={32}
                          style={{ 
                            flexShrink: 0,
                            width: 32,
                            height: 32
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              background: message.sender_id === user?.id 
                                ? 'linear-gradient(135deg, rgb(180, 194, 255) 0%, rgb(245, 236, 255) 100%)'
                                : '#f0f0f0',
                              color: 'black',
                              padding: '12px 16px',
                              borderRadius: 12,
                              marginBottom: 4,
                              wordWrap: 'break-word',
                              wordBreak: 'break-word'
                            }}
                          >
                            {message.content}
                          </div>
                          <div
                            style={{
                              textAlign: message.sender_id === user?.id ? 'right' : 'left'
                            }}
                          >
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 11,
                                display: 'block'
                              }}
                            >
                              {dayjs(message.created_at).format('HH:mm')}
                            </Text>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 10,
                                display: 'block',
                                marginTop: 2
                              }}
                            >
                              {dayjs(message.created_at).format('DD.MM.YYYY')}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onPressEnter={sendMessage}
                      placeholder="Введите сообщение..."
                      size="large"
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={sendMessage}
                      size="large"
                    >
                      Отправить
                    </Button>
                  </Space.Compact>
                </div>
              </>
            ) : (
              <Empty
                description="Выберите чат"
                style={{ margin: 'auto' }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChatsPage;
