import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { generateUniqueSlug } from '../utils/transliterate';

const router = express.Router();

// Регистрация
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 }),
    body('userType').isIn(['client', 'expert'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name, userType } = req.body;

      // Проверка существования пользователя по email
      const existingUserByEmail = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUserByEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }

      // Проверка существования пользователя по имени
      const existingUserByName = await query(
        'SELECT id FROM users WHERE name = $1',
        [name]
      );

      if (existingUserByName.rows.length > 0) {
        return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
      }

      // Хеширование пароля
      const hashedPassword = await bcrypt.hash(password, 10);

      // Генерация токена верификации
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Генерация уникального slug
      const checkSlugExists = async (slug: string, userId: number | null): Promise<boolean> => {
        const result = await query(
          'SELECT id FROM users WHERE slug = $1',
          [slug]
        );
        return result.rows.length > 0;
      };
      
      const userSlug = await generateUniqueSlug(name, null, checkSlugExists);

      // Создание пользователя (неподтвержденный)
      const result = await query(
        `INSERT INTO users (email, password, name, user_type, email_verified, verification_token, slug) 
         VALUES ($1, $2, $3, $4, false, $5, $6) 
         RETURNING id, email, name, user_type, verification_token, slug, created_at`,
        [email, hashedPassword, name, userType, verificationToken, userSlug]
      );

      const user = result.rows[0];

      res.status(201).json({
        message: 'Регистрация успешна! Проверьте email для подтверждения аккаунта.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.user_type,
          verificationToken: user.verification_token
        }
      });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Авторизация
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Поиск пользователя
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
      }

      const user = result.rows[0];

      // Проверка пароля
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
      }

      // Проверка подтверждения email
      if (!user.email_verified) {
        return res.status(403).json({ 
          error: 'Email не подтвержден. Проверьте почту и перейдите по ссылке подтверждения.' 
        });
      }

      // Генерация токена
      const token = jwt.sign(
        { userId: user.id, userType: user.user_type },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.user_type,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          city: user.city
        }
      });
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Подтверждение email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Поиск пользователя по токену
    const result = await query(
      'SELECT id, email, name, user_type FROM users WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Неверный токен верификации' });
    }

    const user = result.rows[0];

    // Обновление статуса верификации
    await query(
      `UPDATE users 
       SET email_verified = true, verification_token = NULL 
       WHERE id = $1`,
      [user.id]
    );

    // Генерация JWT токена для автоматического входа
    const jwtToken = jwt.sign(
      { userId: user.id, userType: user.user_type },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Email успешно подтвержден!',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Ошибка верификации email:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запрос на восстановление пароля
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }

    // Поиск пользователя
    const result = await query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }

    const user = result.rows[0];

    // Генерация токена восстановления
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 час

    // Сохранение токена в БД
    await query(
      `UPDATE users 
       SET reset_password_token = $1, reset_password_expires = $2 
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    res.json({
      message: 'Письмо с инструкциями отправлено',
      user: {
        email: user.email,
        name: user.name,
        resetToken
      }
    });
  } catch (error) {
    console.error('Ошибка запроса восстановления пароля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сброс пароля
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Токен и новый пароль обязательны' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    }

    // Поиск пользователя по токену
    const result = await query(
      `SELECT id, email, name, user_type 
       FROM users 
       WHERE reset_password_token = $1 
       AND reset_password_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Недействительный или истекший токен' });
    }

    const user = result.rows[0];

    // Хеширование нового пароля
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновление пароля и очистка токена
    await query(
      `UPDATE users 
       SET password = $1, 
           reset_password_token = NULL, 
           reset_password_expires = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    // Генерация JWT для автоматического входа
    const jwtToken = jwt.sign(
      { userId: user.id, userType: user.user_type },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Пароль успешно изменен!',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Ошибка сброса пароля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Ручная верификация email (для админа)
router.post('/verify-email-manual', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }
    
    // Проверяем существование пользователя
    const userResult = await query(
      'SELECT id, name, email, email_verified FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const user = userResult.rows[0];
    
    if (user.email_verified) {
      return res.json({ 
        message: 'Email уже подтвержден',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          email_verified: user.email_verified
        }
      });
    }
    
    // Обновляем статус верификации
    await query(
      'UPDATE users SET email_verified = true WHERE email = $1',
      [email]
    );
    
    res.json({ 
      message: 'Email успешно подтвержден',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified: true
      }
    });
    
  } catch (error) {
    console.error('Ошибка ручной верификации email:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
