# 📧 EmailJS Template для восстановления пароля

## Создайте новый Template в EmailJS Dashboard

### Template Settings:

**To Email:**
```
{{to_email}}
```

**From Name:**
```
SoulSynergy
```

**From Email:**
- ✅ Use Default Email Address

**Subject:**
```
Восстановление пароля для SoulSynergy
```

### Content (HTML):

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
  <div style="background: white; padding: 30px; border-radius: 8px;">
    <h1 style="color: #6366f1; text-align: center; margin-bottom: 20px;">
      🔐 Восстановление пароля
    </h1>
    
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
      Привет, {{to_name}}!
    </p>
    
    <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
      Мы получили запрос на восстановление пароля для вашего аккаунта в SoulSynergy. Для установки нового пароля нажмите на кнопку ниже:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_url}}" 
         style="background: #6366f1; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
        🔑 Восстановить пароль
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Ссылка действительна в течение <strong>1 часа</strong>.
    </p>
    
    <p style="font-size: 14px; color: #666; padding-top: 20px; border-top: 1px solid #eee;">
      Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо. Ваш пароль останется без изменений.
    </p>
    
    <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
      © 2025 SoulSynergy. Все права защищены.
    </p>
  </div>
</div>
```

### Template Variables:

- `{{to_email}}` - Email получателя
- `{{to_name}}` - Имя пользователя
- `{{reset_url}}` - Ссылка для восстановления пароля
- `{{app_name}}` - Название приложения

## Обновите код:

Откройте `frontend/src/pages/ForgotPasswordPage.tsx` и замените:

```typescript
await emailjs.send(
  'YOUR_SERVICE_ID',        // ← Тот же Service ID
  'YOUR_RESET_TEMPLATE_ID', // ← ID нового template для сброса пароля
  {
    to_email: email,
    to_name: name,
    reset_url: resetUrl,
    app_name: 'SoulSynergy'
  },
  'YOUR_PUBLIC_KEY'         // ← Тот же Public Key
);
```

## Процесс восстановления:

1. Пользователь кликает "Забыли пароль?" → вводит email
2. EmailJS отправляет письмо со ссылкой (действительна 1 час)
3. Пользователь кликает на ссылку → вводит новый пароль
4. Автоматический вход в систему

## Безопасность:

- ✅ Токены одноразовые
- ✅ Срок действия 1 час
- ✅ Автоматическая очистка токена после использования
- ✅ Не раскрываем существование/отсутствие email

