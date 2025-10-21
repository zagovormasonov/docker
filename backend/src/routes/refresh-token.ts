import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Обновление токена с актуальными данными из БД
router.post('/refresh-token', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('🔄 Обновление токена для пользователя:', req.userId);
    
    // Получаем актуальные данные пользователя из БД
    const result = await query(
      'SELECT id, email, name, user_type FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const user = result.rows[0];
    console.log('📊 Актуальные данные пользователя:', user);
    
    // Создаем новый токен с актуальными данными
    const newToken = jwt.sign(
      { userId: user.id, userType: user.user_type },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );
    
    res.json({
      message: 'Токен обновлен',
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('❌ Ошибка обновления токена:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
