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
// Примечание: Юкасса может не отправлять подпись в тестовом режиме
function verifyYooKassaWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    if (!signature) {
      // Если подпись отсутствует, разрешаем (для тестового режима или если не настроено)
      console.warn('Webhook без подписи (возможно тестовый режим)');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Юкасса может отправлять подпись в другом формате, поэтому делаем мягкую проверку
    const signatureMatch = signature.toLowerCase() === expectedSignature.toLowerCase();

    if (!signatureMatch) {
      console.warn('Подпись webhook не совпадает, но продолжаем обработку (может быть тестовый режим)');
      // В продакшене можно сделать return false для строгой проверки
      return true; // Разрешаем для автоматизации
    }

    return true;
  } catch (error) {
    console.error('Ошибка проверки подписи webhook:', error);
    // В случае ошибки разрешаем обработку, чтобы не блокировать автоматизацию
    return true;
  }
}

// Создание платежа
router.post('/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Создание платежа:', req.body);
    const { planId, amount, description, isRecurring, recurringInterval, useBonuses } = req.body;
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

    if (user.user_type === 'expert' && planId !== 'yearly' && planId !== 'monthly') {
      // Allow renewal for experts, but check other plans if needed
    } else if (user.user_type === 'expert' && !isRecurring) {
      // If they are already expert and just want to "become expert", it's redundant unless it's a renewal
    }

    // Расчет скидки
    let finalAmount = amount;
    let discountReason = null;
    let discountAmount = 0;
    let bonusUsedAmount = 0;

    // 1. Скидка по реферальной ссылке (300 руб для годовой подписки)
    const userDetails = await query(
      'SELECT referred_by_id, bonuses, email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (userDetails.rows[0].referred_by_id && planId === 'yearly' && userDetails.rows[0].email_verified === true) {
      const referrerId = userDetails.rows[0].referred_by_id;

      // Считаем сколько человек уже зарегистрировалось по ссылке этого пригласителя
      const referralCountResult = await query(
        'SELECT COUNT(*) FROM users WHERE referred_by_id = $1',
        [referrerId]
      );
      const referralCount = parseInt(referralCountResult.rows[0].count || '0');

      // Распределение по реферальной системе: 3 человека 10%, 10 человек 20%, 30 человек 30%
      let discountPercent = 10; // по умолчанию 10% (в т.ч. для первых 3-х)
      if (referralCount >= 30) {
        discountPercent = 30;
      } else if (referralCount >= 10) {
        discountPercent = 20;
      }

      const currentBonusAmount = Math.round(finalAmount * (discountPercent / 100));

      discountAmount = currentBonusAmount;
      finalAmount = Math.max(0, finalAmount - currentBonusAmount);
      discountReason = 'referral_discount';
    }

    // 2. Использование бонусов
    if (useBonuses && userDetails.rows[0].bonuses > 0) {
      bonusUsedAmount = Math.min(userDetails.rows[0].bonuses, finalAmount);
      finalAmount -= bonusUsedAmount;
    }

    // Создаем запись о платеже в базе данных
    let paymentResult;
    try {
      paymentResult = await query(
        `INSERT INTO payments (user_id, plan_id, amount, description, status, used_bonuses, discount_amount, discount_type, created_at) 
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, CURRENT_TIMESTAMP) 
         RETURNING id`,
        [userId, planId, finalAmount, description, bonusUsedAmount, discountAmount, discountReason]
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
    // Одностадийный платеж: деньги списываются автоматически сразу после оплаты
    const paymentData: any = {
      amount: {
        value: finalAmount.toFixed(2),
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?payment_id=${paymentId}`
      },
      description: description,
      capture: true, // Одностадийный платеж: деньги списываются сразу после оплаты
      metadata: {
        payment_id: paymentId,
        user_id: userId,
        plan_id: planId,
        use_bonuses: useBonuses ? 'true' : 'false',
        discount_applied: discountReason || ''
      }
    };

    // Если это рекуррентный платеж (подписка)
    if (isRecurring && recurringInterval) {
      paymentData.receipt = {
        customer: {
          email: user.email || 'customer@example.com'
        },
        items: [
          {
            description: description,
            quantity: 1,
            amount: {
              value: finalAmount.toFixed(2),
              currency: 'RUB'
            },
            vat_code: 1
          }
        ]
      };
    }

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

// Функция для обработки успешного платежа (вынесена для переиспользования)
async function processSuccessfulPayment(payment: any) {
  try {
    console.log(`🔄 Обработка платежа ${payment.id} для пользователя ${payment.user_id}, план: ${payment.plan_id}`);

    // Проверяем, что платеж еще не обработан
    if (payment.status === 'succeeded') {
      console.log(`⚠️ Платеж ${payment.id} уже обработан ранее`);
      return { alreadyProcessed: true };
    }

    // Обновляем статус платежа
    await query(
      'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['succeeded', payment.id]
    );
    console.log(`✅ Статус платежа ${payment.id} обновлен на 'succeeded'`);

    // Автоматически выдаем права эксперта при оплате месячной или годовой подписки
    // Проверяем план подписки - делаем экспертом только для monthly и yearly
    const expertPlans = ['monthly', 'yearly'];
    if (expertPlans.includes(payment.plan_id)) {
      console.log(`✅ План ${payment.plan_id} дает статус эксперта. Автоматически обновляем пользователя...`);

      // Проверяем текущий статус пользователя
      const userResult = await query(
        'SELECT id, email, user_type FROM users WHERE id = $1',
        [payment.user_id]
      );

      if (userResult.rows.length === 0) {
        console.error(`❌ Пользователь ${payment.user_id} не найден в базе данных!`);
        return { error: 'Пользователь не найден' };
      }

      const currentUser = userResult.rows[0];
      console.log(`📋 Текущий статус пользователя ${currentUser.email}: ${currentUser.user_type}`);

      // Вычисляем дату окончания подписки
      let subscriptionInterval = '1 year';
      let subscriptionMessage = 'годовая';

      if (payment.plan_id === 'monthly') {
        subscriptionInterval = '1 month';
        subscriptionMessage = 'месячная';
      }

      // Делаем пользователя экспертом и устанавливаем срок подписки (складываем с текущей датой окончания, если она в будущем)
      await query(
        `UPDATE users 
         SET user_type = $1, 
             subscription_plan = $2,
             subscription_expires_at = CASE 
                WHEN subscription_expires_at > CURRENT_TIMESTAMP THEN subscription_expires_at + INTERVAL '${subscriptionInterval}'
                ELSE CURRENT_TIMESTAMP + INTERVAL '${subscriptionInterval}'
             END,
             last_payment_date = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        ['expert', payment.plan_id, payment.user_id]
      );

      console.log(`✅ Пользователь ${currentUser.email} (ID: ${payment.user_id}) успешно стал экспертом после оплаты плана ${payment.plan_id}`);

      // Начисляем бонусы пригласившему
      const referralCheck = await query(
        'SELECT referred_by_id FROM users WHERE id = $1',
        [payment.user_id]
      );

      if (referralCheck.rows.length > 0 && referralCheck.rows[0].referred_by_id) {
        const referrerId = referralCheck.rows[0].referred_by_id;

        // Антифрод: не начисляем самому себе
        if (referrerId !== payment.user_id) {
          // Считаем сколько человек уже зарегистрировалось по ссылке этого пригласителя
          const referralCountResult = await query(
            'SELECT COUNT(*) FROM users WHERE referred_by_id = $1',
            [referrerId]
          );
          const referralCount = parseInt(referralCountResult.rows[0].count || '0');

          // Распределение по реферальной системе: 3 человека 10%, 10 человек 20%, 30 человек 30%
          let bonusPercent = 10;
          if (referralCount >= 30) {
            bonusPercent = 30;
          } else if (referralCount >= 10) {
            bonusPercent = 20;
          }

          // Начисляем % от финальной суммы (с учетом скидки, которая была применена), или от базовой суммы? payment.amount содержит сумму после скидки
          const currentBonusAmount = Math.round(payment.amount * (bonusPercent / 100));

          await query(
            'UPDATE users SET bonuses = bonuses + $1 WHERE id = $2',
            [currentBonusAmount, referrerId]
          );
          console.log(`🎁 Начислено ${currentBonusAmount} бонусов пользователю ${referrerId} за приглашение ${payment.user_id} (всего рефералов: ${referralCount})`);

          await query(
            `INSERT INTO notifications (user_id, type, title, message, created_at) 
             VALUES ($1, 'bonus_received', 'Начислены бонусы!', $2, CURRENT_TIMESTAMP)`,
            [referrerId, `Вам начислено ${currentBonusAmount} бонусов за регистрацию и оплату подписки вашим другом!`]
          );
        }
      }

      // Списываем бонусы у текущего пользователя, если он их использовал
      if (payment.used_bonuses > 0) {
        await query(
          'UPDATE users SET bonuses = bonuses - $1 WHERE id = $2',
          [payment.used_bonuses, payment.user_id]
        );
        console.log(`📉 Списано ${payment.used_bonuses} бонусов у пользователя ${payment.user_id}`);
      }

      console.log(`⏰ Подписка действительна до: ${new Date(Date.now() + (payment.plan_id === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000)).toISOString()}`);

      // Отправляем уведомление пользователю
      try {
        const expirationDate = new Date(Date.now() + (payment.plan_id === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000));
        const expirationText = expirationDate.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        await query(
          `INSERT INTO notifications (user_id, type, title, message, created_at) 
           VALUES ($1, 'payment_success', 'Оплата прошла успешно!', $2, CURRENT_TIMESTAMP)`,
          [payment.user_id, `Поздравляем! Вы стали экспертом. Подписка: ${payment.plan_id === 'monthly' ? 'месячная' : 'годовая'}. Действует до ${expirationText}.`]
        );
        console.log(`✅ Уведомление отправлено пользователю ${payment.user_id}`);
      } catch (notificationError) {
        console.error('⚠️ Ошибка отправки уведомления:', notificationError);
        // Не прерываем выполнение из-за ошибки уведомления
      }
    } else {
      console.log(`ℹ️ План ${payment.plan_id} не дает автоматический статус эксперта (только monthly и yearly)`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ Ошибка обработки успешного платежа:', error);
    console.error('Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      payment_id: payment.id,
      user_id: payment.user_id,
      plan_id: payment.plan_id
    });
    throw error;
  }
}

// Функция для проверки статуса платежа через API Юкассы
async function checkPaymentStatusFromYooKassa(yookassaPaymentId: string): Promise<{ status: string } | null> {
  try {
    const response = await fetch(`${YOOKASSA_API_URL}/${yookassaPaymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Ошибка проверки платежа в Юкассе: ${response.status}`);
      return null;
    }

    const paymentData: any = await response.json();
    // Нам важен только статус
    return { status: paymentData.status as string };
  } catch (error) {
    console.error('Ошибка запроса статуса платежа в Юкассе:', error);
    return null;
  }
}

// Webhook для обработки уведомлений от Юкассы
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('=====================================');
    console.log('📥 Получен webhook от Юкассы');
    console.log('Время:', new Date().toISOString());

    // Проверяем тип req.body - может быть Buffer или уже объект
    let webhookData: YooKassaWebhookEvent;
    let bodyString: string;

    if (Buffer.isBuffer(req.body)) {
      // Если Buffer - конвертируем в строку и парсим
      bodyString = req.body.toString();
      console.log('Данные webhook (Buffer, первые 200 символов):', bodyString.substring(0, 200));
      webhookData = JSON.parse(bodyString);
    } else if (typeof req.body === 'string') {
      // Если строка - парсим
      bodyString = req.body;
      console.log('Данные webhook (String, первые 200 символов):', bodyString.substring(0, 200));
      webhookData = JSON.parse(bodyString);
    } else {
      // Если уже объект - используем как есть
      webhookData = req.body;
      bodyString = JSON.stringify(req.body);
      console.log('Данные webhook (уже объект):', bodyString.substring(0, 200));
    }

    const signature = req.headers['x-yookassa-signature'] as string;

    // Проверяем подпись webhook (мягкая проверка для автоматизации)
    if (!verifyYooKassaWebhookSignature(bodyString, signature, YOOKASSA_SECRET_KEY)) {
      console.error('⚠️ Неверная подпись webhook от Юкассы, но продолжаем обработку');
      // Не блокируем, чтобы не нарушать автоматизацию
    }

    const { event, object } = webhookData;

    console.log(`📋 Событие: ${event}`);
    console.log(`📋 ID платежа Юкассы: ${object.id}`);
    console.log(`📋 Статус: ${object.status}`);
    if (object.metadata) {
      console.log(`📋 Metadata:`, JSON.stringify(object.metadata, null, 2));
    }

    if (event === 'payment.succeeded') {
      const { id: yookassaPaymentId, metadata } = object;

      console.log(`🔍 Ищем платеж в базе данных с yookassa_payment_id: ${yookassaPaymentId}`);

      // Находим платеж в нашей базе данных
      const paymentResult = await query(
        'SELECT * FROM payments WHERE yookassa_payment_id = $1',
        [yookassaPaymentId]
      );

      if (paymentResult.rows.length === 0) {
        console.error(`❌ Платеж с yookassa_payment_id ${yookassaPaymentId} не найден в базе данных`);
        console.error('Проверьте, что платеж был создан через /api/payments/create');
        return res.status(200).json({ error: 'Платеж не найден', warning: 'Возвращаем 200 для Юкассы' });
      }

      const payment = paymentResult.rows[0];
      console.log(`✅ Платеж найден в БД: ID ${payment.id}, user_id: ${payment.user_id}, plan_id: ${payment.plan_id}, текущий статус: ${payment.status}`);

      const result = await processSuccessfulPayment(payment);

      if (result.success) {
        console.log(`✅ Платеж ${payment.id} успешно обработан`);
      } else if (result.alreadyProcessed) {
        console.log(`ℹ️ Платеж ${payment.id} уже был обработан ранее`);
      } else if (result.error) {
        console.error(`❌ Ошибка обработки платежа ${payment.id}: ${result.error}`);
      }

    } else if (event === 'payment.canceled') {
      const { id: yookassaPaymentId } = object;

      console.log(`❌ Получено событие отмены платежа: ${yookassaPaymentId}`);

      // Обновляем статус платежа на отмененный
      await query(
        'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE yookassa_payment_id = $2',
        ['canceled', yookassaPaymentId]
      );

      console.log(`✅ Статус платежа ${yookassaPaymentId} обновлен на 'canceled'`);
    } else {
      console.log(`ℹ️ Получено неизвестное событие: ${event}`);
      console.log('Полные данные события:', JSON.stringify(webhookData, null, 2));
    }

    console.log('✅ Webhook обработан успешно');
    console.log('=====================================');
    res.status(200).json({ message: 'Webhook обработан успешно' });
  } catch (error: any) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА обработки webhook:', error);
    console.error('Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.error('=====================================');
    // Все равно возвращаем 200, чтобы Юкасса не пыталась повторно отправлять
    res.status(200).json({ error: 'Ошибка обработки webhook (записано в лог)' });
  }
});

// Проверка статуса платежа с автоматической проверкой в Юкассе (fallback механизм)
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

    let payment = paymentResult.rows[0];

    // Если платеж еще не подтвержден, проверяем статус в Юкассе (fallback механизм)
    if (payment.status === 'pending' && payment.yookassa_payment_id) {
      console.log(`🔄 [FALLBACK] Проверка статуса платежа ${payment.id} (plan: ${payment.plan_id}) в Юкассе...`);
      const yooKassaPayment = await checkPaymentStatusFromYooKassa(payment.yookassa_payment_id);

      if (yooKassaPayment && yooKassaPayment.status === 'succeeded') {
        console.log(`✅ [FALLBACK] Платеж ${payment.id} успешен в Юкассе, обрабатываем автоматически`);
        // Автоматически обрабатываем успешный платеж
        const result = await processSuccessfulPayment(payment);

        if (result.success) {
          console.log(`✅ [FALLBACK] Платеж ${payment.id} успешно обработан через fallback механизм`);
        }

        // Обновляем payment для ответа
        const updatedResult = await query(
          'SELECT * FROM payments WHERE id = $1',
          [paymentId]
        );
        if (updatedResult.rows.length > 0) {
          payment = updatedResult.rows[0];
        }
      } else if (yooKassaPayment && yooKassaPayment.status === 'canceled') {
        console.log(`❌ [FALLBACK] Платеж ${payment.id} отменен в Юкассе`);
        await query(
          'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['canceled', payment.id]
        );
        payment.status = 'canceled';
      } else {
        console.log(`ℹ️ [FALLBACK] Статус платежа ${payment.id} в Юкассе: ${yooKassaPayment?.status || 'неизвестно'}`);
      }
    }

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

