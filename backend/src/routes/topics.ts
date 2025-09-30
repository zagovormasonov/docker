import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// Получение всех тематик
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM topics ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения тематик:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
