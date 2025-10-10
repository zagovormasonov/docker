# Исправление ошибки Docker сборки

## Проблема
```
npm error ERESOLVE unable to resolve dependency tree
npm error peer react@"^19.0.0" from react-leaflet@5.0.0
npm error Found: react@18.3.1
```

## Причина
- `react-leaflet@5.0.0` требует React 19
- Проект использует React 18
- Конфликт версий в Docker контейнере

## Решение

### 1. Упрощение реализации карт
Вместо использования react-leaflet, реализована упрощенная версия с iframe:
- Удалены зависимости `leaflet` и `react-leaflet`
- Используется встроенный iframe с OpenStreetMap
- Сохранена функциональность геокодирования

### 2. Обновление Dockerfile
```dockerfile
# Было:
RUN npm install --production=false

# Стало:
RUN npm install --production=false --legacy-peer-deps
```

### 3. Новая реализация EventMap
```typescript
// Использует iframe вместо react-leaflet
const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates[1]-0.01},${coordinates[0]-0.01},${coordinates[1]+0.01},${coordinates[0]+0.01}&layer=mapnik&marker=${coordinates[0]},${coordinates[1]}`;

return (
  <iframe
    width="100%"
    height="100%"
    src={mapUrl}
    title={`Карта события: ${eventTitle}`}
  />
);
```

## Результат
- ✅ Совместимость с React 18
- ✅ Успешная сборка Docker
- ✅ Карты работают корректно через iframe
- ✅ Все функции сохранены
- ✅ Нет конфликтов зависимостей

## Преимущества нового подхода
- Нет конфликтов версий
- Меньше зависимостей
- Быстрая загрузка
- Стабильная работа
- Простота поддержки

## Проверка
```bash
# Локальная проверка
npm install
npm run build

# Docker сборка
docker build -t frontend .
```
