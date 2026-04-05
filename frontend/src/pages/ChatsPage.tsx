import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { SendOutlined, UserOutlined, ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../api/axios';
import socketService from '../api/socket';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import dayjs from 'dayjs';
import './ChatsPage.css';

const { Text, Title } = Typography;

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
  const navigate = useNavigate();
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

  const [chatSearchText, setChatSearchText] = useState('');

  // Синхронизация URL с состоянием чата
  useEffect(() => {
    if (chatId) {
      const id = parseInt(chatId);
      if (id !== selectedChat) {
        setSelectedChat(id);
      }
      if (isMobile) {
        setShowChatList(false);
      }
    } else {
      setSelectedChat(null);
      if (isMobile) {
        setShowChatList(true);
      }
    }
  }, [chatId, isMobile]);

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

  // Обработчик клика на карточки товаров в чате
  useEffect(() => {
    const handleArtworkCardClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const card = target.closest('.artwork-card-chat') as HTMLElement;
      if (card) {
        const userId = card.getAttribute('data-user-id');
        const artworkId = card.getAttribute('data-artwork-id');
        if (userId && artworkId) {
          navigate(`/experts/${userId}#artwork-${artworkId}`);
        }
      }
    };

    // Используем делегирование событий на контейнере сообщений
    const messagesContainer = document.querySelector('.messages-container') || document;
    messagesContainer.addEventListener('click', handleArtworkCardClick);

    return () => {
      messagesContainer.removeEventListener('click', handleArtworkCardClick);
    };
  }, [navigate, messages]);

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

  const fetchMessages = async (id: number) => {
    try {
      const response = await api.get(`/chats/${id}/messages`);
      setMessages(response.data);
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

  const handleChatSelect = (id: number) => {
    navigate(`/chats/${id}`);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBackToChatList = () => {
    navigate('/chats');
    if (isMobile) {
      setShowChatList(true);
    }
  };

  const selectedChatObj = selectedChat ? chats.find(c => c.id === selectedChat) : null;

  // Фильтрация чатов: только с сообщениями + поиск по имени или последнему сообщению
  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      // 1. Скрываем чаты без последнего сообщения
      if (!chat.last_message) return false;

      // 2. Поиск
      if (!chatSearchText) return true;
      
      const searchLower = chatSearchText.toLowerCase();
      const nameMatch = chat.other_user_name?.toLowerCase().includes(searchLower);
      const messageMatch = chat.last_message?.toLowerCase().includes(searchLower);
      
      return nameMatch || messageMatch;
    });
  }, [chats, chatSearchText]);

  // Мобильная версия - список чатов
  if (isMobile && showChatList) {
    return (
      <div className="chats-page">
        <div className="chats-panel">
          <div style={{ padding: '20px 24px 12px', background: '#fff' }}>
            <Title level={4} style={{ margin: '0 0 16px' }}>Чаты</Title>
            <Input
              placeholder="Поиск чатов и сообщений..."
              prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
              value={chatSearchText}
              onChange={(e) => setChatSearchText(e.target.value)}
              style={{ borderRadius: '12px', background: '#f5f5f5', border: 'none' }}
              allowClear
            />
          </div>
          
          <div className="chat-list-container">
            {filteredChats.length === 0 ? (
              <Empty 
                description={chatSearchText ? "Ничего не найдено" : "Нет активных чатов"} 
                style={{ marginTop: 40 }} 
              />
            ) : (
              <List
                dataSource={filteredChats}
                renderItem={(chat) => (
                  <div 
                    className={`chat-item ${chat.unread_count ? 'chat-item-unread' : ''}`}
                    onClick={() => handleChatSelect(chat.id)}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <Badge count={chat.unread_count} overflowCount={9} offset={[-2, 38]}>
                        <Avatar 
                          src={chat.other_user_avatar} 
                          icon={<UserOutlined />} 
                          size={52} 
                        />
                      </Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <Text strong style={{ fontSize: '15px' }} ellipsis>{chat.other_user_name}</Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {chat.last_message_time ? dayjs(chat.last_message_time).format('HH:mm') : ''}
                          </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: '13px' }} ellipsis>
                          {chat.last_message_sender_id === user?.id && <span style={{ color: '#6366f1' }}>Вы: </span>}
                          {chat.last_message}
                        </Text>
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Мобильная версия - активный чат
  if (isMobile && !showChatList && selectedChat) {
    return (
      <div className="chats-page">
        <div className="chats-panel">
          <div className="active-chat-header">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToChatList}
              type="text"
            />
            <Badge dot={selectedChatObj?.other_user_online} color="green" offset={[-2, 32]}>
              <Avatar 
                src={selectedChatObj?.other_user_avatar} 
                icon={<UserOutlined />} 
                size={40} 
              />
            </Badge>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text strong style={{ fontSize: '16px' }}>{selectedChatObj?.other_user_name || 'Чат'}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {selectedChatObj?.other_user_online ? 'В сети' : 'Был недавно'}
              </Text>
            </div>
          </div>
          
          <div className="messages-container">
            {messages.map((message) => {
              const isMe = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className="message-row"
                  style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}
                  >
                    {message.content.includes('<div style=') ? (
                      <div dangerouslySetInnerHTML={{ __html: message.content }} />
                    ) : (
                      message.content
                    )}
                    <div className="message-footer">
                      <span className="message-time">
                        {dayjs(message.created_at).format('HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-wrapper">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onPressEnter={sendMessage}
                placeholder="Введите сообщение..."
                size="large"
                className="chat-input-field"
                autoComplete="off"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendMessage}
                className="send-button"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Десктопная версия
  return (
    <div className="chats-page">
      <Row gutter={24} style={{ height: '100%' }}>
        <Col span={8}>
          <div className="chats-panel">
            <div style={{ padding: '24px 24px 16px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Title level={4} style={{ margin: '0 0 16px' }}>Чаты</Title>
              <Input
                placeholder="Поиск чатов и сообщений..."
                prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                value={chatSearchText}
                onChange={(e) => setChatSearchText(e.target.value)}
                style={{ borderRadius: '12px', background: '#f5f5f5', border: 'none' }}
                allowClear
              />
            </div>
            
            <div className="chat-list-container">
              {filteredChats.length === 0 ? (
                <Empty 
                  description={chatSearchText ? "Ничего не найдено" : "Нет активных чатов"} 
                  style={{ marginTop: 40 }} 
                />
              ) : (
                <List
                  dataSource={filteredChats}
                  renderItem={(chat) => (
                    <div 
                      className={`chat-item ${selectedChat === chat.id ? 'chat-item-active' : ''} ${chat.unread_count ? 'chat-item-unread' : ''}`}
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <Badge count={chat.unread_count} overflowCount={9} offset={[-2, 38]}>
                          <Avatar 
                            src={chat.other_user_avatar} 
                            icon={<UserOutlined />} 
                            size={52} 
                            style={{ border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
                          />
                        </Badge>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Text strong style={{ fontSize: '15px' }} ellipsis>{chat.other_user_name}</Text>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {chat.last_message_time ? dayjs(chat.last_message_time).format('HH:mm') : ''}
                            </Text>
                          </div>
                          <Text type="secondary" style={{ fontSize: '13px' }} ellipsis>
                            {chat.last_message_sender_id === user?.id && <span style={{ color: '#6366f1' }}>Вы: </span>}
                            {chat.last_message}
                          </Text>
                        </div>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </Col>

        <Col span={16}>
          <div className="chats-panel">
            {selectedChat ? (
              <>
                <div className="active-chat-header">
                  <Badge dot={selectedChatObj?.other_user_online} color="green" offset={[-2, 32]}>
                    <Avatar 
                      src={selectedChatObj?.other_user_avatar} 
                      icon={<UserOutlined />} 
                      size={44} 
                    />
                  </Badge>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ fontSize: '17px' }}>{selectedChatObj?.other_user_name || 'Чат'}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {selectedChatObj?.other_user_online ? 'В сети' : 'Был недавно'}
                    </Text>
                  </div>
                </div>

                <div className="messages-container">
                  {messages.length === 0 ? (
                    <Empty description="История сообщений пуста" style={{ margin: 'auto' }} />
                  ) : (
                    messages.map((message) => {
                      const isMe = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className="message-row"
                          style={{
                            display: 'flex',
                            justifyContent: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div
                            className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}
                          >
                            {message.content.includes('<div style=') ? (
                              <div dangerouslySetInnerHTML={{ __html: message.content }} />
                            ) : (
                              message.content
                            )}
                            <div className="message-footer">
                              <span className="message-time">
                                {dayjs(message.created_at).format('HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-wrapper">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onPressEnter={sendMessage}
                      placeholder="Напишите сообщение..."
                      size="large"
                      className="chat-input-field"
                      autoComplete="off"
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={sendMessage}
                      className="send-button"
                      size="large"
                    />
                  </div>
                </div>
              </>
            ) : (
              <Empty
                description="Выберите чат"
                style={{ margin: 'auto' }}
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ChatsPage;
