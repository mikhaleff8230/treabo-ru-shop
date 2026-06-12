import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck,
  Briefcase,
  ChevronDown,
  Filter,
  Map,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import team1 from '@/assets/images/team/1.png';
import team2 from '@/assets/images/team/2.png';
import team3 from '@/assets/images/team/3.png';
import team4 from '@/assets/images/team/4.png';
import team5 from '@/assets/images/team/5.png';
import team6 from '@/assets/images/team/6.png';
import { ProffiFooter, ProffiHeader } from './ProffiShell';

type Specialist = {
  name: string;
  online: string;
  rating: string;
  reviews: string;
  praise: string;
  team: string;
  verified: string;
  qualification: string;
  location: string;
  services: string[];
  photos: StaticImageData[];
  avatar: StaticImageData;
};

const specialists: Specialist[] = [
  {
    name: 'Дмитрий Е.',
    online: 'Был в сети сегодня в 06:34',
    rating: '5,0',
    reviews: '52 отзыва',
    praise: 'Очень хвалят',
    team: 'С командой',
    verified: 'Паспорт проверен',
    qualification: 'Специалист сдал экзамен по услугам: малярные и штукатурные работы, поклейка обоев.',
    location: 'Кишинёв, Ботаника',
    services: ['Ремонт квартир', 'Покраска стен', 'Плитка', 'Штукатурка'],
    photos: [team2, team3, team4],
    avatar: team1,
  },
  {
    name: 'Андрей П.',
    online: 'Онлайн',
    rating: '4,9',
    reviews: '38 отзывов',
    praise: 'Быстро отвечает',
    team: 'Работает сам',
    verified: 'Документы проверены',
    qualification: 'Выполняет сантехнические работы, сборку мебели и мелкий ремонт по дому.',
    location: 'Кишинёв, Центр',
    services: ['Сантехника', 'Мелкий ремонт', 'Сборка мебели'],
    photos: [team5, team6, team3],
    avatar: team2,
  },
  {
    name: 'Михаил С.',
    online: 'Был в сети вчера',
    rating: '4,8',
    reviews: '71 отзыв',
    praise: 'Аккуратная работа',
    team: 'С напарником',
    verified: 'Профиль подтвержден',
    qualification: 'Берет заказы по электрике, диагностике, установке розеток и светильников.',
    location: 'Бельцы',
    services: ['Электрика', 'Диагностика', 'Светильники'],
    photos: [team4, team1, team6],
    avatar: team3,
  },
];

const filters = [
  { title: 'Услуги', options: ['Ремонт', 'Сантехника', 'Электрика', 'Плитка', 'Покраска'] },
  { title: 'Рейтинг', options: ['4,5+', '5,0', 'С отзывами'] },
  { title: 'Документы', options: ['Без документов', 'Паспорт', 'Медкнижка', 'Права B'] },
  { title: 'Выезд', options: ['К клиенту', 'Сегодня', 'На этой неделе'] },
];

function SpecialistCard({ specialist }: { specialist: Specialist }) {
  return (
    <article className="rounded-[30px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[1fr_230px]">
        <div className="min-w-0">
          <div className="flex gap-4">
            <Image
              src={specialist.avatar}
              alt={specialist.name}
              width={96}
              height={116}
              className="h-[116px] w-24 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-[#232323]">{specialist.name}</h2>
              <p className="mt-1 text-sm font-medium text-[#7d849b]">{specialist.online}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-base font-black text-[#232323]">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  {specialist.rating}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-5 w-5" />
                  {specialist.reviews}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-xs text-white">★</span>
                  {specialist.praise}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-[#232323]">
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#a1a7b5]" /> {specialist.team} <ChevronDown className="h-3 w-3" /></span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#a1a7b5]" /> {specialist.verified} <ChevronDown className="h-3 w-3" /></span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
            <div>
              <div className="font-black text-[#232323]">Квалификация подтверждена</div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#232323]">{specialist.qualification}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {specialist.services.map((service) => (
              <span key={service} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-[#232323]">
                {service}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-lg">
            {specialist.photos.map((photo, index) => (
              <Image
                key={`${specialist.name}-${index}`}
                src={photo}
                alt={`${specialist.name} portfolio ${index + 1}`}
                width={180}
                height={120}
                className="h-24 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-zinc-100 bg-white p-4 lg:border-0 lg:p-0">
          <button
            type="button"
            className="w-full rounded-2xl bg-[#eef3f8] px-4 py-3 text-sm font-black text-[#7d849b]"
          >
            Написать сообщение
          </button>
          <p className="mt-3 text-sm leading-6 text-[#7d849b]">
            Вы сможете писать после заполнения деталей задачи
          </p>
          <div className="my-4 h-px bg-zinc-200" />
          <div className="font-black text-[#232323]">Выезд к клиенту</div>
          <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#232323]">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            {specialist.location}
          </div>
        </aside>
      </div>
    </article>
  );
}

export default function SpecialistsMarketplacePage() {
  return (
    <div className="min-h-screen bg-[#f5f6f1] text-[#232323]">
      <ProffiHeader />
      <main>
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <h1 className="text-[34px] font-black leading-[1.05] sm:text-5xl">
                  Найдите специалиста для задачи
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[#232323]">
                  Смотрите рейтинг, отзывы, подтвержденные документы и портфолио мастеров Treabo.
                </p>
              </div>
              <div className="rounded-[28px] bg-[#d9f36b] p-5">
                <div className="text-sm font-bold">Доступно сегодня</div>
                <div className="mt-1 text-3xl font-black">128 мастеров</div>
                <div className="mt-2 text-sm font-semibold">отвечают после заявки</div>
              </div>
            </div>

            <div className="mt-6 grid gap-2 rounded-[28px] border border-zinc-200 bg-white p-2 shadow-[0_16px_42px_rgba(31,41,55,0.08)] sm:grid-cols-[1fr_220px_160px]">
              <label className="flex h-14 items-center gap-3 rounded-2xl bg-zinc-50 px-4">
                <Search className="h-5 w-5 text-[#232323]" />
                <input className="w-full bg-transparent font-bold outline-none placeholder:text-[#232323]" placeholder="Какая услуга нужна?" />
              </label>
              <label className="flex h-14 items-center gap-3 rounded-2xl bg-zinc-50 px-4">
                <MapPin className="h-5 w-5 text-[#232323]" />
                <input className="w-full bg-transparent font-bold outline-none placeholder:text-[#232323]" placeholder="Кишинёв" />
              </label>
              <button className="rounded-2xl bg-[#232323] px-5 font-black text-white">Найти</button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[310px_minmax(0,1fr)] lg:px-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-[30px] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-black">Фильтры</h2>
                <Filter className="h-5 w-5" />
              </div>
              <div className="space-y-5">
                {filters.map((group) => (
                  <div key={group.title} className="border-t border-zinc-100 pt-5 first:border-t-0 first:pt-0">
                    <div className="mb-3 flex items-center justify-between font-black">
                      {group.title}
                      <ChevronDown className="h-4 w-4" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => (
                        <button key={option} className="rounded-full bg-zinc-100 px-3 py-2 text-xs font-bold text-[#232323]">
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-5 py-3 font-black">
                <Map className="h-4 w-4" />
                Посмотреть на карте
              </button>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[26px] border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-[#232323]">Найдено</div>
                <div className="text-xl font-black">{specialists.length} специалиста</div>
              </div>
              <Link href="/request/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d9f36b] px-5 py-3 text-sm font-black text-[#232323]">
                <Briefcase className="h-4 w-4" />
                Создать заявку
              </Link>
            </div>
            {specialists.map((specialist) => (
              <SpecialistCard key={specialist.name} specialist={specialist} />
            ))}
          </section>
        </section>
      </main>
      <ProffiFooter />
    </div>
  );
}
