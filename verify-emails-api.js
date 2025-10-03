const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/auth';

async function verifyEmails() {
  const emails = ['trufelleg@gmail.com', 'gr-light369@yandex.ru'];
  
  console.log('🔍 Начинаем верификацию email адресов...');
  
  for (const email of emails) {
    try {
      console.log(`\n📧 Обрабатываем: ${email}`);
      
      const response = await axios.post(`${API_BASE_URL}/verify-email-manual`, {
        email: email
      });
      
      console.log(`✅ ${response.data.message}`);
      console.log(`   Пользователь: ${response.data.user.name} (ID: ${response.data.user.id})`);
      console.log(`   Статус: ${response.data.user.email_verified ? 'Подтвержден' : 'Не подтвержден'}`);
      
    } catch (error) {
      if (error.response) {
        console.error(`❌ Ошибка для ${email}:`, error.response.data.error);
      } else {
        console.error(`❌ Ошибка сети для ${email}:`, error.message);
      }
    }
  }
  
  console.log('\n🎉 Верификация завершена!');
}

// Проверяем, что сервер запущен
async function checkServer() {
  try {
    await axios.get('http://localhost:3001/api/topics');
    console.log('✅ Сервер доступен');
    return true;
  } catch (error) {
    console.error('❌ Сервер недоступен. Убедитесь, что backend запущен на порту 3001');
    return false;
  }
}

async function main() {
  console.log('🚀 Скрипт верификации email адресов');
  
  const serverAvailable = await checkServer();
  if (!serverAvailable) {
    console.log('\n💡 Для запуска сервера выполните:');
    console.log('   cd backend');
    console.log('   npm run dev');
    return;
  }
  
  await verifyEmails();
}

main();

