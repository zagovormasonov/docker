import express from 'express';
import { query } from '../config/database';
import { EVENT_TYPES } from './events';

const router = express.Router();

// Секретный токен для проверки запросов от n8n
// В реальном проекте лучше хранить в .env как WEBHOOK_SECRET
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'n8n_secret_token_2024';

/**
 * Вебхук для получения событий из n8n
 * URL: POST /api/webhooks/n8n/events
 */
router.post('/n8n/events', async (req, res) => {
    try {
        const authHeader = req.headers['x-webhook-secret'];

        // Проверка секрета
        if (authHeader !== WEBHOOK_SECRET) {
            console.warn('⚠️ Попытка несанкционированного доступа к вебхуку n8n');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            title,
            description,
            eventType,
            eventDate,
            isOnline,
            cityName,
            location,
            price,
            registrationLink,
            coverImage
        } = req.body;

        // Базовая валидация
        if (!title || !eventType || !eventDate) {
            return res.status(400).json({ error: 'Missing required fields: title, eventType, eventDate' });
        }

        // Проверка типа события
        if (!EVENT_TYPES.includes(eventType)) {
            return res.status(400).json({ error: `Invalid eventType. Allowed: ${EVENT_TYPES.join(', ')}` });
        }

        console.log(`📥 Получено событие от n8n: ${title}`);

        // Поиск city_id по имени города, если передано
        let cityId = null;
        if (cityName) {
            const cityResult = await query('SELECT id FROM cities WHERE name = $1', [cityName]);
            if (cityResult.rows.length > 0) {
                cityId = cityResult.rows[0].id;
            }
        }

        // Находим администратора для уведомления (тот же, что в events.ts)
        const adminEmail = 'samyrize77777@gmail.com';
        const adminResult = await query(
            'SELECT id FROM users WHERE user_type = $1 AND email = $2',
            ['admin', adminEmail]
        );
        const adminId = adminResult.rows.length > 0 ? adminResult.rows[0].id : null;

        // Вставляем событие как ожидающее модерации
        const result = await query(
            `INSERT INTO events (
        title, description, cover_image, event_type, is_online, city_id,
        event_date, location, price, registration_link, organizer_id,
        is_published, moderation_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
            [
                title,
                description || '',
                coverImage || null,
                eventType,
                isOnline === true || isOnline === 'true',
                cityId,
                eventDate,
                location || '',
                price || '',
                registrationLink || '',
                adminId, // organizer_id
                false, // is_published
                'pending' // moderation_status
            ]
        );

        const newEvent = result.rows[0];

        // Отправляем уведомление администратору в чат (если нашли админа)
        if (adminId) {
            try {
                // Ищем системного пользователя или используем ID админа для отправки себе (или создаем чат)
                // В этом проекте используется логика создания чата
                // Для простоты просто добавляем сообщение в "уведомления" если есть таблица

                await query(
                    `INSERT INTO notifications (user_id, type, title, message, created_at) 
           VALUES ($1, 'event_pending', 'Новое событие на модерации', $2, CURRENT_TIMESTAMP)`,
                    [adminId, `Получено новое событие через n8n: "${title}". Проверьте админку для модерации.`]
                );

                console.log(`🔔 Уведомление администратору (ID: ${adminId}) отправлено`);
            } catch (notifyError) {
                console.error('⚠️ Ошибка при отправке уведомления админу:', notifyError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Event received and sent to moderation',
            eventId: newEvent.id
        });

    } catch (error) {
        console.error('❌ Ошибка вебхука n8n (events):', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

/**
 * Вебхук для получения статей из n8n
 * URL: POST /api/webhooks/n8n/article
 */
router.post('/n8n/article', async (req, res) => {
    try {
        const authHeader = req.headers['x-webhook-secret'];

        // Проверка секрета
        if (authHeader !== WEBHOOK_SECRET) {
            console.warn('⚠️ Попытка несанкционированного доступа к вебхуку статей n8n');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            title,
            description, // Это будет контентом статьи
            coverImage
        } = req.body;

        // Базовая валидация
        if (!title || !description) {
            return res.status(400).json({ error: 'Missing required fields: title, description' });
        }

        console.log(`📥 Получена статья от n8n: ${title}`);

        // Находим администратора для привязки статьи
        const adminEmail = 'samyrize77777@gmail.com';
        const adminResult = await query(
            'SELECT id FROM users WHERE user_type = $1 AND email = $2',
            ['admin', adminEmail]
        );
        const adminId = adminResult.rows.length > 0 ? adminResult.rows[0].id : null;

        if (!adminId) {
            console.error('❌ Администратор для вебхука не найден');
            return res.status(500).json({ error: 'Admin user not found' });
        }

        // Вставляем статью как ожидающую модерации
        const result = await query(
            `INSERT INTO articles (
                author_id, title, content, cover_image, 
                is_published, moderation_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                adminId,
                title,
                description, // Используем description как контент
                coverImage || null,
                false, // is_published
                'pending' // moderation_status
            ]
        );

        const newArticle = result.rows[0];

        // Отправляем уведомление администратору
        try {
            await query(
                `INSERT INTO notifications (user_id, type, title, message, created_at) 
                 VALUES ($1, 'article_pending', 'Новая статья на модерации', $2, CURRENT_TIMESTAMP)`,
                [adminId, `Получена новая статья через n8n: "${title}". Проверьте админку для модерации.`]
            );

            // Также пытаемся отправить в чат, как в основном роуте статей
            try {
                // Ищем чат админа с самим собой или системный
                // На самом деле лучше просто уведомление, но для консистентности проверим чаты
                let chatResult = await query(
                    'SELECT id FROM chats WHERE (user1_id = $1 AND user2_id = $1)',
                    [adminId]
                );

                if (chatResult.rows.length > 0) {
                    const chatId = chatResult.rows[0].id;
                    await query(
                        `INSERT INTO messages (chat_id, sender_id, content, is_read) 
                         VALUES ($1, $2, $3, false)`,
                        [chatId, adminId, `🤖 n8n прислал статью на модерацию:\n\n📌 Название: ${title}\n\n🔗 ID статьи: ${newArticle.id}`]
                    );
                }
            } catch (chatErr) {
                console.warn('⚠️ Не удалось отправить уведомление в чат:', chatErr.message);
            }

            console.log(`🔔 Уведомление администратору (ID: ${adminId}) отправлено`);
        } catch (notifyError) {
            console.error('⚠️ Ошибка при отправке уведомлении админу:', notifyError);
        }

        res.status(201).json({
            success: true,
            message: 'Article received and sent to moderation',
            articleId: newArticle.id
        });

    } catch (error) {
        console.error('❌ Ошибка вебхука n8n (articles):', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

export default router; 
