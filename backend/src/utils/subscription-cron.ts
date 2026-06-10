import cron from 'node-cron';
import { dailySubscriptionCheck } from '../routes/subscription-checker';

/**
 * Настройка cron job для ежедневной проверки подписок
 * 
 * Расписание: каждый день в 03:00 по серверному времени
 * (когда нагрузка на сервер минимальна)
 */

let cronJob: cron.ScheduledTask | null = null;

export function startSubscriptionCron(): void {
  console.log('Expert subscription payments are disabled; subscription cron is not started.');
  return;

  // Проверяем, не запущен ли уже cron
  if (cronJob) {
    console.log('⚠️ Cron job для проверки подписок уже запущен');
    return;
  }

  console.log('');
  console.log('⏰ ==========================================');
  console.log('⏰ ЗАПУСК CRON JOB ДЛЯ ПРОВЕРКИ ПОДПИСОК');
  console.log('⏰ Расписание: каждый день в 03:00');
  console.log('⏰ ==========================================');
  console.log('');

  // Запускаем cron job: каждый день в 03:00
  // Формат: секунда минута час день месяц день_недели
  // 0 0 3 * * * = в 03:00:00 каждый день
  cronJob = cron.schedule('0 0 3 * * *', async () => {
    try {
      await dailySubscriptionCheck();
    } catch (error) {
      console.error('❌ Критическая ошибка в cron job проверки подписок:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Moscow" // Укажите ваш часовой пояс
  });

  console.log('✅ Cron job для проверки подписок запущен успешно');
  console.log('📅 Следующий запуск: завтра в 03:00');
  console.log('');

  // Опционально: запускаем проверку сразу при старте (для тестирования)
  // Раскомментируйте следующие строки, если хотите проверить сразу:
  /*
  console.log('🔄 Запуск первой проверки при старте сервера...');
  dailySubscriptionCheck().catch(error => {
    console.error('❌ Ошибка первой проверки:', error);
  });
  */
}

export function stopSubscriptionCron(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('⏰ Cron job для проверки подписок остановлен');
  }
}

// Для тестирования: можно запустить проверку вручную
export async function runSubscriptionCheckNow(): Promise<void> {
  console.log('🔄 Ручной запуск проверки подписок...');
  try {
    await dailySubscriptionCheck();
    console.log('✅ Ручная проверка завершена');
  } catch (error) {
    console.error('❌ Ошибка ручной проверки:', error);
    throw error;
  }
}

