import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { logAdminAction } from '../utils/adminLogger';

const router = express.Router();

// Проверка прав администратора
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: 'Доступно только для администраторов' });
  }
  next();
};

// Получить всех пользователей
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Запрос пользователей для админа');
    
    // Проверяем, существует ли таблица users
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    console.log('📊 Таблица users существует:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ success: true, users: [] });
    }
    
    // Получаем всех пользователей
    const result = await query(`
      SELECT 
        id,
        name,
        email,
        user_type as "userType",
        created_at,
        updated_at
      FROM users
      ORDER BY id DESC
    `);
    
    console.log('✅ Пользователи загружены:', result.rows.length);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('❌ Ошибка получения пользователей:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера', error: error.message });
  }
});

// Изменить статус эксперта пользователя
router.put('/:id/expert-status', authenticateToken, requireAdmin, [
  body('userType').isIn(['client', 'expert']).withMessage('Тип пользователя должен быть client или expert')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { userType } = req.body;

    // Проверяем, существует ли пользователь
    const userResult = await query(`
      SELECT id, name, email, user_type
      FROM users
      WHERE id = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];

    // Обновляем тип пользователя
    await query(`
      UPDATE users 
      SET user_type = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [userType, id]);

    console.log(`✅ Пользователь ${user.name} (ID: ${id}) изменен на тип: ${userType}`);

    res.json({ 
      success: true, 
      message: `Пользователь ${userType === 'expert' ? 'назначен' : 'лишен'} статуса эксперта`,
      user: {
        id: parseInt(id),
        name: user.name,
        email: user.email,
        userType: userType
      }
    });

  } catch (error) {
    console.error('❌ Ошибка изменения статуса пользователя:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить детали пользователя
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        id,
        name,
        email,
        user_type as "userType",
        created_at,
        updated_at
      FROM users
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('❌ Ошибка получения пользователя:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Назначить/снять права администратора
router.put('/:id/admin-rights', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { grantAdmin } = req.body; // true - дать права, false - забрать

    // Получаем информацию о целевом пользователе и текущем админе
    const userInfo = await query(`
      SELECT u.id, u.name, u.email, u.user_type, admin.name as admin_name
      FROM users u
      CROSS JOIN users admin
      WHERE u.id = $1 AND admin.id = $2
    `, [id, req.userId]);

    if (userInfo.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    const user = userInfo.rows[0];
    const adminName = user.admin_name || 'Администратор';

    // Запрещаем изменять права самому себе
    if (parseInt(id) === req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Вы не можете изменить свои собственные права администратора' 
      });
    }

    // Определяем новый тип пользователя
    const newUserType = grantAdmin ? 'admin' : (user.user_type === 'admin' ? 'expert' : user.user_type);

    // Обновляем тип пользователя
    await query(`
      UPDATE users 
      SET user_type = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newUserType, id]);

    // Логируем действие
    await logAdminAction({
      adminId: req.userId!,
      adminName: adminName,
      actionType: grantAdmin ? 'update' : 'update',
      entityType: 'user',
      entityId: parseInt(id),
      entityTitle: user.name,
      details: { 
        action: grantAdmin ? 'grant_admin' : 'revoke_admin',
        old_type: user.user_type,
        new_type: newUserType,
        email: user.email
      },
      req: req
    });

    console.log(`✅ Пользователь ${user.name} (ID: ${id}): права администратора ${grantAdmin ? 'выданы' : 'отозваны'}`);

    res.json({ 
      success: true, 
      message: grantAdmin 
        ? `Пользователь ${user.name} назначен администратором` 
        : `У пользователя ${user.name} отозваны права администратора`,
      user: {
        id: parseInt(id),
        name: user.name,
        email: user.email,
        userType: newUserType
      }
    });

  } catch (error) {
    console.error('❌ Ошибка изменения прав администратора:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера', details: error.message });
  }
});

export default router;
