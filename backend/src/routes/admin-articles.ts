import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { query } from '../config/database';
import { createArticleEditedNotification, createArticleDeletedNotification } from '../utils/notifications';

const router = express.Router();

// Проверка прав администратора
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: 'Доступно только для администраторов' });
  }
  next();
};

// Получить все статьи с информацией об авторах
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        a.*,
        u.name as author_name,
        u.email as author_email,
        CASE WHEN a.is_published = true THEN 'Опубликована' ELSE 'На модерации' END as status
      FROM articles a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `);
    
    res.json({ success: true, articles: result.rows });
  } catch (error) {
    console.error('Ошибка получения статей:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Редактировать статью
router.put('/:id', authenticateToken, requireAdmin, [
  body('title').trim().isLength({ min: 5 }).withMessage('Заголовок должен содержать минимум 5 символов'),
  body('content').trim().isLength({ min: 50 }).withMessage('Содержимое должно содержать минимум 50 символов'),
  body('is_published').isBoolean().withMessage('Статус публикации должен быть boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content, is_published } = req.body;

    // Получаем информацию о статье и авторе
    const articleResult = await query(`
      SELECT a.*, u.name as author_name, u.email as author_email
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Статья не найдена' });
    }

    const article = articleResult.rows[0];

    // Обновляем статью
    await query(`
      UPDATE articles 
      SET title = $1, content = $2, is_published = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [title, content, is_published, id]);

    // Создаем внутреннее уведомление для автора
    await createArticleEditedNotification(article.author_id, title, is_published);

    res.json({ 
      success: true, 
      message: 'Статья успешно обновлена',
      article: {
        id: parseInt(id),
        title,
        content,
        is_published,
        author_name: article.author_name
      }
    });

  } catch (error) {
    console.error('Ошибка обновления статьи:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Удалить статью
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Получаем информацию о статье и авторе
    const articleResult = await query(`
      SELECT a.*, u.name as author_name, u.email as author_email
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Статья не найдена' });
    }

    const article = articleResult.rows[0];

    // Удаляем статью
    await query('DELETE FROM articles WHERE id = $1', [id]);

    // Создаем внутреннее уведомление для автора
    await createArticleDeletedNotification(article.author_id, article.title);

    res.json({ 
      success: true, 
      message: 'Статья успешно удалена',
      deleted_article: {
        id: parseInt(id),
        title: article.title,
        author_name: article.author_name
      }
    });

  } catch (error) {
    console.error('Ошибка удаления статьи:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить детали статьи
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        a.*,
        u.name as author_name,
        u.email as author_email
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Статья не найдена' });
    }

    res.json({ success: true, article: result.rows[0] });
  } catch (error) {
    console.error('Ошибка получения статьи:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

export default router;
