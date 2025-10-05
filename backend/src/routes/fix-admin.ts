import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// Простой endpoint для исправления администратора
router.get('/fix-admin', async (req, res) => {
  try {
    const result = await query(
      'UPDATE users SET user_type = $1 WHERE email = $2 RETURNING id, name, email, user_type',
      ['admin', 'samyrize77777@gmail.com']
    );
    
    if (result.rows.length === 0) {
      return res.json({ 
        error: 'Пользователь не найден',
        message: 'Проверьте email адрес'
      });
    }
    
    res.json({
      success: true,
      message: 'Пользователь назначен администратором',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка назначения администратора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
