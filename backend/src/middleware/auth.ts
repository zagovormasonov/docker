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

    console.log('✅ Токен валиден, пользователь:', user.userId, 'тип:', user.userType);
    req.userId = user.userId;
    req.userType = user.userType;
    
    // Дополнительная проверка
    if (!req.userId) {
      console.log('❌ userId не найден в токене');
      return res.status(403).json({ error: 'Недействительный токен: отсутствует userId' });
    }
    
    next();
  });
};

export const requireExpert = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.userType !== 'expert') {
    return res.status(403).json({ error: 'Доступно только для экспертов' });
  }
  next();
};
