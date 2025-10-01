# 📧 Настройка EmailJS

## 1. Создайте аккаунт EmailJS
Перейдите на https://www.emailjs.com/ и зарегистрируйтесь

## 2. Получите учетные данные

### Service ID
1. Откройте https://dashboard.emailjs.com/admin
2. Нажмите "Add New Service"
3. Выберите email провайдера (Gmail, Outlook и т.д.)
4. Скопируйте **Service ID** (например: `service_hd63lfg`)

### Public Key
1. Откройте https://dashboard.emailjs.com/admin/account
2. Найдите раздел "API Keys"
3. Скопируйте **Public Key** (например: `ONZ5G0uZYkJdC-ryS`)

### Template ID для верификации email
1. Откройте https://dashboard.emailjs.com/admin/templates
2. Нажмите "Create New Template"
3. Используйте шаблон из `EMAIL_VERIFICATION_SETUP.md`
4. Скопируйте **Template ID** (например: `template_x4iwchr`)

### Template ID для восстановления пароля
1. Создайте еще один Template
2. Используйте шаблон из `PASSWORD_RESET_TEMPLATE.md`
3. Скопируйте **Template ID**

## 3. Настройка на сервере

Создайте файл `.env.production` на сервере в директории `~/docker/`:

```bash
cd ~/docker
nano .env.production
```

Вставьте:
```env
VITE_EMAILJS_SERVICE_ID=service_hd63lfg
VITE_EMAILJS_PUBLIC_KEY=ONZ5G0uZYkJdC-ryS
VITE_EMAILJS_VERIFICATION_TEMPLATE_ID=template_x4iwchr
VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID=template_xxxxxxx

PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin123
```

Сохраните (Ctrl+O, Enter, Ctrl+X)

## 4. Запуск с переменными окружения

```bash
cd ~/docker

# Загрузить переменные и запустить
export $(cat .env.production | xargs) && docker-compose -f docker-compose.prod.yml up -d --build
```

## 5. Проверка

После деплоя проверьте:
1. Зарегистрируйте тестовый аккаунт
2. Проверьте email - должно прийти письмо с подтверждением
3. Попробуйте восстановление пароля

## 🔒 Безопасность

- ❌ **НЕ** коммитьте `.env.production` в Git!
- ✅ Держите файл только на сервере
- ✅ Используйте `.gitignore` для исключения `.env*` файлов

