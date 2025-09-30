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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }

    req.userId = user.userId;
    req.userType = user.userType;
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
