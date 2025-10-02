# Шаблон EmailJS для модерации событий

## HTML шаблон для письма модерации

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Модерация события</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 3px;">
                    <tr>
                        <td style="background: white; border-radius: 14px; padding: 40px;">
                            
                            <!-- Заголовок -->
                            <h1 style="color: #6366f1; text-align: center; margin: 0 0 30px 0; font-size: 28px; font-weight: 700;">
                                🎉 Новое событие требует модерации
                            </h1>
                            
                            <!-- Информация о событии -->
                            <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 20px 0;">
                                <h2 style="color: #333; margin: 0 0 16px 0; font-size: 20px;">{{event_title}}</h2>
                                
                                <div style="margin: 12px 0;">
                                    <strong style="color: #6366f1;">📅 Дата:</strong> {{event_date}}
                                </div>
                                
                                <div style="margin: 12px 0;">
                                    <strong style="color: #6366f1;">📍 Место:</strong> {{event_location}}
                                </div>
                                
                                <div style="margin: 12px 0;">
                                    <strong style="color: #6366f1;">👤 Организатор:</strong> {{organizer_name}}
                                </div>
                                
                                <div style="margin: 12px 0;">
                                    <strong style="color: #6366f1;">💰 Цена:</strong> {{event_price}}
                                </div>
                                
                                <div style="margin: 12px 0;">
                                    <strong style="color: #6366f1;">📝 Описание:</strong>
                                    <div style="margin-top: 8px; color: #666; line-height: 1.6;">
                                        {{event_description}}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Кнопки действий -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center" style="padding: 10px;">
                                        <a href="{{approve_url}}" 
                                           style="background: #52c41a; 
                                                  color: white; 
                                                  padding: 16px 32px; 
                                                  text-decoration: none; 
                                                  border-radius: 8px; 
                                                  font-size: 16px; 
                                                  font-weight: 600; 
                                                  display: inline-block;
                                                  margin-right: 16px;">
                                            ✅ Одобрить событие
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 10px;">
                                        <a href="{{reject_url}}" 
                                           style="background: #ff4d4f; 
                                                  color: white; 
                                                  padding: 16px 32px; 
                                                  text-decoration: none; 
                                                  border-radius: 8px; 
                                                  font-size: 16px; 
                                                  font-weight: 600; 
                                                  display: inline-block;">
                                            ❌ Отклонить событие
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Информация о модерации -->
                            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
                                <p style="margin: 0; font-size: 14px; color: #856404;">
                                    <strong>ℹ️ Информация:</strong> При одобрении событие будет автоматически опубликовано. При отклонении организатор получит уведомление.
                                </p>
                            </div>
                            
                            <!-- Футер -->
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                                <p style="font-size: 12px; color: #999; margin: 0;">
                                    © 2025 SoulSynergy. Система модерации событий.
                                </p>
                            </div>
                            
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

## Настройка EmailJS

### 1. Создайте новый шаблон в EmailJS

1. Зайдите в [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Перейдите в раздел "Email Templates"
3. Нажмите "Create New Template"
4. Вставьте HTML код выше
5. Настройте переменные:

### 2. Переменные шаблона

| Переменная | Описание | Пример |
|------------|----------|---------|
| `{{event_title}}` | Название события | "Йога-ретрит в горах" |
| `{{event_date}}` | Дата события | "15 марта 2025, 10:00" |
| `{{event_location}}` | Место проведения | "Москва, Парк Сокольники" |
| `{{organizer_name}}` | Имя организатора | "Анна Петрова" |
| `{{event_price}}` | Цена | "3000 ₽" |
| `{{event_description}}` | Описание события | "Погружение в практики йоги..." |
| `{{approve_url}}` | Ссылка для одобрения | "https://soulsynergy.ru/api/events/approve/123" |
| `{{reject_url}}` | Ссылка для отклонения | "https://soulsynergy.ru/api/events/reject/123" |

### 3. Настройки письма

- **To Email:** `aum369ra@gmail.com`
- **From Name:** `SoulSynergy Moderation`
- **Subject:** `🎉 Новое событие требует модерации: {{event_title}}`

### 4. Обновите .env файл

Добавьте в `.env` файл на сервере:

```env
# EmailJS для модерации событий
VITE_EMAILJS_MODERATION_TEMPLATE_ID=your_template_id_here
```

### 5. Тестирование

После настройки шаблона, система будет автоматически отправлять письма модерации при создании новых событий.
