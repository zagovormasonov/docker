import { query } from '../config/database';
import { Request } from 'express';

interface LogActionParams {
  adminId: number;
  adminName: string;
  actionType: 'approve' | 'reject' | 'delete' | 'update' | 'create' | 'ban' | 'unban';
  entityType: 'article' | 'event' | 'user' | 'comment';
  entityId: number;
  entityTitle?: string;
  details?: any;
  req?: Request;
}

/**
 * Логирует административное действие в базу данных
 */
export async function logAdminAction(params: LogActionParams): Promise<void> {
  try {
    const {
      adminId,
      adminName,
      actionType,
      entityType,
      entityId,
      entityTitle,
      details,
      req
    } = params;

    // Получаем IP-адрес и User-Agent из запроса
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (req) {
      // Получаем реальный IP (учитывая прокси и загрузчики)
      ipAddress = 
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        (req.headers['x-real-ip'] as string) ||
        req.socket.remoteAddress ||
        null;

      userAgent = req.headers['user-agent'] || null;
    }

    // Сохраняем лог в базу данных
    await query(
      `INSERT INTO admin_logs (
        admin_id, 
        admin_name, 
        action_type, 
        entity_type, 
        entity_id, 
        entity_title, 
        details,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        adminId,
        adminName,
        actionType,
        entityType,
        entityId,
        entityTitle || null,
        details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent
      ]
    );

    console.log(`✅ Logged admin action: ${actionType} ${entityType} #${entityId} by ${adminName}`);
  } catch (error) {
    // Не прерываем основное действие из-за ошибки логирования
    console.error('❌ Error logging admin action:', error);
  }
}

/**
 * Получает историю логов с фильтрацией
 */
export async function getAdminLogs(filters?: {
  adminId?: number;
  actionType?: string;
  entityType?: string;
  entityId?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.adminId) {
      conditions.push(`admin_id = $${paramIndex}`);
      values.push(filters.adminId);
      paramIndex++;
    }

    if (filters?.actionType) {
      conditions.push(`action_type = $${paramIndex}`);
      values.push(filters.actionType);
      paramIndex++;
    }

    if (filters?.entityType) {
      conditions.push(`entity_type = $${paramIndex}`);
      values.push(filters.entityType);
      paramIndex++;
    }

    if (filters?.entityId) {
      conditions.push(`entity_id = $${paramIndex}`);
      values.push(filters.entityId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    const result = await query(
      `SELECT 
        id,
        admin_id,
        admin_name,
        action_type,
        entity_type,
        entity_id,
        entity_title,
        details,
        ip_address,
        user_agent,
        created_at
      FROM admin_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    // Получаем общее количество для пагинации
    const countResult = await query(
      `SELECT COUNT(*) as total FROM admin_logs ${whereClause}`,
      values
    );

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    };
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    throw error;
  }
}

