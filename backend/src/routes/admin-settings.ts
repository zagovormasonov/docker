import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { query } from '../config/database';

const router = express.Router();

// Проверка прав администратора
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: 'Доступно только для администраторов' });
  }
  next();
};

// Получить все настройки
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM global_settings');
    const settings: Record<string, any> = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Ошибка получения настроек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить конкретную настройку
router.get('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const result = await query('SELECT value FROM global_settings WHERE key = $1', [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }
    
    res.json(result.rows[0].value);
  } catch (error) {
    console.error('Ошибка получения настройки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить настройку
router.put('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Значение обязательно' });
    }
    
    await query(
      `INSERT INTO global_settings (key, value, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, value]
    );
    
    res.json({ message: 'Настройка обновлена', key, value });
  } catch (error) {
    console.error('Ошибка обновления настройки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
