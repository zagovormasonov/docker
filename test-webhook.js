#!/usr/bin/env node

/**
 * Скрипт для тестирования webhook Юкассы
 * Использование: node test-webhook.js
 */

const https = require('https');
const http = require('http');

// Конфигурация
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://soulsynergy.ru/api/payments/webhook';
const TEST_PAYMENT_ID = 'test_payment_' + Date.now();

// Тестовые данные webhook
const testWebhookData = {
  event: 'payment.succeeded',
  object: {
    id: TEST_PAYMENT_ID,
    status: 'succeeded',
    metadata: {
      payment_id: '123',
      user_id: '1',
      plan_id: 'yearly'
    }
  }
};

console.log('🧪 Тестирование webhook Юкассы...');
console.log('URL:', WEBHOOK_URL);
console.log('Данные:', JSON.stringify(testWebhookData, null, 2));

// Функция для отправки POST запроса
function sendWebhook(data) {
  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'YooKassa-Webhook-Test/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Основная функция тестирования
async function testWebhook() {
  try {
    console.log('\n📤 Отправка тестового webhook...');
    
    const response = await sendWebhook(testWebhookData);
    
    console.log('\n📥 Ответ сервера:');
    console.log('Статус:', response.statusCode);
    console.log('Заголовки:', response.headers);
    console.log('Тело ответа:', response.body);
    
    if (response.statusCode === 200) {
      console.log('\n✅ Webhook успешно обработан!');
    } else {
      console.log('\n❌ Ошибка обработки webhook');
    }
    
  } catch (error) {
    console.error('\n💥 Ошибка отправки webhook:', error.message);
  }
}

// Запуск тестирования
if (require.main === module) {
  testWebhook();
}

module.exports = { testWebhook, sendWebhook };
