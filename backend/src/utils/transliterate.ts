/**
 * Утилита для транслитерации русских имен в латинские slug
 */

const transliterationMap: { [key: string]: string } = {
  // Строчные буквы
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  
  // Заглавные буквы
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

/**
 * Транслитерирует текст из кириллицы в латиницу
 */
export function transliterate(text: string): string {
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += transliterationMap[char] || char;
  }
  
  return result;
}

/**
 * Создает slug из текста (транслитерация + нормализация)
 */
export function createSlug(text: string): string {
  // Транслитерируем
  let slug = transliterate(text);
  
  // Приводим к нижнему регистру
  slug = slug.toLowerCase();
  
  // Заменяем все не-буквенно-цифровые символы на дефисы
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  
  // Удаляем дефисы в начале и конце
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Заменяем множественные дефисы на один
  slug = slug.replace(/-+/g, '-');
  
  return slug;
}

/**
 * Генерирует уникальный slug для пользователя
 */
export async function generateUniqueSlug(
  name: string,
  userId: number | null,
  checkExists: (slug: string, userId: number | null) => Promise<boolean>
): Promise<string> {
  const baseSlug = createSlug(name);
  let slug = baseSlug;
  let counter = 0;
  
  // Проверяем уникальность
  while (await checkExists(slug, userId)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
}

/**
 * Валидирует slug (только латинские буквы, цифры и дефисы)
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

