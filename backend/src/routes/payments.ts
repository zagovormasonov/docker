import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

// Типы для API Юкассы
interface YooKassaPaymentResponse {
  id: string;
  status: string;
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  amount: {
    value: string;
    currency: string;
  };
  description: string;
  metadata: {
    payment_id: string;
    user_id: string;
    plan_id: string;
  };
}

interface YooKassaWebhookEvent {
  event: string;
  object: {
    id: string;
    status: string;
    metadata: {
      payment_id: string;
      user_id: string;
      plan_id: string;
    };
  };
}

const router = express.Router();

// Конфигурация Юкассы (замените на ваши данные)
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || 'YOUR_SHOP_ID';
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || 'YOUR_SECRET_KEY';
const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

// Создание платежа
router.post('/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { planId, amount, description } = req.body;
    const userId = req.userId;

    // Проверяем, что пользователь еще не эксперт
    const userResult = await query(
      'SELECT user_type FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];
    
    if (user.user_type === 'expert') {
      return res.status(400).json({ error: 'Пользователь уже является экспертом' });
    }

    // Создаем запись о платеже в базе данных
    const paymentResult = await query(
      `INSERT INTO payments (user_id, plan_id, amount, description, status, created_at) 
       VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP) 
       RETURNING id`,
      [userId, planId, amount, description]
    );

    const paymentId = paymentResult.rows[0].id;

    // Создаем платеж в Юкассе
    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?payment_id=${paymentId}`
      },
      description: description,
      metadata: {
        payment_id: paymentId,
        user_id: userId,
        plan_id: planId
      }
    };

    const yookassaResponse = await fetch(YOOKASSA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': paymentId.toString()
      },
      body: JSON.stringify(paymentData)
    });

    if (!yookassaResponse.ok) {
      throw new Error('Ошибка создания платежа в Юкассе');
    }

    const yookassaData = await yookassaResponse.json() as YooKassaPaymentResponse;

    // Обновляем запись о платеже с ID от Юкассы
    await query(
      'UPDATE payments SET yookassa_payment_id = $1 WHERE id = $2',
      [yookassaData.id, paymentId]
    );

    res.json({
      payment_id: paymentId,
      payment_url: yookassaData.confirmation?.confirmation_url,
      yookassa_payment_id: yookassaData.id
    });

  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({ error: 'Ошибка создания платежа' });
  }
});

// Webhook для обработки уведомлений от Юкассы
router.post('/webhook', async (req, res) => {
  try {
    const { event, object }: YooKassaWebhookEvent = req.body;

    if (event === 'payment.succeeded') {
      const { id: yookassaPaymentId, metadata } = object;
      
      // Находим платеж в нашей базе данных
      const paymentResult = await query(
        'SELECT * FROM payments WHERE yookassa_payment_id = $1',
        [yookassaPaymentId]
      );

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Платеж не найден' });
      }

      const payment = paymentResult.rows[0];

      // Проверяем, что платеж еще не обработан
      if (payment.status === 'succeeded') {
        return res.status(200).json({ message: 'Платеж уже обработан' });
      }

      // Обновляем статус платежа
      await query(
        'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['succeeded', payment.id]
      );

      // Делаем пользователя экспертом
      await query(
        'UPDATE users SET user_type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['expert', payment.user_id]
      );

      console.log(`Пользователь ${payment.user_id} стал экспертом после успешной оплаты ${payment.id}`);
    }

    res.status(200).json({ message: 'Webhook обработан' });
  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    res.status(500).json({ error: 'Ошибка обработки webhook' });
  }
});

// Проверка статуса платежа
router.get('/status/:paymentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.userId;

    const paymentResult = await query(
      'SELECT * FROM payments WHERE id = $1 AND user_id = $2',
      [paymentId, userId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    const payment = paymentResult.rows[0];

    // Если платеж успешен, проверяем статус пользователя
    if (payment.status === 'succeeded') {
      const userResult = await query(
        'SELECT user_type FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length > 0) {
        payment.user_type = userResult.rows[0].user_type;
      }
    }

    res.json(payment);
  } catch (error) {
    console.error('Ошибка проверки статуса платежа:', error);
    res.status(500).json({ error: 'Ошибка проверки статуса платежа' });
  }
});

export default router;

