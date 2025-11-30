import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Middleware для проверки прав администратора
const requireAdmin = async (
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const result = await query('SELECT user_type FROM users WHERE id = $1', [req.userId]);
    
    if (result.rows.length === 0 || result.rows[0].user_type !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }
    
    next();
  } catch (error) {
    console.error('Ошибка проверки прав админа:', error);
    return res.status(500).json({ error: 'Ошибка проверки прав доступа' });
  }
};

// Получить список закрепленных статей
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        a.id,
        a.title,
        a.content,
        a.cover_image,
        a.is_pinned,
        a.pin_order,
        a.pinned_at,
        a.views,
        a.likes_count,
        a.created_at,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar,
        admin_user.name as pinned_by_name
       FROM articles a
       JOIN users u ON a.author_id = u.id
       LEFT JOIN users admin_user ON a.pinned_by = admin_user.id
       WHERE a.is_pinned = true 
         AND a.is_published = true
         AND (a.archived = false OR a.archived IS NULL)
       ORDER BY a.pin_order ASC
       LIMIT 3`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения закрепленных статей:', error);
    res.status(500).json({ error: 'Ошибка получения закрепленных статей' });
  }
});

// Закрепить статью (только для администраторов)
router.post('/:articleId/pin', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { articleId } = req.params;
    const { pinOrder } = req.body; // Опционально, порядок закрепления (1-3)

    console.log(`📌 Закрепление статьи ${articleId} администратором ${req.userId}`);

    // Проверяем существование статьи
    const articleCheck = await query(
      'SELECT id, title, is_pinned FROM articles WHERE id = $1',
      [articleId]
    );

    if (articleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    const article = articleCheck.rows[0];

    if (article.is_pinned) {
      return res.status(400).json({ error: 'Статья уже закреплена' });
    }

    // Проверяем количество закрепленных статей
    const pinnedCount = await query(
      'SELECT COUNT(*) as count FROM articles WHERE is_pinned = true'
    );

    if (parseInt(pinnedCount.rows[0].count) >= 3) {
      return res.status(400).json({ 
        error: 'Уже закреплено максимальное количество статей (3). Открепите одну из существующих.' 
      });
    }

    // Определяем порядок закрепления
    let finalPinOrder = pinOrder;
    if (!finalPinOrder || finalPinOrder < 1 || finalPinOrder > 3) {
      const maxOrder = await query(
        'SELECT COALESCE(MAX(pin_order), 0) as max_order FROM articles WHERE is_pinned = true'
      );
      finalPinOrder = parseInt(maxOrder.rows[0].max_order) + 1;
    }

    // Закрепляем статью
    await query(
      `UPDATE articles
       SET is_pinned = true,
           pin_order = $1,
           pinned_at = CURRENT_TIMESTAMP,
           pinned_by = $2
       WHERE id = $3`,
      [finalPinOrder, req.userId, articleId]
    );

    console.log(`✅ Статья ${articleId} закреплена на позиции ${finalPinOrder}`);

    res.json({
      message: 'Статья успешно закреплена',
      articleId: parseInt(articleId),
      pinOrder: finalPinOrder
    });
  } catch (error) {
    console.error('Ошибка закрепления статьи:', error);
    res.status(500).json({ error: 'Ошибка закрепления статьи' });
  }
});

// Открепить статью (только для администраторов)
router.post('/:articleId/unpin', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { articleId } = req.params;

    console.log(`📌 Открепление статьи ${articleId} администратором ${req.userId}`);

    // Проверяем существование статьи
    const articleCheck = await query(
      'SELECT id, title, is_pinned, pin_order FROM articles WHERE id = $1',
      [articleId]
    );

    if (articleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    const article = articleCheck.rows[0];

    if (!article.is_pinned) {
      return res.status(400).json({ error: 'Статья не закреплена' });
    }

    const oldPinOrder = article.pin_order;

    // Открепляем статью
    await query(
      `UPDATE articles
       SET is_pinned = false,
           pin_order = NULL,
           pinned_at = NULL,
           pinned_by = NULL
       WHERE id = $1`,
      [articleId]
    );

    // Пересчитываем порядок оставшихся закрепленных статей
    if (oldPinOrder) {
      await query(
        `UPDATE articles
         SET pin_order = pin_order - 1
         WHERE is_pinned = true AND pin_order > $1`,
        [oldPinOrder]
      );
    }

    console.log(`✅ Статья ${articleId} откреплена`);

    res.json({
      message: 'Статья успешно откреплена',
      articleId: parseInt(articleId)
    });
  } catch (error) {
    console.error('Ошибка открепления статьи:', error);
    res.status(500).json({ error: 'Ошибка открепления статьи' });
  }
});

// Изменить порядок закрепленной статьи
router.put('/:articleId/reorder', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { articleId } = req.params;
    const { newOrder } = req.body;

    if (!newOrder || newOrder < 1 || newOrder > 3) {
      return res.status(400).json({ error: 'Неверный порядок. Допустимые значения: 1, 2, 3' });
    }

    console.log(`🔄 Изменение порядка статьи ${articleId} на ${newOrder}`);

    // Проверяем существование статьи
    const articleCheck = await query(
      'SELECT id, is_pinned, pin_order FROM articles WHERE id = $1',
      [articleId]
    );

    if (articleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    const article = articleCheck.rows[0];

    if (!article.is_pinned) {
      return res.status(400).json({ error: 'Статья не закреплена' });
    }

    const oldOrder = article.pin_order;

    if (oldOrder === newOrder) {
      return res.json({ message: 'Порядок не изменился', articleId: parseInt(articleId), pinOrder: newOrder });
    }

    // Перемещаем другие статьи
    if (newOrder > oldOrder) {
      // Сдвигаем вниз статьи между старой и новой позицией
      await query(
        `UPDATE articles
         SET pin_order = pin_order - 1
         WHERE is_pinned = true 
           AND pin_order > $1 
           AND pin_order <= $2
           AND id != $3`,
        [oldOrder, newOrder, articleId]
      );
    } else {
      // Сдвигаем вверх статьи между новой и старой позицией
      await query(
        `UPDATE articles
         SET pin_order = pin_order + 1
         WHERE is_pinned = true 
           AND pin_order >= $1 
           AND pin_order < $2
           AND id != $3`,
        [newOrder, oldOrder, articleId]
      );
    }

    // Устанавливаем новый порядок для целевой статьи
    await query(
      'UPDATE articles SET pin_order = $1 WHERE id = $2',
      [newOrder, articleId]
    );

    console.log(`✅ Порядок статьи ${articleId} изменен с ${oldOrder} на ${newOrder}`);

    res.json({
      message: 'Порядок успешно изменен',
      articleId: parseInt(articleId),
      oldOrder,
      newOrder
    });
  } catch (error) {
    console.error('Ошибка изменения порядка статьи:', error);
    res.status(500).json({ error: 'Ошибка изменения порядка статьи' });
  }
});

export default router;

