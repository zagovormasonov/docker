import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authenticateToken, requireExpert } from '../middleware/auth';

const router = express.Router();

interface AuthRequest extends express.Request {
  userId: number;
}

// Получение всех продуктов эксперта
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM products WHERE expert_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения продуктов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение продуктов конкретного эксперта (публичный endpoint)
router.get('/expert/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM products WHERE expert_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения продуктов эксперта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание продукта
router.post(
  '/',
  authenticateToken,
  requireExpert,
  [
    body('title').trim().isLength({ min: 3 }).withMessage('Название должно содержать минимум 3 символа'),
    body('description').trim().isLength({ min: 10 }).withMessage('Описание должно содержать минимум 10 символов'),
    body('productType').isIn(['digital', 'physical', 'service']).withMessage('Неверный тип продукта'),
    body('price').optional().isNumeric().withMessage('Цена должна быть числом')
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, price, productType, imageUrl } = req.body;

      const result = await query(
        `INSERT INTO products (expert_id, title, description, price, product_type, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.userId, title, description, price, productType, imageUrl]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка создания продукта:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Обновление продукта
router.put(
  '/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, description, price, productType, imageUrl } = req.body;

      const result = await query(
        `UPDATE products 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             price = COALESCE($3, price),
             product_type = COALESCE($4, product_type),
             image_url = COALESCE($5, image_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND expert_id = $7
         RETURNING *`,
        [title, description, price, productType, imageUrl, id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Продукт не найден' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка обновления продукта:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Удаление продукта
router.delete(
  '/:id',
  authenticateToken,
  requireExpert,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const result = await query(
        'DELETE FROM products WHERE id = $1 AND expert_id = $2',
        [id, req.userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Продукт не найден' });
      }

      res.json({ message: 'Продукт удален' });
    } catch (error) {
      console.error('Ошибка удаления продукта:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Получение одного продукта
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Продукт не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения продукта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
