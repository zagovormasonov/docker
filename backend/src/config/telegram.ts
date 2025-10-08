import dotenv from 'dotenv';

dotenv.config();

export const telegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
  enabled: process.env.TELEGRAM_ENABLED === 'true' || false
};

export const sendTelegramMessage = async (message: string): Promise<boolean> => {
  if (!telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) {
    console.warn('⚠️ Telegram не настроен или отключен');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramConfig.chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (response.ok) {
      console.log('✅ Сообщение отправлено в Telegram');
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ Ошибка отправки в Telegram:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка отправки в Telegram:', error);
    return false;
  }
};
