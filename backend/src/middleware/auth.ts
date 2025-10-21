import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  userType?: string;
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
    
    next();
  });
};

export const requireExpert = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('🔍 Проверка прав эксперта для пользователя:', req.userId, 'тип:', req.userType);
  
  if (req.userType !== 'expert') {
    console.log('❌ Пользователь не является экспертом по токену');
    return res.status(403).json({ error: 'Доступно только для экспертов' });
  }
  
  // Дополнительная проверка в базе данных
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
    if (dbUserType !== 'expert') {
      console.log('❌ Пользователь не является экспертом в базе данных:', dbUserType);
      return res.status(403).json({ error: 'Доступно только для экспертов' });
    }
    
    console.log('✅ Пользователь подтвержден как эксперт');
    next();
  } catch (error) {
    console.error('❌ Ошибка проверки прав эксперта:', error);
    return res.status(500).json({ error: 'Ошибка проверки прав доступа' });
  }
};
