-- Публикуем все события от экспертов, которые ждали модерации
UPDATE events
SET
  is_published = true,
  moderation_status = 'approved',
  moderation_reason = NULL,
  moderated_by = NULL,
  moderated_at = NULL
WHERE moderation_status IN ('pending', 'draft')
   OR (moderation_status IS NULL AND is_published = false);

-- Публикуем все статьи от экспертов, которые ждали модерации
UPDATE articles
SET
  is_published = true,
  moderation_status = 'approved',
  moderation_reason = NULL,
  moderated_by = NULL,
  moderated_at = NULL
WHERE moderation_status = 'pending'
  AND (archived = false OR archived IS NULL);

-- Проверяем результат
SELECT 'events' AS table_name, COUNT(*) AS published_count
FROM events WHERE is_published = true
UNION ALL
SELECT 'articles', COUNT(*)
FROM articles WHERE is_published = true AND (archived = false OR archived IS NULL);
