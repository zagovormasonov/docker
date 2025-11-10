-- Добавление статуса "draft" для черновиков статей
-- Выполните этот SQL в базе данных после обновления кода

-- Обновляем все существующие неопубликованные статьи на статус 'draft'
UPDATE articles 
SET moderation_status = 'draft' 
WHERE is_published = false 
  AND (moderation_status IS NULL OR moderation_status = 'pending');

-- Обновляем все существующие опубликованные статьи на статус 'approved'
UPDATE articles 
SET moderation_status = 'approved' 
WHERE is_published = true 
  AND moderation_status IS NULL;

-- Проверяем результат
SELECT 
  moderation_status,
  is_published,
  COUNT(*) as count
FROM articles
GROUP BY moderation_status, is_published
ORDER BY moderation_status, is_published;

