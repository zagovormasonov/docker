import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendTelegramMessage } from '../config/telegram';

const router = express.Router();

// Отправка сообщения в поддержку
router.post(
  '/send',
  authenticateToken,
  [
    body('contact').trim().isLength({ min: 3 }).withMessage('Контакт должен содержать минимум 3 символа'),
    body('message').trim().isLength({ min: 10 }).withMessage('Сообщение должно содержать минимум 10 символов')
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { contact, message } = req.body;
      const user = req.user;

      // Формируем сообщение для Telegram
      const telegramMessage = `🆘 Новое сообщение в поддержку:

👤 Пользователь: ${user.name} (ID: ${user.id})
📧 Email: ${user.email}
📞 Контакт: ${contact}
📝 Сообщение: ${message}

⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

      // Отправляем в Telegram
      const success = await sendTelegramMessage(telegramMessage);

      if (success) {
        res.json({ 
          success: true, 
          message: 'Сообщение отправлено в поддержку! Мы ответим вам в ближайшее время.' 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Ошибка отправки сообщения. Попробуйте позже.' 
        });
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения поддержки:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Ошибка сервера' 
      });
    }
  }
);

export default router;
