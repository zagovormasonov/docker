import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authenticateToken, requireExpert } from '../middleware/auth';

const router = express.Router();

interface AuthRequest extends express.Request {
  userId: number;
}

const productDetailsFields = `
  product_format,
  category_key,
  is_new,
  thumb_bg,
  emoji,
  badge,
  tag_label,
  meta_detail,
  is_featured,
  hit_label,
  button_label
`;

const productDetailValidators = [
  body('productFormat').optional({ nullable: true }).isIn(['audio', 'video', 'text', 'bundle']).withMessage('Неверный формат продукта'),
  body('categoryKey').optional({ nullable: true }).isString(),
  body('isNew').optional({ nullable: true }).isBoolean().withMessage('Поле "Новинка" должно быть boolean'),
  body('thumbBg').optional({ nullable: true }).isString(),
  body('emoji').optional({ nullable: true }).isString(),
  body('badge').optional({ nullable: true }).isString(),
  body('tagLabel').optional({ nullable: true }).isString(),
  body('metaDetail').optional({ nullable: true }).isString(),
  body('isFeatured').optional({ nullable: true }).isBoolean().withMessage('Поле "Избранный" должно быть boolean'),
  body('hitLabel').optional({ nullable: true }).isString(),
  body('buttonLabel').optional({ nullable: true }).isString()
];

const mapProductDetails = (payload: any) => [
  payload.productFormat,
  payload.categoryKey,
  payload.isNew,
  payload.thumbBg,
  payload.emoji,
  payload.badge,
  payload.tagLabel,
  payload.metaDetail,
  payload.isFeatured,
  payload.hitLabel,
  payload.buttonLabel
];

const ensureProductDetailsColumns = async () => {
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS product_format VARCHAR(50) DEFAULT 'text' CHECK (product_format IN ('audio', 'video', 'text', 'bundle'))`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category_key VARCHAR(255) DEFAULT 'soul'`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS thumb_bg VARCHAR(20) DEFAULT '#eae8fb'`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS emoji VARCHAR(20) DEFAULT '📄'`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(100)`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS tag_label VARCHAR(100)`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_detail VARCHAR(100)`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS hit_label VARCHAR(50)`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS button_label VARCHAR(50) DEFAULT 'Открыть'`);
};

let productDetailsColumnsReady: Promise<void> | null = null;

const ensureProductDetailsColumnsReady = async () => {
  if (!productDetailsColumnsReady) {
    productDetailsColumnsReady = ensureProductDetailsColumns().catch((error) => {
      productDetailsColumnsReady = null;
      throw error;
    });
  }
  return productDetailsColumnsReady;
};

// Получение всех продуктов эксперта
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await ensureProductDetailsColumnsReady();
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

// Публичная витрина цифровых продуктов
router.get('/digital/public', async (_req, res) => {
  try {
    await ensureProductDetailsColumnsReady();
    const result = await query(
      `SELECT p.*, u.name AS expert_name, u.slug AS expert_slug
       FROM products p
       JOIN users u ON u.id = p.expert_id
       WHERE p.product_type = 'digital'
       ORDER BY p.is_featured DESC, p.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения цифровых продуктов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение продуктов конкретного эксперта (публичный endpoint)
router.get('/expert/:id', async (req, res) => {
  try {
    await ensureProductDetailsColumnsReady();
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
    body('price').optional({ nullable: true }).isNumeric().withMessage('Цена должна быть числом'),
    ...productDetailValidators
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await ensureProductDetailsColumnsReady();
      const { title, description, price, productType, imageUrl } = req.body;
      const [
        productFormat,
        categoryKey,
        isNew,
        thumbBg,
        emoji,
        badge,
        tagLabel,
        metaDetail,
        isFeatured,
        hitLabel,
        buttonLabel
      ] = mapProductDetails(req.body);

      const result = await query(
        `INSERT INTO products (
           expert_id, title, description, price, product_type, image_url, ${productDetailsFields}
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [
          req.userId,
          title,
          description,
          price,
          productType,
          imageUrl,
          productFormat,
          categoryKey,
          isNew,
          thumbBg,
          emoji,
          badge,
          tagLabel,
          metaDetail,
          isFeatured,
          hitLabel,
          buttonLabel
        ]
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
  productDetailValidators,
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await ensureProductDetailsColumnsReady();
      const { id } = req.params;
      const { title, description, price, productType, imageUrl } = req.body;
      const [
        productFormat,
        categoryKey,
        isNew,
        thumbBg,
        emoji,
        badge,
        tagLabel,
        metaDetail,
        isFeatured,
        hitLabel,
        buttonLabel
      ] = mapProductDetails(req.body);

      const result = await query(
        `UPDATE products 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             price = COALESCE($3, price),
             product_type = COALESCE($4, product_type),
             image_url = COALESCE($5, image_url),
             product_format = COALESCE($6, product_format),
             category_key = COALESCE($7, category_key),
             is_new = COALESCE($8, is_new),
             thumb_bg = COALESCE($9, thumb_bg),
             emoji = COALESCE($10, emoji),
             badge = COALESCE($11, badge),
             tag_label = COALESCE($12, tag_label),
             meta_detail = COALESCE($13, meta_detail),
             is_featured = COALESCE($14, is_featured),
             hit_label = COALESCE($15, hit_label),
             button_label = COALESCE($16, button_label),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $17 AND expert_id = $18
         RETURNING *`,
        [
          title,
          description,
          price,
          productType,
          imageUrl,
          productFormat,
          categoryKey,
          isNew,
          thumbBg,
          emoji,
          badge,
          tagLabel,
          metaDetail,
          isFeatured,
          hitLabel,
          buttonLabel,
          id,
          req.userId
        ]
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
      await ensureProductDetailsColumnsReady();
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
    await ensureProductDetailsColumnsReady();
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
