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
import { SendOutlined, UserOutlined } from '@ant-design/icons';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    // Сбрасываем счетчик непрочитанных сообщений при входе в чаты
    markAsRead();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      socketService.joinChat(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    socketService.onNewMessage((message) => {
      if (message.chat_id === selectedChat) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      
      // Обновить список чатов
      fetchChats();
    });

    return () => {
      socketService.offNewMessage();
    };
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data);
      // Обновляем счетчик непрочитанных сообщений
      fetchUnreadCount();
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
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

  return (
    <div className="container">
      <Row gutter={16} style={{ height: 'calc(100vh - 200px)' }}>
        <Col xs={24} md={8}>
          <Card
            title="Чаты"
            style={{ height: '100%', overflow: 'auto' }}
          >
            <List
              dataSource={chats}
              renderItem={(chat) => (
                <List.Item
                  onClick={() => setSelectedChat(chat.id)}
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
                      <Badge dot={chat.other_user_online} color="green">
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
                      <Text ellipsis type="secondary">
                        {chat.last_message || 'Нет сообщений'}
                      </Text>
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
                          flexDirection: message.sender_id === user?.id ? 'row-reverse' : 'row'
                        }}
                      >
                        <Avatar
                          src={message.sender_avatar}
                          icon={!message.sender_avatar && <UserOutlined />}
                          size={32}
                        />
                        <div>
                          <div
                            style={{
                              background: message.sender_id === user?.id ? '#6366f1' : '#f0f0f0',
                              color: message.sender_id === user?.id ? 'white' : 'black',
                              padding: '12px 16px',
                              borderRadius: 12,
                              marginBottom: 4
                            }}
                          >
                            {message.content}
                          </div>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 11,
                              display: 'block',
                              textAlign: message.sender_id === user?.id ? 'right' : 'left'
                            }}
                          >
                            {dayjs(message.created_at).format('HH:mm')}
                          </Text>
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
