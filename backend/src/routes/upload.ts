import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Создаем папку uploads если её нет
const uploadsDir = path.join(__dirname, '../../uploads');
console.log('📁 Путь к uploads:', uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Создаю папку uploads...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Папка uploads создана');
} else {
  console.log('✅ Папка uploads существует');
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter
});

// Загрузка одного изображения
router.post('/image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    console.log('📤 Запрос на загрузку изображения');
    
    if (!req.file) {
      console.error('❌ Файл не загружен');
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    console.log('✅ Файл загружен:', req.file.filename);
    console.log('📂 Путь:', req.file.path);

    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('🔗 URL изображения:', imageUrl);
    
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('❌ Ошибка загрузки изображения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

