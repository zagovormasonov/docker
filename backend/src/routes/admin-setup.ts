import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// Временный endpoint для назначения администратора (только для разработки)
router.post('/make-admin', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }
    
    const result = await query(
      'UPDATE users SET user_type = $1 WHERE email = $2 RETURNING id, name, email, user_type',
      ['admin', email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json({
      message: 'Пользователь назначен администратором',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка назначения администратора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
