# Настройка URL возврата в Юкассе

## Проблема
После успешной оплаты пользователь не авторизуется автоматически и возвращается на страницу входа.

## Решение

### 1. Настройка URL возврата в Юкассе

В личном кабинете Юкассы настройте:

**URL возврата после успешной оплаты:**
```
https://your-domain.com/payment-success?payment_id={payment_id}
```

**URL возврата при отмене:**
```
https://your-domain.com/become-expert?error=cancelled
```

### 2. Переменные окружения

Убедитесь, что в `.env` файле правильно указан URL фронтенда:

```env
FRONTEND_URL=https://your-domain.com
# или для разработки:
FRONTEND_URL=http://localhost:3000
```

### 3. Webhook настройки

В Юкассе настройте webhook:
- **URL:** `https://your-domain.com/api/payments/webhook`
- **События:** `payment.succeeded`

### 4. Проверка работы

1. Пользователь регистрируется как эксперт
2. Переходит на страницу оплаты
3. Оплачивает через Юкассу
4. Юкасса перенаправляет на `/payment-success?payment_id=123`
5. Webhook обновляет статус пользователя на "эксперт"
6. Пользователь видит страницу успешной оплаты
7. Может перейти в профиль с правами эксперта

### 5. Отладка

Если проблемы продолжаются, проверьте:

1. **Логи webhook:**
   ```bash
   # В логах сервера должны быть записи:
   # "Пользователь X стал экспертом после успешной оплаты Y"
   ```

2. **Статус платежа в БД:**
   ```sql
   SELECT * FROM payments WHERE yookassa_payment_id = 'payment_id_from_yookassa';
   ```

3. **Статус пользователя:**
   ```sql
   SELECT user_type FROM users WHERE id = user_id_from_payment;
   ```

### 6. Тестирование

Используйте тестовые карты Юкассы:
- **Успешная оплата:** 5555 5555 5555 4444
- **CVV:** 123
- **Срок:** любая будущая дата

### 7. Альтернативное решение

Если webhook не работает, можно добавить проверку статуса платежа на фронтенде:

```javascript
// В PaymentSuccessPage.tsx
useEffect(() => {
  const checkPaymentStatus = async () => {
    const paymentId = searchParams.get('payment_id');
    if (paymentId) {
      // Проверяем статус платежа каждые 2 секунды
      const interval = setInterval(async () => {
        const response = await fetch(`/api/payments/status/${paymentId}`);
        const data = await response.json();
        
        if (data.status === 'succeeded') {
          clearInterval(interval);
          // Обновляем статус пользователя
          updateUser({ ...user, userType: 'expert' });
        }
      }, 2000);
      
      // Останавливаем проверку через 30 секунд
      setTimeout(() => clearInterval(interval), 30000);
    }
  };
  
  checkPaymentStatus();
}, []);
```
