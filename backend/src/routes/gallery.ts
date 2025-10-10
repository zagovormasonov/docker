import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Тестовый эндпоинт для проверки работы галереи
router.get('/test', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('🧪 Тестовый запрос галереи');
    console.log('👤 Пользователь ID:', req.userId);
    console.log('👤 Тип пользователя:', req.userType);
    
    // Проверяем существование таблицы
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profile_gallery'
      )
    `);
    
    console.log('📊 Таблица profile_gallery существует:', tableCheck.rows[0].exists);
    
    res.json({
      message: 'Галерея работает',
      userId: req.userId,
      userType: req.userType,
      tableExists: tableCheck.rows[0].exists
    });
  } catch (error) {
    console.error('❌ Ошибка тестового запроса:', error);
    res.status(500).json({ error: 'Ошибка тестового запроса: ' + error.message });
  }
});

// Создаем папку gallery если её нет
const galleryDir = path.join(__dirname, '../../uploads/gallery');
console.log('📁 Путь к папке галереи:', galleryDir);

if (!fs.existsSync(galleryDir)) {
  console.log('📁 Создаю папку gallery...');
  try {
    fs.mkdirSync(galleryDir, { recursive: true });
    console.log('✅ Папка gallery создана');
  } catch (error) {
    console.error('❌ Ошибка создания папки gallery:', error);
  }
} else {
  console.log('✅ Папка gallery существует');
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

// Получить галерею текущего пользователя (для управления)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('📸 Запрос галереи от пользователя:', req.userId);
    
    const result = await query(
      'SELECT * FROM profile_gallery WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    
    console.log('📸 Найдено фотографий:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Ошибка получения галереи:', error);
    console.error('❌ Детали ошибки:', error.message);
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});

// Получить галерею конкретного пользователя (для просмотра)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📸 Запрос галереи пользователя:', userId);
    
    const result = await query(
      'SELECT * FROM profile_gallery WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    console.log('📸 Найдено фотографий для пользователя', userId, ':', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Ошибка получения галереи пользователя:', error);
    console.error('❌ Детали ошибки:', error.message);
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});

// Загрузить изображение в галерею
router.post('/upload', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    console.log('📤 Запрос на загрузку в галерею от пользователя:', req.userId);
    
    if (!req.file) {
      console.log('❌ Файл не загружен');
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    console.log('📁 Файл загружен:', req.file.filename, 'Размер:', req.file.size);

    // Проверяем количество фотографий (максимум 20)
    console.log('🔍 Проверяем количество фотографий...');
    const countResult = await query(
      'SELECT COUNT(*) as count FROM profile_gallery WHERE user_id = $1',
      [req.userId]
    );
    
    const currentCount = parseInt(countResult.rows[0].count);
    console.log('📊 Текущее количество фотографий:', currentCount);
    
    if (currentCount >= 20) {
      console.log('❌ Превышен лимит фотографий');
      // Удаляем загруженный файл, если превышен лимит
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Максимальное количество фотографий: 20' });
    }

    const imageUrl = `/uploads/gallery/${req.file.filename}`;
    console.log('🔗 URL изображения:', imageUrl);
    
    // Сохраняем информацию в базу данных
    console.log('💾 Сохраняем в базу данных...');
    const result = await query(
      `INSERT INTO profile_gallery (user_id, image_url, image_name, image_size) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, imageUrl, req.file.originalname, req.file.size]
    );

    console.log('✅ Фотография успешно загружена в галерею');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Ошибка загрузки в галерею:', error);
    console.error('❌ Детали ошибки:', error.message);
    console.error('❌ Стек ошибки:', error.stack);
    
    // Удаляем файл в случае ошибки
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Файл удален после ошибки');
      } catch (unlinkError) {
        console.error('❌ Ошибка удаления файла:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
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
