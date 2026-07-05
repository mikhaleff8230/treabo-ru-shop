import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import {
  contactTreaboTaskSpecialist,
  fetchTreaboTaskRecommendedSpecialists,
  normalizeTreaboAssetUrl,
  type TreaboRecommendedSpecialist,
} from '@/data/treabo';
import { getStoredTreaboToken } from '@/data/treabo-auth';
import routes from '@/config/routes';

const SEARCH_DURATION_SEC = 60;

function specialistCountLabel(count: number): string {
  if (count === 0) return 'Подходящих специалистов пока не найдено';
  if (count === 1) return 'Найден 1 специалист';
  if (count >= 2 && count <= 4) return `Найдено ${count} специалиста`;
  return `Найдено ${count} специалистов`;
}

function BlinkingDots() {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => setDots((value) => (value % 3) + 1), 500);
    return () => window.clearInterval(timer);
  }, []);

  return <span aria-hidden="true">{'.'.repeat(dots)}</span>;
}

export default function TreaboTaskSpecialistSearch({
  taskId,
  isCustomer,
}: {
  taskId: string;
  isCustomer?: boolean;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(SEARCH_DURATION_SEC);
  const [loading, setLoading] = useState(true);
  const [specialists, setSpecialists] = useState<TreaboRecommendedSpecialist[]>([]);
  const [contactLoadingId, setContactLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchTreaboTaskRecommendedSpecialists(taskId)
      .then((data) => {
        if (!cancelled) setSpecialists(data.slice(0, 5));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const searching = secondsLeft > 0;
  const progress = useMemo(
    () => Math.round(((SEARCH_DURATION_SEC - secondsLeft) / SEARCH_DURATION_SEC) * 100),
    [secondsLeft],
  );

  async function openChat(specialistId: string) {
    const token = getStoredTreaboToken();
    if (!token) {
      router.push(`/treabo/chats?login=1`);
      return;
    }

    setContactLoadingId(specialistId);
    try {
      const result = await contactTreaboTaskSpecialist(taskId, specialistId, token);
      router.push(result.chat_id ? `/treabo/chats?id=${result.chat_id}` : '/treabo/chats');
    } catch {
      router.push('/treabo/chats');
    } finally {
      setContactLoadingId(null);
    }
  }

  if (!isCustomer) {
    return null;
  }

  return (
    <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
      {searching ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-[400] text-[#232323]">
              Идет поиск специалистов
              <BlinkingDots />
            </p>
            <span className="text-sm font-[400] tabular-nums text-[#7d849b]">{secondsLeft}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef1f7]">
            <div
              className="h-full rounded-full bg-[#d9f36b] transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <p className="text-base font-[400] text-[#232323]">
            {loading ? 'Загрузка результатов...' : specialistCountLabel(specialists.length)}
          </p>
          {specialists.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-start justify-start gap-4 sm:gap-5">
              {specialists.map((specialist) => {
                const avatar = normalizeTreaboAssetUrl(specialist.avatar);
                const profileHref = routes.specialistUrl(specialist);
                return (
                  <div key={specialist.id} className="flex w-[72px] flex-col items-center text-center sm:w-[80px]">
                    <button
                      type="button"
                      onClick={() => openChat(specialist.id)}
                      disabled={contactLoadingId === specialist.id}
                      className="group flex flex-col items-center disabled:opacity-60"
                    >
                      <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#eef1f7] ring-2 ring-transparent transition group-hover:ring-[#d9f36b] sm:h-16 sm:w-16">
                        {avatar ? (
                          <img src={avatar} alt={specialist.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-[400] text-[#7d849b]">
                            {(specialist.name || '?').slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="mt-2 line-clamp-2 text-xs font-[400] leading-4 text-[#232323] group-hover:underline">
                        {specialist.name}
                      </span>
                    </button>
                    <Link href={profileHref} className="mt-1 text-[10px] text-[#7d849b] hover:underline">
                      профиль
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
