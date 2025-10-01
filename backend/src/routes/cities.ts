import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// Получение всех городов
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM cities ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения городов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

