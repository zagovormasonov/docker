import { query } from '../config/database';

export interface NotificationData {
  userId: number;
  type: 'article_edited' | 'article_deleted' | 'event_edited' | 'event_deleted';
  title: string;
  message: string;
}

export const createNotification = async (data: NotificationData): Promise<void> => {
  try {
    await query(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES ($1, $2, $3, $4)
    `, [data.userId, data.type, data.title, data.message]);
    
    console.log(`✅ Уведомление создано для пользователя ${data.userId}: ${data.title}`);
  } catch (error) {
    console.error('❌ Ошибка создания уведомления:', error);
    throw error;
  }
};

export const createArticleEditedNotification = async (
  authorId: number, 
  articleTitle: string, 
  isPublished: boolean
): Promise<void> => {
  const title = 'Статья отредактирована администратором';
  const message = `Ваша статья "${articleTitle}" была отредактирована администратором.\n\nСтатус: ${isPublished ? 'Опубликована' : 'На модерации'}\n\nЕсли у вас есть вопросы, обратитесь в поддержку.`;
  
  await createNotification({
    userId: authorId,
    type: 'article_edited',
    title,
    message
  });
};

export const createArticleDeletedNotification = async (
  authorId: number, 
  articleTitle: string
): Promise<void> => {
  const title = 'Статья удалена администратором';
  const message = `Ваша статья "${articleTitle}" была удалена администратором.\n\nЕсли у вас есть вопросы, обратитесь в поддержку.`;
  
  await createNotification({
    userId: authorId,
    type: 'article_deleted',
    title,
    message
  });
};

export const createEventEditedNotification = async (
  authorId: number, 
  eventTitle: string, 
  isPublished: boolean
): Promise<void> => {
  const title = 'Событие отредактировано администратором';
  const message = `Ваше событие "${eventTitle}" было отредактировано администратором.\n\nСтатус: ${isPublished ? 'Опубликовано' : 'На модерации'}\n\nЕсли у вас есть вопросы, обратитесь в поддержку.`;
  
  await createNotification({
    userId: authorId,
    type: 'event_edited',
    title,
    message
  });
};

export const createEventDeletedNotification = async (
  authorId: number, 
  eventTitle: string
): Promise<void> => {
  const title = 'Событие удалено администратором';
  const message = `Ваше событие "${eventTitle}" было удалено администратором.\n\nЕсли у вас есть вопросы, обратитесь в поддержку.`;
  
  await createNotification({
    userId: authorId,
    type: 'event_deleted',
    title,
    message
  });
};
