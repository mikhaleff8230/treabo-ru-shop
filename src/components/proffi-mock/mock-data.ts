import {
  Baby,
  Bike,
  Briefcase,
  Brush,
  Car,
  Drill,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MapPin,
  PackageCheck,
  Paintbrush,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wrench,
} from 'lucide-react';
import team1 from '@/assets/images/team/1.png';
import team2 from '@/assets/images/team/2.png';
import team3 from '@/assets/images/team/3.png';

export const serviceCategories = [
  { title: 'Ремонт и строительство', count: '18 420 мастеров', icon: Drill },
  { title: 'Красота', count: '9 870 специалистов', icon: Sparkles },
  { title: 'Репетиторы', count: '31 200 анкет', icon: GraduationCap },
  { title: 'Дом и быт', count: '12 640 исполнителей', icon: Home },
  { title: 'Здоровье', count: '4 380 специалистов', icon: HeartPulse },
  { title: 'Авто', count: '5 910 мастеров', icon: Car },
  { title: 'IT и дизайн', count: '7 540 профи', icon: Laptop },
  { title: 'Грузоперевозки', count: '3 260 бригад', icon: Truck },
];

export const popularSearches = [
  'Ремонт ванной',
  'Уборка квартиры',
  'Сантехник',
  'Электрик',
  'Репетитор английского',
  'Маникюр',
  'Сборка мебели',
  'Курьер',
];

export const mockSpecialists = [
  {
    name: 'Михаил',
    role: 'Мастер ремонта',
    rating: '4.98',
    reviews: '184 отзыва',
    price: 'от 1 500 ₽',
    avatar: team1,
    tags: ['Санузлы', 'Плитка', 'Под ключ'],
  },
  {
    name: 'Елена',
    role: 'Клининг и уход',
    rating: '4.94',
    reviews: '96 отзывов',
    price: 'от 2 200 ₽',
    avatar: team2,
    tags: ['Уборка', 'После ремонта', 'Окна'],
  },
  {
    name: 'Артем',
    role: 'Электрик',
    rating: '4.99',
    reviews: '211 отзывов',
    price: 'от 900 ₽',
    avatar: team3,
    tags: ['Проводка', 'Щиток', 'Розетки'],
  },
];

export const trustStats = [
  { value: '2 мин', label: 'до первого отклика' },
  { value: '120+', label: 'категорий услуг' },
  { value: '4.9', label: 'средняя оценка' },
  { value: '24/7', label: 'чат с исполнителем' },
];

export const steps = [
  { title: 'Опишите задачу', text: 'Выберите категорию, адрес, бюджет и добавьте фото.' },
  { title: 'Получите отклики', text: 'Специалисты увидят заказ и напишут цену и сроки.' },
  { title: 'Выберите мастера', text: 'Смотрите рейтинг, отзывы, портфолио и переписку.' },
];

export const jobFilters = [
  {
    title: 'Оплата за задание',
    options: ['Любая', 'Повышенная', 'Сегодня'],
  },
  {
    title: 'Расположение',
    options: ['Любое', 'Рядом со мной', 'По карте'],
  },
  {
    title: 'Время старта',
    options: ['08:00 - 12:00', '12:00 - 16:00', '16:00 - 22:00', '22:00 - 08:00'],
  },
  {
    title: 'Длительность',
    options: ['до 4 часов', '4-6 часов', '6-8 часов', 'от 8 часов'],
  },
  {
    title: 'Документы',
    options: ['Без документов', 'Медкнижка', 'Права B'],
  },
];

export const jobCards = [
  {
    title: 'Сборщик заказов в гипермаркете',
    brand: 'Ритейл-партнер',
    location: 'Москва, м. Теплый Стан',
    time: 'Сегодня, 16:00 - 22:00',
    pay: '3 600 ₽',
    duration: '6 часов',
    tags: ['Выплата завтра', 'Без опыта'],
    icon: PackageCheck,
  },
  {
    title: 'Помощник мастера на объект',
    brand: 'Ремонтная бригада',
    location: 'Москва, Хорошево',
    time: 'Завтра, 09:00 - 18:00',
    pay: '5 200 ₽',
    duration: '9 часов',
    tags: ['Инструмент на месте', 'Рядом с метро'],
    icon: Wrench,
  },
  {
    title: 'Курьер на вечернюю смену',
    brand: 'Городская доставка',
    location: 'Москва, в пределах района',
    time: 'Сегодня, 18:00 - 23:00',
    pay: '4 100 ₽',
    duration: '5 часов',
    tags: ['Свободный график', 'Можно на велосипеде'],
    icon: Bike,
  },
  {
    title: 'Малярные работы в квартире',
    brand: 'Частный заказчик',
    location: 'Москва, Раменки',
    time: 'На этой неделе',
    pay: '12 000 ₽',
    duration: '1-2 дня',
    tags: ['Фото объекта', 'Материалы есть'],
    icon: Paintbrush,
  },
];

export const jobTags = [
  'для студентов',
  'ежедневная оплата',
  'вечером',
  'рядом с домом',
  'без опыта',
  'в выходные',
  'разовые задания',
  'для мастеров',
];

export const faqItems = [
  {
    q: 'Как выбрать подходящее задание?',
    a: 'Используйте фильтры по району, времени, оплате и длительности. В карточке видно адрес, сроки, требования и ориентировочную выплату.',
  },
  {
    q: 'Когда приходит оплата?',
    a: 'В макете показываем быстрые выплаты после подтверждения задачи. Реальные правила подключим после интеграции API.',
  },
  {
    q: 'Нужен ли опыт?',
    a: 'Для части заданий опыт не нужен. Для профессиональных заказов будет указана категория, навыки и требуемые документы.',
  },
];

export const heroIcons = [Search, ShieldCheck, Briefcase, Brush, Baby, MapPin, Star];
