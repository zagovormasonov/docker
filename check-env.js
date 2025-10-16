require('dotenv').config();

console.log('🔍 Проверка переменных окружения:');
console.log('');

console.log('📊 База данных:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Настроена' : '❌ Не настроена');

console.log('');
console.log('💳 Юкасса:');
console.log('YOOKASSA_SHOP_ID:', process.env.YOOKASSA_SHOP_ID ? '✅ Настроен' : '❌ Не настроен');
console.log('YOOKASSA_SECRET_KEY:', process.env.YOOKASSA_SECRET_KEY ? '✅ Настроен' : '❌ Не настроен');

console.log('');
console.log('🌐 Frontend:');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Не настроен');

console.log('');
console.log('🔑 JWT:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Настроен' : '❌ Не настроен');

console.log('');
if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
  console.log('⚠️  Для работы платежей необходимо настроить:');
  console.log('   YOOKASSA_SHOP_ID=ваш_shop_id');
  console.log('   YOOKASSA_SECRET_KEY=ваш_secret_key');
}
