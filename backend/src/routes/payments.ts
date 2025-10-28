import express from 'express';
import crypto from 'crypto';
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

// Функция для проверки подписи webhook от Юкассы
function verifyYooKassaWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Ошибка проверки подписи webhook:', error);
    return false;
  }
}

// Создание платежа
router.post('/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Создание платежа:', req.body);
    const { planId, amount, description } = req.body;
    const userId = req.userId;

    // Проверяем обязательные поля
    if (!planId || !amount || !description) {
      return res.status(400).json({ error: 'Отсутствуют обязательные поля: planId, amount, description' });
    }

    // Проверяем конфигурацию Юкассы
    if (YOOKASSA_SHOP_ID === 'YOUR_SHOP_ID' || YOOKASSA_SECRET_KEY === 'YOUR_SECRET_KEY') {
      return res.status(500).json({ error: 'Не настроены данные Юкассы. Проверьте переменные окружения YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY' });
    }

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
    let paymentResult;
    try {
      paymentResult = await query(
        `INSERT INTO payments (user_id, plan_id, amount, description, status, created_at) 
         VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP) 
         RETURNING id`,
        [userId, planId, amount, description]
      );
    } catch (dbError) {
      console.error('Ошибка создания записи платежа в БД:', dbError);
      return res.status(500).json({ 
        error: 'Ошибка создания записи платежа. Возможно, таблица payments не создана. Выполните SQL скрипт CREATE-PAYMENTS-TABLE.sql',
        details: dbError.message 
      });
    }

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

    let yookassaResponse;
    try {
      yookassaResponse = await fetch(YOOKASSA_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Idempotence-Key': paymentId.toString()
        },
        body: JSON.stringify(paymentData)
      });
    } catch (fetchError) {
      console.error('Ошибка запроса к Юкассе:', fetchError);
      return res.status(500).json({ 
        error: 'Ошибка соединения с Юкассой',
        details: fetchError.message 
      });
    }

    if (!yookassaResponse.ok) {
      const errorText = await yookassaResponse.text();
      console.error('Ошибка Юкассы:', yookassaResponse.status, errorText);
      return res.status(500).json({ 
        error: 'Ошибка создания платежа в Юкассе',
        details: `Статус: ${yookassaResponse.status}, Ответ: ${errorText}`
      });
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
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('Получен webhook от Юкассы:', req.body);
    
    const body = req.body.toString();
    const signature = req.headers['x-yookassa-signature'] as string;
    
    // Проверяем подпись webhook (опционально, для безопасности)
    if (signature && !verifyYooKassaWebhookSignature(body, signature, YOOKASSA_SECRET_KEY)) {
      console.error('Неверная подпись webhook от Юкассы');
      return res.status(401).json({ error: 'Неверная подпись' });
    }
    
    const webhookData: YooKassaWebhookEvent = JSON.parse(body);
    const { event, object } = webhookData;
    
    console.log(`Обработка события: ${event}, ID платежа: ${object.id}`);

    if (event === 'payment.succeeded') {
      const { id: yookassaPaymentId, metadata } = object;
      
      // Находим платеж в нашей базе данных
      const paymentResult = await query(
        'SELECT * FROM payments WHERE yookassa_payment_id = $1',
        [yookassaPaymentId]
      );

      if (paymentResult.rows.length === 0) {
        console.error(`Платеж с ID ${yookassaPaymentId} не найден в базе данных`);
        return res.status(404).json({ error: 'Платеж не найден' });
      }

      const payment = paymentResult.rows[0];

      // Проверяем, что платеж еще не обработан
      if (payment.status === 'succeeded') {
        console.log(`Платеж ${payment.id} уже обработан ранее`);
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

      console.log(`✅ Пользователь ${payment.user_id} стал экспертом после успешной оплаты ${payment.id}`);
      
      // Отправляем уведомление пользователю (если есть система уведомлений)
      try {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, created_at) 
           VALUES ($1, 'payment_success', 'Оплата прошла успешно!', 'Поздравляем! Вы стали экспертом.', CURRENT_TIMESTAMP)`,
          [payment.user_id]
        );
        console.log(`Уведомление отправлено пользователю ${payment.user_id}`);
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления:', notificationError);
        // Не прерываем выполнение из-за ошибки уведомления
      }
    } else if (event === 'payment.canceled') {
      const { id: yookassaPaymentId } = object;
      
      // Обновляем статус платежа на отмененный
      await query(
        'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE yookassa_payment_id = $2',
        ['canceled', yookassaPaymentId]
      );
      
      console.log(`❌ Платеж ${yookassaPaymentId} отменен`);
    }

    res.status(200).json({ message: 'Webhook обработан успешно' });
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

// Ручное подтверждение платежа (для админов)
router.post('/confirm/:paymentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.userId;

    // Проверяем, что пользователь - админ
    const userResult = await query(
      'SELECT user_type FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].user_type !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
    }

    // Находим платеж
    const paymentResult = await query(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    const payment = paymentResult.rows[0];

    if (payment.status === 'succeeded') {
      return res.status(400).json({ error: 'Платеж уже подтвержден' });
    }

    // Подтверждаем платеж
    await query(
      'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['succeeded', payment.id]
    );

    // Делаем пользователя экспертом
    await query(
      'UPDATE users SET user_type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['expert', payment.user_id]
    );

    console.log(`✅ Админ ${userId} вручную подтвердил платеж ${payment.id} для пользователя ${payment.user_id}`);

    res.json({ 
      message: 'Платеж успешно подтвержден',
      payment_id: payment.id,
      user_id: payment.user_id
    });

  } catch (error) {
    console.error('Ошибка ручного подтверждения платежа:', error);
    res.status(500).json({ error: 'Ошибка подтверждения платежа' });
  }
});

// Получение списка всех платежей (для админов)
router.get('/all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    // Проверяем, что пользователь - админ
    const userResult = await query(
      'SELECT user_type FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].user_type !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
    }

    const paymentsResult = await query(`
      SELECT 
        p.*,
        u.email,
        u.username,
        u.user_type
      FROM payments p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json(paymentsResult.rows);

  } catch (error) {
    console.error('Ошибка получения списка платежей:', error);
    res.status(500).json({ error: 'Ошибка получения списка платежей' });
  }
});

export default router;

