import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Создаем папку gallery если её нет
const galleryDir = path.join(__dirname, '../../uploads/gallery');
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

// Настройка хранилища для галереи
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, galleryDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  }
});

// Фильтр для изображений
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB на изображение
  fileFilter: fileFilter
});

// Получить галерею пользователя
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM profile_gallery WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения галереи:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Загрузить изображение в галерею
router.post('/upload', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Проверяем количество фотографий (максимум 20)
    const countResult = await query(
      'SELECT COUNT(*) as count FROM profile_gallery WHERE user_id = $1',
      [req.userId]
    );
    
    const currentCount = parseInt(countResult.rows[0].count);
    if (currentCount >= 20) {
      // Удаляем загруженный файл, если превышен лимит
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Максимальное количество фотографий: 20' });
    }

    const imageUrl = `/uploads/gallery/${req.file.filename}`;
    
    // Сохраняем информацию в базу данных
    const result = await query(
      `INSERT INTO profile_gallery (user_id, image_url, image_name, image_size) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, imageUrl, req.file.originalname, req.file.size]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка загрузки в галерею:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить изображение из галереи
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Получаем информацию об изображении
    const imageResult = await query(
      'SELECT * FROM profile_gallery WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Изображение не найдено' });
    }
    
    const image = imageResult.rows[0];
    
    // Удаляем файл с диска
    const filePath = path.join(__dirname, '../../uploads/gallery', path.basename(image.image_url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Удаляем запись из базы данных
    await query(
      'DELETE FROM profile_gallery WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    
    res.json({ message: 'Изображение удалено' });
  } catch (error) {
    console.error('Ошибка удаления изображения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить количество изображений в галерее
router.get('/count', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM profile_gallery WHERE user_id = $1',
      [req.userId]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Ошибка получения количества:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
