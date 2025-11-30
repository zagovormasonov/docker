import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * Функция проверки и отзыва истекших подписок
 * Вызывается по расписанию (cron job) 1 раз в день
 */
export async function checkAndRevokeExpiredSubscriptions(): Promise<{
  revokedCount: number;
  revokedUsers: Array<{ id: number; email: string; username: string }>;
}> {
  try {
    console.log('🔍 Проверка истекших подписок...');

    // Получаем список пользователей с истекшими подписками
    const expiredResult = await query(
      `SELECT id, email, username, subscription_plan, subscription_expires_at
       FROM users
       WHERE user_type = 'expert'
         AND subscription_expires_at IS NOT NULL
         AND subscription_expires_at < CURRENT_TIMESTAMP`
    );

    const expiredUsers = expiredResult.rows;
    console.log(`📋 Найдено пользователей с истекшей подпиской: ${expiredUsers.length}`);

    if (expiredUsers.length === 0) {
      return { revokedCount: 0, revokedUsers: [] };
    }

    // Снимаем статус эксперта
    await query(
      `UPDATE users
       SET user_type = 'client',
           updated_at = CURRENT_TIMESTAMP
       WHERE user_type = 'expert'
         AND subscription_expires_at IS NOT NULL
         AND subscription_expires_at < CURRENT_TIMESTAMP`
    );

    // Отправляем уведомления каждому пользователю
    for (const user of expiredUsers) {
      const planText = user.subscription_plan === 'monthly' ? 'месячная' : 'годовая';
      const message = `Ваша ${planText} подписка истекла ${new Date(user.subscription_expires_at).toLocaleDateString('ru-RU')}. Для продолжения работы эксперта, пожалуйста, продлите подписку.`;

      try {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, created_at)
           VALUES ($1, 'subscription_expired', 'Подписка истекла', $2, CURRENT_TIMESTAMP)`,
          [user.id, message]
        );
        console.log(`✅ Уведомление об истечении отправлено: ${user.email}`);
      } catch (notificationError) {
        console.error(`⚠️ Ошибка отправки уведомления пользователю ${user.email}:`, notificationError);
      }
    }

    console.log(`✅ Отозвано ${expiredUsers.length} истекших подписок`);
    
    return {
      revokedCount: expiredUsers.length,
      revokedUsers: expiredUsers.map(u => ({ id: u.id, email: u.email, username: u.username }))
    };
  } catch (error) {
    console.error('❌ Ошибка проверки истекших подписок:', error);
    throw error;
  }
}

/**
 * Функция для отправки предупреждений за 5 дней до истечения подписки
 * Вызывается по расписанию (cron job) 1 раз в день
 */
export async function sendExpirationWarnings(): Promise<{
  warningCount: number;
  warnedUsers: Array<{ id: number; email: string; username: string }>;
}> {
  try {
    console.log('⚠️ Проверка подписок, истекающих в ближайшие 5 дней...');

    // Получаем пользователей, чьи подписки истекают через 5 дней или меньше
    // Но проверяем, что не отправляли им уведомление за последние 24 часа
    const expiringResult = await query(
      `SELECT DISTINCT u.id, u.email, u.username, u.subscription_plan, u.subscription_expires_at,
              EXTRACT(DAY FROM (u.subscription_expires_at - CURRENT_TIMESTAMP))::INTEGER as days_left
       FROM users u
       WHERE u.user_type = 'expert'
         AND u.subscription_expires_at IS NOT NULL
         AND u.subscription_expires_at > CURRENT_TIMESTAMP
         AND u.subscription_expires_at < CURRENT_TIMESTAMP + INTERVAL '5 days'
         -- Проверяем, что не отправляли уведомление за последние 24 часа
         AND NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.user_id = u.id
             AND n.type = 'subscription_expiring'
             AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
         )
       ORDER BY u.subscription_expires_at ASC`
    );

    const expiringUsers = expiringResult.rows;
    console.log(`📋 Найдено пользователей с истекающей подпиской: ${expiringUsers.length}`);

    if (expiringUsers.length === 0) {
      return { warningCount: 0, warnedUsers: [] };
    }

    // Отправляем предупреждения
    for (const user of expiringUsers) {
      const planText = user.subscription_plan === 'monthly' ? 'месячная' : 'годовая';
      const daysLeft = user.days_left;
      const expirationDate = new Date(user.subscription_expires_at).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let message = '';
      if (daysLeft <= 1) {
        message = `⚠️ Внимание! Ваша ${planText} подписка истекает завтра (${expirationDate}). Продлите подписку, чтобы не потерять доступ к функциям эксперта.`;
      } else {
        message = `⚠️ Напоминание: Ваша ${planText} подписка истекает через ${daysLeft} ${getDaysWord(daysLeft)} (${expirationDate}). Рекомендуем продлить подписку заранее.`;
      }

      try {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, created_at)
           VALUES ($1, 'subscription_expiring', 'Подписка скоро истечет', $2, CURRENT_TIMESTAMP)`,
          [user.id, message]
        );
        console.log(`✅ Предупреждение отправлено: ${user.email} (осталось ${daysLeft} дней)`);
      } catch (notificationError) {
        console.error(`⚠️ Ошибка отправки предупреждения пользователю ${user.email}:`, notificationError);
      }
    }

    console.log(`✅ Отправлено ${expiringUsers.length} предупреждений`);
    
    return {
      warningCount: expiringUsers.length,
      warnedUsers: expiringUsers.map(u => ({ id: u.id, email: u.email, username: u.username }))
    };
  } catch (error) {
    console.error('❌ Ошибка отправки предупреждений:', error);
    throw error;
  }
}

// Вспомогательная функция для склонения слова "день"
function getDaysWord(days: number): string {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дня';
  return 'дней';
}

/**
 * Основная функция для ежедневной проверки подписок
 * Запускается по расписанию (cron job) в 03:00 ночи
 */
export async function dailySubscriptionCheck(): Promise<void> {
  console.log('');
  console.log('🌙 ==========================================');
  console.log('🌙 ЕЖЕДНЕВНАЯ ПРОВЕРКА ПОДПИСОК');
  console.log('🌙 Время:', new Date().toISOString());
  console.log('🌙 ==========================================');
  console.log('');

  try {
    // 1. Отправляем предупреждения за 5 дней
    console.log('📨 Шаг 1: Отправка предупреждений...');
    const warningsResult = await sendExpirationWarnings();
    console.log(`✅ Предупреждений отправлено: ${warningsResult.warningCount}`);
    console.log('');

    // 2. Отзываем истекшие подписки
    console.log('🔄 Шаг 2: Отзыв истекших подписок...');
    const revokeResult = await checkAndRevokeExpiredSubscriptions();
    console.log(`✅ Подписок отозвано: ${revokeResult.revokedCount}`);
    console.log('');

    console.log('🌙 ==========================================');
    console.log('🌙 ПРОВЕРКА ЗАВЕРШЕНА УСПЕШНО');
    console.log('🌙 Предупреждений:', warningsResult.warningCount);
    console.log('🌙 Отозвано:', revokeResult.revokedCount);
    console.log('🌙 ==========================================');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ ==========================================');
    console.error('❌ ОШИБКА ЕЖЕДНЕВНОЙ ПРОВЕРКИ');
    console.error('❌', error);
    console.error('❌ ==========================================');
    console.error('');
    throw error;
  }
}

/**
 * Получить список пользователей с истекающими в ближайшее время подписками
 */
export async function getExpiringSubscriptions(daysBeforeExpiration: number = 7): Promise<any[]> {
  try {
    const result = await query(
      `SELECT id, email, username, subscription_plan, subscription_expires_at,
              EXTRACT(DAY FROM (subscription_expires_at - CURRENT_TIMESTAMP)) as days_left
       FROM users
       WHERE user_type = 'expert'
         AND subscription_expires_at IS NOT NULL
         AND subscription_expires_at > CURRENT_TIMESTAMP
         AND subscription_expires_at < CURRENT_TIMESTAMP + INTERVAL '${daysBeforeExpiration} days'
       ORDER BY subscription_expires_at ASC`
    );

    return result.rows;
  } catch (error) {
    console.error('❌ Ошибка получения истекающих подписок:', error);
    throw error;
  }
}

// API эндпоинт для ручного запуска проверки (только для админов)
router.post('/check-expired', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    // Проверяем права админа
    const userResult = await query('SELECT user_type FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0 || userResult.rows[0].user_type !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const result = await checkAndRevokeExpiredSubscriptions();

    res.json({
      message: 'Проверка завершена',
      revokedCount: result.revokedCount,
      revokedUsers: result.revokedUsers
    });
  } catch (error) {
    console.error('Ошибка проверки истекших подписок:', error);
    res.status(500).json({ error: 'Ошибка проверки подписок' });
  }
});

// API эндпоинт для ручной отправки предупреждений (только для админов)
router.post('/send-warnings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    // Проверяем права админа
    const userResult = await query('SELECT user_type FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0 || userResult.rows[0].user_type !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const result = await sendExpirationWarnings();

    res.json({
      message: 'Предупреждения отправлены',
      warningCount: result.warningCount,
      warnedUsers: result.warnedUsers
    });
  } catch (error) {
    console.error('Ошибка отправки предупреждений:', error);
    res.status(500).json({ error: 'Ошибка отправки предупреждений' });
  }
});

// API эндпоинт для запуска полной проверки (только для админов)
router.post('/daily-check', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    // Проверяем права админа
    const userResult = await query('SELECT user_type FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0 || userResult.rows[0].user_type !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    await dailySubscriptionCheck();

    res.json({
      message: 'Полная проверка завершена успешно'
    });
  } catch (error) {
    console.error('Ошибка полной проверки:', error);
    res.status(500).json({ error: 'Ошибка полной проверки' });
  }
});

// API эндпоинт для получения списка истекающих подписок (только для админов)
router.get('/expiring', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const daysBeforeExpiration = parseInt(req.query.days as string) || 7;

    // Проверяем права админа
    const userResult = await query('SELECT user_type FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0 || userResult.rows[0].user_type !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const expiringSubscriptions = await getExpiringSubscriptions(daysBeforeExpiration);

    res.json({
      count: expiringSubscriptions.length,
      subscriptions: expiringSubscriptions
    });
  } catch (error) {
    console.error('Ошибка получения истекающих подписок:', error);
    res.status(500).json({ error: 'Ошибка получения подписок' });
  }
});

// API эндпоинт для получения информации о своей подписке
router.get('/my-subscription', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    const result = await query(
      `SELECT 
        user_type,
        subscription_plan,
        subscription_expires_at,
        last_payment_date,
        CASE 
          WHEN subscription_expires_at IS NULL THEN NULL
          WHEN subscription_expires_at > CURRENT_TIMESTAMP THEN 
            EXTRACT(DAY FROM (subscription_expires_at - CURRENT_TIMESTAMP))::INTEGER
          ELSE 0
        END as days_left,
        CASE 
          WHEN subscription_expires_at IS NULL THEN 'no_subscription'
          WHEN subscription_expires_at > CURRENT_TIMESTAMP THEN 'active'
          ELSE 'expired'
        END as status
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения информации о подписке:', error);
    res.status(500).json({ error: 'Ошибка получения информации о подписке' });
  }
});

export default router;

