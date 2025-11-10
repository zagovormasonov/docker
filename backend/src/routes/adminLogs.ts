import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getAdminLogs } from '../utils/adminLogger';
import { query } from '../config/database';

const router = express.Router();

// Middleware для проверки прав администратора
const requireAdmin = async (req: AuthRequest, res: any, next: any) => {
  try {
    const result = await query(
      'SELECT user_type FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0 || result.rows[0].user_type !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    next();
  } catch (error) {
    console.error('Ошибка проверки прав администратора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение логов административных действий
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      adminId,
      actionType,
      entityType,
      entityId,
      limit = 50,
      offset = 0
    } = req.query;

    const filters: any = {};

    if (adminId) filters.adminId = parseInt(adminId as string);
    if (actionType) filters.actionType = actionType as string;
    if (entityType) filters.entityType = entityType as string;
    if (entityId) filters.entityId = parseInt(entityId as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const result = await getAdminLogs(filters);

    res.json(result);
  } catch (error) {
    console.error('Ошибка получения логов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение статистики по логам
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Статистика по типам действий
    const actionStats = await query(`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM admin_logs
      GROUP BY action_type
      ORDER BY count DESC
    `);

    // Статистика по типам сущностей
    const entityStats = await query(`
      SELECT 
        entity_type,
        COUNT(*) as count
      FROM admin_logs
      GROUP BY entity_type
      ORDER BY count DESC
    `);

    // Топ администраторов по активности
    const topAdmins = await query(`
      SELECT 
        admin_id,
        admin_name,
        COUNT(*) as actions_count
      FROM admin_logs
      GROUP BY admin_id, admin_name
      ORDER BY actions_count DESC
      LIMIT 10
    `);

    // Активность за последние 7 дней
    const recentActivity = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as actions_count
      FROM admin_logs
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      actionStats: actionStats.rows,
      entityStats: entityStats.rows,
      topAdmins: topAdmins.rows,
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

