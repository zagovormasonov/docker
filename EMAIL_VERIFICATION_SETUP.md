# 📧 Настройка Email Верификации через EmailJS

## 1. Создание аккаунта и настройка EmailJS

### Шаг 1: Получите ключи в EmailJS Dashboard

1. Войдите в [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Перейдите в **Email Services** → Добавьте свой email сервис (Gmail, Outlook, и т.д.)
3. Перейдите в **Email Templates** → Create New Template
4. Скопируйте **Service ID**, **Template ID** и **Public Key**

### Шаг 2: Создайте Email Template

В EmailJS Dashboard создайте template со следующим содержанием:

**Subject:**
```
Подтвердите ваш email для SoulSynergy
```

**Content (HTML):**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
  <div style="background: white; padding: 30px; border-radius: 8px;">
    <h1 style="color: #6366f1; text-align: center; margin-bottom: 20px;">
      Добро пожаловать в SoulSynergy! 🌟
    </h1>
    
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
      Привет, {{to_name}}!
    </p>
    
    <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
      Спасибо за регистрацию в SoulSynergy. Для завершения регистрации, пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{verification_url}}" 
         style="background: #6366f1; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
        ✓ Подтвердить Email
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      Если вы не регистрировались на SoulSynergy, просто проигнорируйте это письмо.
    </p>
    
    <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
      © 2025 SoulSynergy. Все права защищены.
    </p>
  </div>
</div>
```

**Template Variables (Settings → Template):**
- `{{to_email}}` - Email получателя
- `{{to_name}}` - Имя пользователя
- `{{verification_url}}` - Ссылка подтверждения
- `{{app_name}}` - Название приложения

## 2. Обновите код в RegisterPage.tsx

Откройте `frontend/src/pages/RegisterPage.tsx` и замените:

```typescript
await emailjs.send(
  'YOUR_SERVICE_ID',  // ← Вставьте ваш Service ID
  'YOUR_TEMPLATE_ID', // ← Вставьте ваш Template ID
  {
    to_email: email,
    to_name: name,
    verification_url: verificationUrl,
    app_name: 'SoulSynergy'
  },
  'YOUR_PUBLIC_KEY' // ← Вставьте ваш Public Key
);
```

## 3. Деплой

```bash
# Backend
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build backend

# Frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

## 4. Тестирование

1. Зарегистрируйте новый аккаунт
2. Проверьте email (может попасть в спам)
3. Кликните на ссылку подтверждения
4. Вы автоматически войдете в систему

## 🔒 Безопасность

- Токены верификации хранятся в БД и удаляются после подтверждения
- Неподтвержденные аккаунты не могут войти
- Ссылки одноразовые

## 📝 Примечания

- EmailJS бесплатно для 200 emails/месяц
- Для продакшена рекомендуется свой SMTP или SendGrid
- Можно добавить expiry для токенов (срок действия)

