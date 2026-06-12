export function formatPlaceDate(date: string | Date, t?: (k: string) => any): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const day = d.getDate();
  let month = '';
  if (t) {
    const months = (t as any)('text-months', { returnObjects: true }) as string[];
    month = months[d.getMonth()];
  } else {
    // fallback на toLocaleString если нет t
    month = d.toLocaleString('ru-RU', { month: 'long' });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return `${day} ${month}`;
  } else {
    return `${day} ${month} ${d.getFullYear()}`;
  }
} 