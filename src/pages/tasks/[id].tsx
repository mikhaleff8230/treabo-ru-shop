import { fetchTreaboTask, type TreaboTask } from '@/data/treabo';
import { TitleSeo } from '@/components/seo/title-seo';
import routes from '@/config/routes';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Ruler,
  Wallet,
} from 'lucide-react';

type TaskDetailProps = {
  task: TreaboTask | null;
};

const money = new Intl.NumberFormat('ru-RU');
const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://sancan.ru').replace(/\/+$/, '');

const mockTask: TreaboTask = {
  id: 'mock-1',
  title: 'Строительство бани',
  description:
    'Стены: каркас, брус. Строительного проекта нет. Подведение коммуникаций: электричество. Материалов нет. Пожелания и особенности: ориентировочно хочется построить такую баню из бруса, с отдельной внешней отделкой.',
  category: 'construction',
  city: 'Москва',
  address: 'Московская область, Рузский муниципальный округ, деревня Ястребово, 5',
  budget: 150000,
  deadline: 'Срок по договоренности',
  status: 'open',
  photos: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function stripHtml(value?: string | null) {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, limit = 160) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trim()}…`;
}

function absoluteUrl(value?: string | null) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${siteUrl}${value}`;
  return `${siteUrl}/${value}`;
}

function buildTaskCanonicalUrl(task: TreaboTask) {
  return `${siteUrl}${routes.taskUrl(task.id)}`;
}

function buildTaskSeo(task: TreaboTask, photos: string[]) {
  const canonical = buildTaskCanonicalUrl(task);
  const location = [task.city, task.address].filter(Boolean).join(', ');
  const budget = Number(task.budget || 0);
  const cleanDescription = stripHtml(task.description);
  const fallbackDescription = [
    `Задание Treabo: ${task.title}.`,
    location ? `Локация: ${location}.` : '',
    budget > 0 ? `Бюджет: ${money.format(budget)} ₽.` : 'Бюджет уточняется.',
  ].filter(Boolean).join(' ');

  return {
    title: `${task.title} - задание Treabo${task.city ? ` в ${task.city}` : ''}`,
    description: truncate(cleanDescription || fallbackDescription),
    canonical,
    ogImage: absoluteUrl(photos.find(Boolean)),
  };
}

function buildTaskJsonLd(task: TreaboTask, seo: ReturnType<typeof buildTaskSeo>) {
  const budget = Number(task.budget || 0);
  const description = stripHtml(task.description) || seo.description;
  const location = [task.city, task.address].filter(Boolean).join(', ');
  const image = seo.ogImage ? [seo.ogImage] : undefined;

  const jobPosting: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: task.title,
    description,
    url: seo.canonical,
    identifier: {
      '@type': 'PropertyValue',
      name: 'Treabo task id',
      value: String(task.id),
    },
    datePosted: task.created_at || task.updated_at || new Date().toISOString(),
    employmentType: 'CONTRACTOR',
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Treabo',
      sameAs: siteUrl,
    },
    jobLocation: {
      '@type': 'Place',
      name: location || task.city || 'Адрес уточняется',
      address: {
        '@type': 'PostalAddress',
        addressLocality: task.city || undefined,
        streetAddress: task.address || undefined,
      },
    },
    image,
  };

  if (budget > 0) {
    jobPosting.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'RUB',
      value: {
        '@type': 'QuantitativeValue',
        value: budget,
        unitText: 'TASK',
      },
    };
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Задания',
        item: `${siteUrl}/podrabotka`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: task.title,
        item: seo.canonical,
      },
    ],
  };

  return [jobPosting, breadcrumbs];
}

function readSpecialistRole() {
  if (typeof window === 'undefined') return false;

  const directRole = [
    window.localStorage.getItem('treabo_role'),
    window.localStorage.getItem('proffi_role'),
    window.localStorage.getItem('user_role'),
  ].find(Boolean);

  if (directRole && ['specialist', 'store_owner', 'master'].includes(directRole)) {
    return true;
  }

  for (const key of ['treabo_user', 'proffi_user', 'user', 'auth_user']) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const value = JSON.parse(raw);
      const role = value?.role || value?.user?.role || value?.permissions?.[0];
      if (['specialist', 'store_owner', 'master'].includes(role)) {
        return true;
      }
    } catch {
      // Ignore legacy non-json values.
    }
  }

  return false;
}

function formatDate(value?: string | null) {
  if (!value) return 'Дата не указана';

  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TaskMap({ task }: { task: TreaboTask }) {
  return (
    <div className="relative mt-4 h-[270px] overflow-hidden rounded-[26px] border border-zinc-200 bg-[#eaf0e3] sm:h-[360px]">
      <div className="absolute inset-0 opacity-90 [background-image:linear-gradient(32deg,transparent_45%,#d3dac7_46%,#d3dac7_53%,transparent_54%),linear-gradient(120deg,transparent_46%,#c8d7e4_47%,#c8d7e4_53%,transparent_54%),linear-gradient(#f8faf5_1px,transparent_1px),linear-gradient(90deg,#f8faf5_1px,transparent_1px)] [background-size:180px_180px,240px_240px,54px_54px,54px_54px]" />
      <div className="absolute left-[49%] top-[43%] h-4 w-4 rounded-full bg-[#232323] shadow-[0_0_0_10px_rgba(35,35,35,0.12)]" />
      <div className="absolute right-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-sm font-black text-[#232323] shadow-sm">Яндекс Карты</div>
      <div className="absolute bottom-4 left-4 max-w-[80%] rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-[#232323] shadow-sm">
        {task.city || 'Город не указан'}
      </div>
      <div className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#232323] shadow-lg">
        <Navigation className="h-5 w-5" />
      </div>
    </div>
  );
}

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const visiblePhotos = photos.filter(Boolean).slice(0, 6);

  if (!visiblePhotos.length) {
    return (
      <div className="grid grid-cols-[1fr_88px] gap-3 sm:grid-cols-[1fr_140px]">
        <div className="flex aspect-[4/3] items-center justify-center rounded-[28px] bg-[#edf1f7] text-[#232323]">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-zinc-400" />
            <div className="mt-3 text-sm font-bold">Фото объекта пока нет</div>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[22px] bg-[#f3f5fa]" />
          <div className="rounded-[22px] bg-[#f3f5fa]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_88px] gap-3 sm:grid-cols-[1fr_140px]">
      <div className="relative overflow-hidden rounded-[28px] bg-[#edf1f7]">
        <img src={visiblePhotos[0]} alt={title} className="aspect-[4/3] h-full w-full object-cover" />
        <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-sm font-black text-[#232323]">
          1/{visiblePhotos.length}
        </div>
      </div>
      <div className="grid gap-3">
        {(visiblePhotos.slice(1, 3).length ? visiblePhotos.slice(1, 3) : visiblePhotos.slice(0, 2)).map((photo, index) => (
          <div key={`${photo}-${index}`} className="overflow-hidden rounded-[22px] bg-[#edf1f7]">
            <img src={photo} alt={`${title} ${index + 2}`} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

const TaskDetailPage: NextPageWithLayout<TaskDetailProps> = ({ task }) => {
  const [isSpecialist, setIsSpecialist] = useState(false);
  const data = task || mockTask;
  const budget = Number(data.budget || 0);
  const photos = data.photos || [];
  const seo = buildTaskSeo(data, photos);
  const jsonLd = buildTaskJsonLd(data, seo);

  useEffect(() => {
    setIsSpecialist(readSpecialistRole());
  }, []);

  const facts = useMemo(() => [
    { icon: Wallet, label: 'Бюджет', value: budget > 0 ? `${money.format(budget)} ₽` : 'Цена договорная' },
    { icon: CalendarClock, label: 'Срок', value: data.deadline || 'По договоренности' },
    { icon: CheckCircle2, label: 'Статус', value: data.status === 'open' ? 'Открыт' : data.status || 'Новый' },
    { icon: Ruler, label: 'Параметры', value: 'Можно уточнить детали' },
  ], [budget, data.deadline, data.status]);

  return (
    <>
      <TitleSeo
        title={seo.title}
        description={seo.description}
        canonical={seo.canonical}
        ogImage={seo.ogImage}
        ogType="article"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#f5f6f1] text-[#232323]">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/podrabotka" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1 truncate px-2 text-center text-base font-black sm:text-lg">{data.title}</div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 pb-28 sm:py-8">
        <section className="rounded-[30px] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-[#7d849b]">
            <span>Частный заказчик</span>
            <span className="rounded-full bg-[#d9f36b] px-3 py-1 text-[#232323]">Задание Treabo</span>
          </div>
          <h1 className="text-2xl font-black leading-tight sm:text-4xl">{data.title}</h1>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-[#232323] sm:grid-cols-2">
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {[data.city, data.address].filter(Boolean).join(', ') || 'Адрес уточняется'}</span>
            <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> Обновлено {formatDate(data.updated_at || data.created_at)}</span>
          </div>
        </section>

        <section className="mt-4 rounded-[30px] bg-white p-4 shadow-sm sm:p-6">
          <PhotoGallery photos={photos} title={data.title} />
        </section>

        <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black">Описание</h2>
          <p className="mt-3 whitespace-pre-line text-base leading-7 text-[#232323]">
            {data.description || 'Клиент пока не добавил подробное описание. Можно уточнить детали в переписке после отклика.'}
          </p>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-[24px] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-[#7d849b]">
                <Icon className="h-4 w-4" />
                {label}
              </div>
              <div className="mt-2 text-xl font-black">{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <MapPin className="h-5 w-5" />
            Адрес
          </h2>
          <p className="mt-3 text-base leading-7">{data.address || 'Точный адрес будет доступен после согласования с клиентом.'}</p>
          {data.city ? <div className="mt-2 inline-flex rounded-full bg-[#f3f5fa] px-3 py-1.5 text-sm font-bold">{data.city}</div> : null}
          <TaskMap task={data} />
        </section>

        <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black">Заказ № {data.id}</h2>
          <div className="mt-3 space-y-2 text-sm text-[#7d849b]">
            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Заказ оставлен {formatDate(data.created_at)}</div>
            <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Обновлен недавно</div>
          </div>
        </section>
      </main>

      {isSpecialist ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl gap-3">
            <button className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#232323] px-5 text-sm font-black text-white">
              <MessageCircle className="h-5 w-5" />
              Написать клиенту
            </button>
            <button className="hidden min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-[#d9f36b] px-5 text-sm font-black text-[#232323] sm:flex">
              Откликнуться
            </button>
          </div>
        </div>
      ) : null}
      </div>
    </>
  );
};

TaskDetailPage.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps<TaskDetailProps> = async ({ locale, params }) => {
  const id = String(params?.id || '');
  const task = id.startsWith('mock-') ? null : await fetchTreaboTask(id);

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      task,
    },
  };
};

export default TaskDetailPage;
