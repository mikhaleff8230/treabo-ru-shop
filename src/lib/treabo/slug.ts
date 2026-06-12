const cyrillicMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugifyTitle(title: string): string {
  const lower = title.trim().toLowerCase();
  const transliterated = lower
    .split('')
    .map((char) => cyrillicMap[char] ?? char)
    .join('');

  return transliterated
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function taskSlugFromTitle(title: string, id: string | number): string {
  const slug = slugifyTitle(title);
  const numericId = String(id);
  return slug ? `${slug}-${numericId}` : numericId;
}

export function parseTaskIdFromSlug(slugOrId: string): string {
  const value = decodeURIComponent(slugOrId).trim();
  if (/^\d+$/.test(value)) return value;
  if (value.startsWith('mock-')) return value;

  const match = value.match(/-(\d+)$/);
  if (match) return match[1];

  return value;
}
