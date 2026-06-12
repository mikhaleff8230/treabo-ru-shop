export function translit(str: string): string {
  const ru = [
    'а','б','в','г','д','е','ё','ж','з','и','й','к','л','м','н','о','п','р','с','т','у','ф','х','ц','ч','ш','щ','ъ','ы','ь','э','ю','я'
  ];
  const en = [
    'a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','c','ch','sh','sch','','y','','e','yu','ya'
  ];
  return str.split('').map(s => {
    const lower = s.toLowerCase();
    const i = ru.indexOf(lower);
    if (i >= 0) {
      return s === lower ? en[i] : en[i].toUpperCase();
    }
    return s;
  }).join('');
} 