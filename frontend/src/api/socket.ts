import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    // Используем текущий origin для продакшена, localhost для разработки
    const socketUrl = import.meta.env.PROD 
      ? window.location.origin 
      : 'http://localhost:3001';
    
    this.socket = io(socketUrl, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('✅ Подключено к WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Отключено от WebSocket');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  joinChat(chatId: number) {
    this.socket?.emit('join_chat', chatId);
  }

  sendMessage(chatId: number, content: string) {
    this.socket?.emit('send_message', { chatId, content });
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new_message', callback);
  }

  offNewMessage() {
    this.socket?.off('new_message');
  }

  emitTyping(chatId: number, isTyping: boolean) {
    this.socket?.emit('typing', { chatId, isTyping });
  }

  onTyping(callback: (data: { userId: number; isTyping: boolean }) => void) {
    this.socket?.on('user_typing', callback);
  }
}

export default new SocketService();
