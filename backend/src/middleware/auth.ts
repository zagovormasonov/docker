import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  userType?: string;
}

// Кеш последней проверки подписок (чтобы не проверять слишком часто)
let lastSubscriptionCheck = 0;
const SUBSCRIPTION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 минут

// Функция проверки истекших подписок (импортируется динамически, чтобы избежать циклических зависимостей)
async function checkExpiredSubscriptions() {
  try {
    const subscriptionChecker = await import('../routes/subscription-checker');
    await subscriptionChecker.checkAndRevokeExpiredSubscriptions();
  } catch (error) {
    console.error('⚠️ Фоновая проверка подписок не удалась:', error);
  }
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('🔑 Проверка токена аутентификации');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('🎫 Токен получен:', !!token);

  if (!token) {
    console.log('❌ Токен не предоставлен');
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) {
      console.log('❌ Недействительный токен:', err.message);
      return res.status(403).json({ error: 'Недействительный токен' });
    }

    console.log('✅ Токен валиден, пользователь:', user.userId, 'тип:', user.userType || user.user_type);
    req.userId = user.userId;
    req.userType = user.userType || user.user_type;
    
    // Дополнительная проверка
    if (!req.userId) {
      console.log('❌ userId не найден в токене');
      return res.status(403).json({ error: 'Недействительный токен: отсутствует userId' });
    }
    
    // Периодически проверяем истекшие подписки (не чаще раз в 5 минут)
    const now = Date.now();
    if (now - lastSubscriptionCheck > SUBSCRIPTION_CHECK_INTERVAL) {
      lastSubscriptionCheck = now;
      
      // Запускаем проверку в фоне, не блокируя запрос
      checkExpiredSubscriptions();
    }
    
    next();
  });
};

export const requireExpert = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('🔍 Проверка прав эксперта для пользователя:', req.userId, 'тип в токене:', req.userType);
  
  // Проверяем права эксперта в базе данных (единственный источник правды)
  try {
    const { query } = await import('../config/database');
    const result = await query(
      'SELECT user_type FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Пользователь не найден в базе данных');
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const dbUserType = result.rows[0].user_type;
    if (dbUserType !== 'expert' && dbUserType !== 'admin') {
      console.log('❌ Пользователь не является экспертом или админом в базе данных:', dbUserType);
      return res.status(403).json({ error: 'Доступно только для экспертов' });
    }
    
    // Обновляем req.userType актуальным значением из БД
    req.userType = dbUserType;
    console.log('✅ Пользователь подтвержден как эксперт в БД');
    next();
  } catch (error) {
    console.error('❌ Ошибка проверки прав эксперта:', error);
    return res.status(500).json({ error: 'Ошибка проверки прав доступа' });
  }
};
