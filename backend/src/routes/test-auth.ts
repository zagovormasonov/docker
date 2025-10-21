import express from 'express';
import { authenticateToken, requireExpert, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Тестовый endpoint для проверки аутентификации
router.get('/test-auth', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    message: 'Аутентификация работает',
    userId: req.userId,
    userType: req.userType
  });
});

// Тестовый endpoint для проверки прав эксперта
router.get('/test-expert', authenticateToken, requireExpert, (req: AuthRequest, res) => {
  res.json({
    message: 'Права эксперта подтверждены',
    userId: req.userId,
    userType: req.userType
  });
});

export default router;
