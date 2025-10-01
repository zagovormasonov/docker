# 📧 EmailJS Template для восстановления пароля SoulSynergy

## 🎯 Пошаговая инструкция

### Шаг 1: Создайте новый Template

1. Откройте https://dashboard.emailjs.com/admin/templates
2. Нажмите **"Create New Template"**
3. Выберите любой базовый шаблон (мы его полностью заменим)

---

### Шаг 2: Настройте Template Settings

#### **Template Name:**
```
SoulSynergy - Password Reset
```

#### **To Email:**
```
{{to_email}}
```

#### **From Name:**
```
SoulSynergy
```

#### **From Email:**
- ✅ Используйте Default Email Address из вашего Service

#### **Subject:**
```
🔐 Восстановление пароля для SoulSynergy
```

---

### Шаг 3: HTML Content

Удалите весь текст в редакторе и вставьте этот HTML код:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                🔐 Восстановление пароля
              </h1>
              
              <!-- Приветствие -->
              <p style="font-size: 18px; color: #333; margin: 0 0 20px 0; line-height: 1.6;">
                Привет, <strong>{{to_name}}</strong>!
              </p>
              
              <!-- Основной текст -->
              <p style="font-size: 16px; color: #555; margin: 0 0 30px 0; line-height: 1.6;">
                Мы получили запрос на восстановление пароля для вашего аккаунта в <strong>SoulSynergy</strong>. 
                Чтобы установить новый пароль, нажмите на кнопку ниже:
              </p>
              
              <!-- Кнопка -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{reset_url}}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 16px 48px; 
                              text-decoration: none; 
                              border-radius: 10px; 
                              font-size: 18px; 
                              font-weight: 600; 
                              display: inline-block;
                              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                      🔑 Восстановить пароль
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Информация о времени -->
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⏰ <strong>Важно:</strong> Ссылка действительна в течение <strong>1 часа</strong>.
                </p>
              </div>
              
              <!-- Альтернативная ссылка -->
              <p style="font-size: 13px; color: #999; margin: 20px 0; line-height: 1.6;">
                Если кнопка не работает, скопируйте эту ссылку в браузер:<br>
                <a href="{{reset_url}}" style="color: #6366f1; word-break: break-all;">{{reset_url}}</a>
              </p>
              
              <!-- Предупреждение безопасности -->
              <div style="border-top: 2px solid #f0f0f0; margin-top: 30px; padding-top: 20px;">
                <p style="font-size: 14px; color: #666; margin: 0 0 10px 0; line-height: 1.6;">
                  <strong>🛡️ Безопасность:</strong>
                </p>
                <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.6;">
                  Если вы <strong>не запрашивали</strong> восстановление пароля, просто проигнорируйте это письмо. 
                  Ваш пароль останется без изменений.
                </p>
              </div>
              
              <!-- Футер -->
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="font-size: 12px; color: #999; margin: 0;">
                  © 2025 SoulSynergy. Все права защищены.
                </p>
                <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">
                  Это автоматическое письмо, пожалуйста, не отвечайте на него.
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

---

### Шаг 4: Настройте переменные (Variables)

В разделе **Template Variables** убедитесь что есть:

| Переменная | Описание | Пример |
|------------|----------|--------|
| `{{to_email}}` | Email получателя | user@example.com |
| `{{to_name}}` | Имя пользователя | Иван |
| `{{reset_url}}` | Ссылка для восстановления | https://soulsynergy.ru/reset-password?token=... |

---

### Шаг 5: Тестирование

1. Нажмите **"Test It"** в EmailJS
2. Заполните тестовые данные:
   - `to_email`: ваш email
   - `to_name`: Тест
   - `reset_url`: https://soulsynergy.ru/reset-password?token=test123
3. Нажмите **"Send Test Email"**
4. Проверьте почту - должно прийти красивое письмо

---

### Шаг 6: Сохраните Template ID

После сохранения скопируйте **Template ID** (например: `template_abc123xyz`)

Этот ID нужно добавить в `.env.production` на сервере:

```env
VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID=template_abc123xyz
```

---

## 🔄 Как это работает:

1. **Пользователь забыл пароль:**
   - Заходит на страницу входа
   - Кликает "Забыли пароль?"
   - Вводит email

2. **Система генерирует токен:**
   - Backend создает уникальный токен восстановления
   - Токен сохраняется в БД со сроком действия 1 час

3. **EmailJS отправляет письмо:**
   - Пользователю приходит красивое письмо
   - В письме кнопка со ссылкой + токен

4. **Пользователь восстанавливает пароль:**
   - Кликает на ссылку в письме
   - Попадает на страницу смены пароля
   - Вводит новый пароль
   - Автоматически входит в систему

---

## 🛡️ Безопасность:

- ✅ **Токены одноразовые** - используются только один раз
- ✅ **Срок действия 1 час** - после истечения токен не работает
- ✅ **Автоматическая очистка** - токен удаляется после использования
- ✅ **Конфиденциальность** - не раскрываем существование email
- ✅ **HTTPS** - все данные передаются по защищенному соединению

---

## 📝 Полная настройка на сервере:

После создания template обновите `.env.production` на сервере:

```bash
cd ~/docker
nano .env.production
```

Добавьте новый Template ID:
```env
VITE_EMAILJS_SERVICE_ID=service_hd63lfg
VITE_EMAILJS_PUBLIC_KEY=ONZ5G0uZYkJdC-ryS
VITE_EMAILJS_VERIFICATION_TEMPLATE_ID=template_x4iwchr
VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID=template_abc123xyz  # ← Ваш новый Template ID
```

Сохраните и перезапустите:
```bash
export $(cat .env.production | xargs) && docker-compose -f docker-compose.prod.yml up -d --build
```

---

## ✅ Готово!

Теперь пользователи могут восстанавливать пароль через email! 🎉

