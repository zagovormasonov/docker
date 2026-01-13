import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Создаем папку artworks если её нет
const artworksDir = path.join(__dirname, '../../uploads/artworks');
if (!fs.existsSync(artworksDir)) {
  fs.mkdirSync(artworksDir, { recursive: true });
}

// Настройка хранилища для картин
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, artworksDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `artwork-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Только изображения разрешены (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// Получить все картины пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      'SELECT * FROM artworks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения картин:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить картины текущего пользователя (для управления)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM artworks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения картин:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить картину
router.post('/', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const { title, description, price } = req.body;
    const imageUrl = `/uploads/artworks/${req.file.filename}`;

    const result = await query(
      `INSERT INTO artworks (user_id, image_url, title, description, price) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, imageUrl, title || null, description || null, price ? parseFloat(price) : null]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления картины:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить картину
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, price } = req.body;

    // Проверяем, что картина принадлежит пользователю
    const checkResult = await query(
      'SELECT * FROM artworks WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Картина не найдена' });
    }

    const result = await query(
      `UPDATE artworks 
       SET title = $1, description = $2, price = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [title || null, description || null, price ? parseFloat(price) : null, id, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления картины:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить картину
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Получаем информацию о картине
    const imageResult = await query(
      'SELECT * FROM artworks WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Картина не найдена' });
    }

    const artwork = imageResult.rows[0];

    // Удаляем файл с диска
    const filePath = path.join(__dirname, '../../uploads/artworks', path.basename(artwork.image_url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Удаляем запись из базы данных
    await query('DELETE FROM artworks WHERE id = $1 AND user_id = $2', [id, req.userId]);

    res.json({ message: 'Картина удалена' });
  } catch (error) {
    console.error('Ошибка удаления картины:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
