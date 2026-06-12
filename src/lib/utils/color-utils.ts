/**
 * Утилиты для работы с цветами
 * Конвертация названий цветов в hex коды
 */

// Маппинг названий цветов на hex коды (стандартные цвета)
const colorNameToHex: Record<string, string> = {
  // Основные цвета
  'белый': '#FFFFFF',
  'white': '#FFFFFF',
  'черный': '#000000',
  'black': '#000000',
  'красный': '#FF0000',
  'red': '#FF0000',
  'синий': '#0000FF',
  'blue': '#0000FF',
  'зеленый': '#008000',
  'green': '#008000',
  'желтый': '#FFFF00',
  'yellow': '#FFFF00',
  'оранжевый': '#FFA500',
  'orange': '#FFA500',
  'фиолетовый': '#800080',
  'purple': '#800080',
  'розовый': '#FFC0CB',
  'pink': '#FFC0CB',
  'серый': '#808080',
  'gray': '#808080',
  'grey': '#808080',
  
  // Оттенки
  'темно-синий': '#00008B',
  'dark blue': '#00008B',
  'светло-синий': '#87CEEB',
  'light blue': '#87CEEB',
  'голубой': '#00BFFF',
  'cyan': '#00BFFF',
  'темно-зеленый': '#006400',
  'dark green': '#006400',
  'светло-зеленый': '#90EE90',
  'light green': '#90EE90',
  'салатовый': '#7FFF00',
  'lime': '#7FFF00',
  'темно-красный': '#8B0000',
  'dark red': '#8B0000',
  'светло-красный': '#FF6B6B',
  'light red': '#FF6B6B',
  'бордовый': '#800020',
  'burgundy': '#800020',
  'малиновый': '#DC143C',
  'crimson': '#DC143C',
  'коричневый': '#A52A2A',
  'brown': '#A52A2A',
  'бежевый': '#F5F5DC',
  'beige': '#F5F5DC',
  'кремовый': '#FFFDD0',
  'cream': '#FFFDD0',
  'золотой': '#FFD700',
  'gold': '#FFD700',
  'серебряный': '#C0C0C0',
  'silver': '#C0C0C0',
  'бронзовый': '#CD7F32',
  'bronze': '#CD7F32',
  
  // Популярные цвета для одежды
  'хаки': '#C3B091',
  'khaki': '#C3B091',
  'оливковый': '#808000',
  'olive': '#808000',
  'бирюзовый': '#40E0D0',
  'turquoise': '#40E0D0',
  'лавандовый': '#E6E6FA',
  'lavender': '#E6E6FA',
  'мятный': '#98FF98',
  'mint': '#98FF98',
  'коралловый': '#FF7F50',
  'coral': '#FF7F50',
  'персиковый': '#FFDAB9',
  'peach': '#FFDAB9',
  'лососевый': '#FA8072',
  'salmon': '#FA8072',
  'индиго': '#4B0082',
  'indigo': '#4B0082',
  'фуксия': '#FF00FF',
  'fuchsia': '#FF00FF',
  'лайм': '#00FF00',
  'lime green': '#00FF00',
  'небесно-голубой': '#87CEEB',
  'sky blue': '#87CEEB',
  'морской волны': '#00CED1',
  'teal': '#00CED1',
  'шоколадный': '#7B3F00',
  'chocolate': '#7B3F00',
  'сливовый': '#8B008B',
  'plum': '#8B008B',
  'томатный': '#FF6347',
  'tomato': '#FF6347',
  'морковный': '#FF8C00',
  'carrot': '#FF8C00',
};

/**
 * Конвертирует название цвета в hex код
 * @param colorName - Название цвета (например, "Красный", "Red")
 * @returns hex код цвета или null если не найден
 */
export function colorNameToHexCode(colorName: string): string | null {
  if (!colorName) return null;
  
  // Нормализуем название: убираем пробелы, приводим к нижнему регистру
  const normalized = colorName.trim().toLowerCase();
  
  // Проверяем прямой маппинг
  if (colorNameToHex[normalized]) {
    return colorNameToHex[normalized];
  }
  
  // Если название уже hex код - возвращаем как есть
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorName)) {
    return colorName;
  }
  
  // Пытаемся найти частичное совпадение
  for (const [name, hex] of Object.entries(colorNameToHex)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return hex;
    }
  }
  
  // Если не найдено - возвращаем null (будет использован fallback)
  return null;
}

/**
 * Получает цвет для отображения (hex код или fallback)
 * @param colorName - Название цвета
 * @param fallback - Цвет по умолчанию если не найден
 * @returns hex код цвета
 */
export function getColorHex(colorName: string, fallback: string = '#CCCCCC'): string {
  const hex = colorNameToHexCode(colorName);
  return hex || fallback;
}

/**
 * Проверяет, является ли строка hex кодом цвета
 */
export function isHexColor(str: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str);
}

