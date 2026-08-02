import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, ImagePlus, KeyRound, Mail, MapPin, Pencil, Phone, ShieldCheck, Smartphone, Star, Trash2 } from 'lucide-react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import {
  fetchTreaboCategories,
  fetchTreaboSpecialistReviews,
  fetchTreaboStats,
  fetchTreaboWorks,
  treaboApiRequest,
  uploadTreaboFile,
  type TreaboCategory,
  type TreaboSpecialistReview,
  type TreaboStats,
  type TreaboWork,
} from '@/data/treabo';
import { getStoredTreaboToken } from '@/data/treabo-auth';
import { treaboResetCustomerPassword, treaboSendCustomerPasswordResetCode } from '@/data/treabo-auth';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';

type IdentityVerification = {
  status?: 'not_submitted' | 'pending' | 'approved' | 'rejected' | string;
  moderator_comment?: string | null;
  updated_at?: string | null;
};

const verificationCopy: Record<string, { label: string; tone: string; text: string }> = {
  approved: {
    label: 'Паспорт проверен',
    tone: 'bg-[#eefbe4] text-[#2f6f1f]',
    text: 'Модератор подтвердил документы. В списках мастеров будет показан бейдж паспорта.',
  },
  pending: {
    label: 'Паспорт на проверке',
    tone: 'bg-[#fff7dc] text-[#8a5a00]',
    text: 'Заявка отправлена модератору. Обычно проверка занимает до суток.',
  },
  rejected: {
    label: 'Паспорт отклонен',
    tone: 'bg-red-50 text-red-700',
    text: 'Модератор отклонил заявку. Повторно отправить документы можно из приложения.',
  },
  not_submitted: {
    label: 'Паспорт не подтвержден',
    tone: 'bg-[#f1f3f7] text-[#6d7484]',
    text: 'Пройдите проверку личности в мобильном приложении Treabo.',
  },
};

function photoUrl(value?: string | null) {
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('/')) return value;
  return value;
}

function stars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${index < Math.round(rating) ? 'fill-[#232323] text-[#232323]' : 'text-[#c7ccd8]'}`}
    />
  ));
}

export default function TreaboProfilePage() {
  const auth = useTreaboAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<TreaboStats | null>(null);
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [reviews, setReviews] = useState<TreaboSpecialistReview[]>([]);
  const [bio, setBio] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [categories, setCategories] = useState<TreaboCategory[]>([]);
  const [works, setWorks] = useState<TreaboWork[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceSearch, setServiceSearch] = useState('');
  const [city, setCity] = useState('');

  const portfolio = auth.user?.portfolio || [];
  const rating = Number(stats?.rating ?? auth.user?.rating ?? 0);
  const reviewsCount = Number(stats?.reviews_count ?? auth.user?.reviews_count ?? reviews.length ?? 0);
  const verificationStatus = verification?.status || auth.user?.identity_status || (auth.user?.passport_verified ? 'approved' : 'not_submitted');
  const verificationInfo = verificationCopy[verificationStatus] || verificationCopy.not_submitted;

  useEffect(() => {
    setBio(auth.user?.bio || '');
    setCity(auth.user?.city || '');
  }, [auth.user?.bio, auth.user?.city]);

  useEffect(() => {
    if (!auth.isSpecialist) {
      setServicesLoading(false);
      return;
    }
    Promise.all([fetchTreaboCategories(), fetchTreaboWorks()])
      .then(([categoryItems, workItems]) => {
        const activeWorks = workItems.filter((work) => work.is_active !== false);
        const allowedServices = new Set([
          ...categoryItems.map((category) => category.name_ru),
          ...activeWorks.map((work) => work.title),
        ]);
        setCategories(categoryItems);
        setWorks(activeWorks);
        setServices((current) => current.filter((service) => allowedServices.has(service)));
      })
      .catch(() => setError('Не удалось загрузить список категорий и работ'))
      .finally(() => setServicesLoading(false));
  }, [auth.isSpecialist]);

  useEffect(() => {
    if (servicesLoading) return;
    const allowedServices = new Set([
      ...categories.map((category) => category.name_ru),
      ...works.map((work) => work.title),
    ]);
    setServices((auth.user?.services || []).filter((service) => allowedServices.has(service)));
  }, [auth.user?.services, categories, servicesLoading, works]);

  useEffect(() => {
    if (!auth.isSpecialist) return;
    const token = getStoredTreaboToken();
    if (!token) return;

    fetchTreaboStats(token).then(setStats).catch(() => undefined);
    treaboApiRequest<IdentityVerification>('/identity-verification', { token })
      .then(setVerification)
      .catch(() => setVerification({ status: 'not_submitted' }));
  }, [auth.isSpecialist]);

  useEffect(() => {
    if (!auth.isSpecialist || !auth.user?.id) return;
    fetchTreaboSpecialistReviews(String(auth.user.id))
      .then((payload) => setReviews(payload?.data || []))
      .catch(() => setReviews([]));
  }, [auth.isSpecialist, auth.user?.id]);

  const filteredCategories = useMemo(() => {
    const query = serviceSearch.trim().toLocaleLowerCase('ru-RU');
    if (!query) return categories;
    return categories.filter((category) => {
      const categoryMatches = category.name_ru.toLocaleLowerCase('ru-RU').includes(query);
      const workMatches = works.some(
        (work) =>
          String(work.category_id) === String(category.id) &&
          work.title.toLocaleLowerCase('ru-RU').includes(query),
      );
      return categoryMatches || workMatches;
    });
  }, [categories, serviceSearch, works]);

  function toggleService(value: string) {
    setServices((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  async function saveProfile() {
    setSavingProfile(true);
    setError('');
    try {
      await auth.updateProfile({
        bio,
        services,
        city: city.trim() || undefined,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить анкету');
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadAvatar(file?: File | null) {
    if (!file) return;
    const token = getStoredTreaboToken();
    if (!token) {
      setError('Войдите как мастер, чтобы загрузить фото.');
      return;
    }

    setUploadingAvatar(true);
    setError('');
    try {
      const uploaded = await uploadTreaboFile(file, { token, folder: 'avatars' });
      if (uploaded.url) await auth.updateProfile({ avatar: uploaded.url });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить аватар');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function uploadPortfolio(files: FileList | null) {
    if (!files?.length) return;
    const token = getStoredTreaboToken();
    if (!token) {
      setError('Войдите как мастер, чтобы загрузить портфолио.');
      return;
    }

    setUploadingPortfolio(true);
    setError('');
    try {
      const slots = Math.max(0, 10 - portfolio.length);
      const selected = Array.from(files).slice(0, slots);
      const uploaded = await Promise.all(selected.map((file) => uploadTreaboFile(file, { token, folder: 'portfolio' })));
      const urls = uploaded.map((item) => item.url).filter(Boolean) as string[];
      await auth.updateProfile({ portfolio: [...portfolio, ...urls].slice(0, 10) });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить портфолио');
    } finally {
      setUploadingPortfolio(false);
    }
  }

  async function removePortfolioPhoto(url: string) {
    await auth.updateProfile({ portfolio: portfolio.filter((item) => item !== url) });
  }

  if (!auth.isSpecialist) return <TreaboCustomerProfile />;

  return (
    <TreaboAccountShell title="Анкета">
      <div className="space-y-4">
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

        <section className="rounded-[24px] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-[#edf1f7]">
              {auth.user?.avatar ? (
                <img src={photoUrl(auth.user.avatar)} alt={auth.user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-black">
                  {auth.user?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
              )}
              <label className="absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white shadow">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingAvatar}
                  onChange={(event) => {
                    uploadAvatar(event.target.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black leading-tight">{auth.user?.name || 'Специалист Treabo'}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold">
                    <span className="inline-flex items-center gap-1">{stars(rating)} {rating.toFixed(1).replace('.', ',')}</span>
                    <span>{reviewsCount} отзывов</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${verificationInfo.tone}`}>
                      {verificationInfo.label}
                    </span>
                  </div>
                </div>
                <ShieldCheck className="h-8 w-8 text-[#232323]" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {(auth.user?.services || []).slice(0, 5).map((service) => (
                  <span key={service} className="rounded-full bg-[#f5f6f1] px-3 py-1.5 text-sm font-bold">
                    {service}
                  </span>
                ))}
                <span className="rounded-full bg-[#f5f6f1] px-3 py-1.5 text-sm font-bold">
                  {auth.user?.city || 'Город не указан'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            <h2 className="text-xl font-black">Данные анкеты</h2>
          </div>
          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-bold text-[#7d849b]">О себе</span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-2xl bg-[#f3f5fa] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#d9f36b]"
                placeholder="Опишите опыт, сильные стороны, с какими задачами работаете"
              />
            </label>
            <div className="block">
              <span className="text-sm font-bold text-[#7d849b]">Категории и работы</span>
              <p className="mt-1 text-xs leading-5 text-[#9298a8]">
                Выберите только те услуги, которые готовы выполнять. Произвольный текст добавить нельзя.
              </p>
              <input
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
                className="mt-3 w-full rounded-2xl bg-[#f3f5fa] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#d9f36b]"
                placeholder="Найти категорию или работу"
              />
              {services.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {services.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className="rounded-full bg-[#232323] px-3 py-1.5 text-xs font-bold text-white"
                      title="Нажмите, чтобы убрать"
                    >
                      {service} ×
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-[#e2e5ec] bg-[#fafbfc] p-2">
                {servicesLoading ? (
                  <div className="px-3 py-5 text-center text-sm text-[#7d849b]">Загружаем услуги…</div>
                ) : filteredCategories.length ? (
                  filteredCategories.map((category) => {
                    const categoryWorks = works.filter(
                      (work) =>
                        String(work.category_id) === String(category.id) &&
                        (!serviceSearch.trim() ||
                          category.name_ru.toLocaleLowerCase('ru-RU').includes(serviceSearch.trim().toLocaleLowerCase('ru-RU')) ||
                          work.title.toLocaleLowerCase('ru-RU').includes(serviceSearch.trim().toLocaleLowerCase('ru-RU'))),
                    );
                    return (
                      <div key={category.id} className="rounded-xl bg-white p-3">
                        <label className="flex cursor-pointer items-center gap-3 font-bold text-[#232323]">
                          <input
                            type="checkbox"
                            checked={services.includes(category.name_ru)}
                            onChange={() => toggleService(category.name_ru)}
                            className="h-4 w-4 rounded border-zinc-300 text-[#232323] focus:ring-[#d9f36b]"
                          />
                          {category.name_ru}
                        </label>
                        {categoryWorks.length ? (
                          <div className="mt-2 grid gap-1 pl-7 sm:grid-cols-2">
                            {categoryWorks.map((work) => (
                              <label key={work.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[#f5f6f1]">
                                <input
                                  type="checkbox"
                                  checked={services.includes(work.title)}
                                  onChange={() => toggleService(work.title)}
                                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#232323] focus:ring-[#d9f36b]"
                                />
                                <span>{work.title}</span>
                              </label>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-5 text-center text-sm text-[#7d849b]">Ничего не найдено</div>
                )}
              </div>
            </div>
            <label className="block">
              <span className="text-sm font-bold text-[#7d849b]">Город</span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="mt-2 w-full rounded-2xl bg-[#f3f5fa] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#d9f36b]"
                placeholder="Москва"
              />
            </label>
            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="inline-flex h-12 w-fit items-center rounded-2xl bg-[#d9f36b] px-5 text-sm font-black text-[#232323] disabled:opacity-60"
            >
              {savingProfile ? 'Сохраняем...' : 'Сохранить анкету'}
            </button>
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Верификация личности</h2>
              <p className="mt-1 text-sm font-semibold text-[#7d849b]">{verificationInfo.text}</p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1.5 text-sm font-bold ${verificationInfo.tone}`}>
              {verificationInfo.label}
            </span>
          </div>
          {verification?.moderator_comment ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Комментарий модератора: {verification.moderator_comment}
            </div>
          ) : null}
          <div className="mt-4 rounded-2xl border border-dashed border-[#d3d9e8] bg-[#f8f9fb] px-5 py-4 text-sm font-semibold text-[#5a6070]">
            Фото паспорта, страницы прописки и селфи с паспортом отправляются только из мобильного приложения Treabo.
            Так модератор получает реальные снимки с устройства, а не файлы, загруженные с компьютера.
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Портфолио</h2>
              <p className="mt-1 text-sm font-semibold text-[#7d849b]">Галерея работ, до 10 фото</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#d9f36b] px-4 py-3 text-sm font-black text-[#232323]">
              <ImagePlus className="h-4 w-4" />
              {uploadingPortfolio ? 'Загрузка...' : 'Добавить фото'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploadingPortfolio || portfolio.length >= 10}
                onChange={(event) => {
                  uploadPortfolio(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>

          {portfolio.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {portfolio.map((photo) => (
                <div key={photo} className="group relative overflow-hidden rounded-2xl bg-[#edf1f7]">
                  <img src={photoUrl(photo)} alt="Портфолио мастера" className="h-32 w-full object-cover" loading="lazy" />
                  <button
                    type="button"
                    onClick={() => removePortfolioPhoto(photo)}
                    className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-full bg-white shadow group-hover:flex"
                    aria-label="Удалить фото"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#d3d9e8] bg-[#f8f9fb] px-5 py-8 text-sm font-semibold text-[#7d849b]">
              Добавьте фотографии выполненных работ. Они будут отображаться в списке мастеров и публичной анкете.
            </div>
          )}
        </section>

        <section className="rounded-[24px] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Мои отзывы</h2>
            <span className="text-sm font-bold text-[#7d849b]">{reviewsCount} отзывов</span>
          </div>
          <Link href="/treabo/reviews" className="mb-4 inline-flex rounded-2xl bg-[#f3f5fa] px-4 py-2 text-sm font-black text-[#232323]">
            Открыть все отзывы
          </Link>
          {reviews.length ? (
            <div className="space-y-3">
              {reviews.slice(0, 6).map((review) => (
                <article key={review.id} className="rounded-2xl bg-[#f8f9fb] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold">{review.customer_name || 'Заказчик Treabo'}</div>
                    <div className="flex items-center gap-1">{stars(Number(review.rating || 0))}</div>
                  </div>
                  {review.task_title ? <div className="mt-1 text-xs font-semibold text-[#7d849b]">{review.task_title}</div> : null}
                  {review.comment ? <p className="mt-2 text-sm leading-6 text-[#232323]">{review.comment}</p> : null}
                  {review.photos?.length ? (
                    <div className="mt-3 flex gap-2">
                      {review.photos.slice(0, 4).map((photo) => (
                        <img key={photo} src={photoUrl(photo)} alt="Фото отзыва" className="h-16 w-16 rounded-xl object-cover" />
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#d3d9e8] bg-[#f8f9fb] px-5 py-8 text-sm font-semibold text-[#7d849b]">
              Отзывов пока нет. После выполненных заданий они появятся здесь и в публичной анкете мастера.
            </div>
          )}
        </section>

        <section className="rounded-[24px] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Моя статистика</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Отклики', value: Number(stats?.applied || 0) },
              { label: 'Чаты', value: Number(stats?.active_chats || 0) },
              { label: 'Выполнено', value: Number(stats?.completed || stats?.accepted || 0) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-[#f5f6f1] p-4">
                <div className="text-3xl font-black">{item.value}</div>
                <div className="text-sm font-bold text-[#7d849b]">{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </TreaboAccountShell>
  );
}

function TreaboCustomerProfile() {
  const auth = useTreaboAuth();
  const [city, setCity] = useState(auth.user?.city || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const clientAppUrl = process.env.NEXT_PUBLIC_TREABO_CLIENT_APP_APK_URL || '/downloads/treabo-client.apk';

  useEffect(() => setCity(auth.user?.city || ''), [auth.user?.city]);

  async function saveCity() {
    setSaving(true); setError(''); setNotice('');
    try {
      await auth.updateProfile({ city: city.trim() || undefined });
      setNotice('Данные сохранены');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить данные'); }
    finally { setSaving(false); }
  }

  async function uploadAvatar(file?: File | null) {
    if (!file) return;
    const token = getStoredTreaboToken();
    if (!token) return;
    setUploading(true); setError('');
    try {
      const uploaded = await uploadTreaboFile(file, { token, folder: 'avatars' });
      if (uploaded.url) await auth.updateProfile({ avatar: uploaded.url });
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось загрузить фотографию'); }
    finally { setUploading(false); }
  }

  async function sendResetCode(channel: 'telegram' | 'email') {
    if (!auth.user?.phone) return;
    setResetSending(true); setError(''); setNotice('');
    try {
      const result = await treaboSendCustomerPasswordResetCode(auth.user.phone, channel);
      setOtpId(result.otp_id);
      setNotice(channel === 'email' ? `Код отправлен на ${result.destination || auth.user.email}` : 'Код отправлен через Telegram');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось отправить код'); }
    finally { setResetSending(false); }
  }

  async function resetPassword() {
    if (!auth.user?.phone || !otpId || otpCode.trim().length < 4 || newPassword.length < 6) return;
    setResetSending(true); setError('');
    try {
      await treaboResetCustomerPassword({ phone: auth.user.phone, otp_id: otpId, code: otpCode.trim(), password: newPassword });
      setResetOpen(false); setOtpId(''); setOtpCode(''); setNewPassword('');
      setNotice('Пароль успешно изменён');
      await auth.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось изменить пароль'); }
    finally { setResetSending(false); }
  }

  return (
    <TreaboAccountShell title="Профиль заказчика">
      <div className="space-y-4">
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
        {notice ? <div className="rounded-2xl bg-[#eefbe4] px-4 py-3 text-sm font-bold text-[#2f6f1f]">{notice}</div> : null}

        <section className="rounded-[26px] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-[#d9f36b]">
              {auth.user?.avatar ? <img src={photoUrl(auth.user.avatar)} alt={auth.user.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl font-black">{auth.user?.name?.charAt(0)?.toUpperCase() || 'T'}</div>}
              <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white shadow">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => { uploadAvatar(event.target.files?.[0]); event.currentTarget.value = ''; }} />
              </label>
            </div>
            <div className="min-w-0">
              <h2 className="text-3xl font-black">{auth.user?.name || 'Заказчик Treabo'}</h2>
              <div className="mt-1 text-sm font-bold text-[#7d849b]">заказчик</div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {auth.user?.city ? <span className="flex items-center gap-1 rounded-full bg-[#f5f6f1] px-3 py-1.5 text-sm font-bold"><MapPin className="h-4 w-4" />{auth.user.city}</span> : null}
                <span className="flex items-center gap-1 rounded-full bg-[#f5f6f1] px-3 py-1.5 text-sm font-bold"><Phone className="h-4 w-4" />{auth.user?.phone || 'Телефон не указан'}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[26px] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-black">Контактные данные</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label><span className="text-sm font-bold text-[#7d849b]">Город</span><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Москва" className="mt-2 w-full rounded-2xl bg-[#f3f5fa] px-4 py-3 outline-none focus:ring-2 focus:ring-[#d9f36b]" /></label>
            <label><span className="text-sm font-bold text-[#7d849b]">Телефон</span><div className="mt-2 flex min-h-[48px] items-center rounded-2xl bg-[#f3f5fa] px-4 font-bold">{auth.user?.phone || 'Не указан'}</div></label>
            <label className="sm:col-span-2"><span className="text-sm font-bold text-[#7d849b]">Электронная почта</span><div className="mt-2 flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#f3f5fa] px-4 font-bold"><Mail className="h-4 w-4" />{auth.user?.email || 'Почта не указана'}</div></label>
          </div>
          <button onClick={saveCity} disabled={saving} className="mt-5 min-h-[48px] rounded-2xl bg-[#d9f36b] px-6 text-sm font-black disabled:opacity-60">{saving ? 'Сохраняем…' : 'Сохранить'}</button>
        </section>

        <section className="rounded-[26px] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2"><KeyRound className="h-5 w-5" /><h2 className="text-xl font-black">Безопасность</h2></div>
          <p className="mt-2 text-sm font-semibold text-[#7d849b]">Изменение пароля подтверждается кодом. Номер телефона при этом не меняется.</p>
          <button onClick={() => setResetOpen((value) => !value)} className="mt-4 rounded-2xl bg-[#f3f5fa] px-5 py-3 text-sm font-black">Сменить или восстановить пароль</button>
          {resetOpen ? <div className="mt-4 rounded-2xl border border-[#e2e5ec] p-4">
            {!otpId ? <div className="flex flex-wrap gap-2"><button disabled={resetSending} onClick={() => sendResetCode('telegram')} className="rounded-xl bg-[#24262d] px-4 py-3 text-sm font-black text-white">Получить код в Telegram</button>{auth.user?.email ? <button disabled={resetSending} onClick={() => sendResetCode('email')} className="rounded-xl bg-[#d9f36b] px-4 py-3 text-sm font-black">Получить код на email</button> : null}</div> : <div className="grid gap-3 sm:grid-cols-2"><input value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))} placeholder="Код подтверждения" className="rounded-xl bg-[#f3f5fa] px-4 py-3 outline-none" /><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Новый пароль, минимум 6 символов" className="rounded-xl bg-[#f3f5fa] px-4 py-3 outline-none" /><button disabled={resetSending || otpCode.length < 4 || newPassword.length < 6} onClick={resetPassword} className="rounded-xl bg-[#24262d] px-4 py-3 text-sm font-black text-white disabled:opacity-50 sm:col-span-2">Изменить пароль</button></div>}
          </div> : null}
        </section>

        <section className="overflow-hidden rounded-[28px] bg-[#d9f36b] shadow-sm">
          <div className="grid items-stretch md:grid-cols-[1fr_0.75fr]">
            <div className="p-6 sm:p-8"><div className="text-xs font-black uppercase tracking-[0.16em] text-[#536217]">Treabo-client</div><h2 className="mt-2 max-w-xl text-3xl font-black leading-tight">Создавайте заявки и общайтесь с мастерами в приложении</h2><p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[#4e581f]">AI поможет описать задачу, а уведомления о сообщениях и откликах придут прямо на телефон.</p><a href={clientAppUrl} download className="mt-5 inline-flex min-h-[50px] items-center gap-2 rounded-2xl bg-[#24262d] px-6 font-black text-white"><Smartphone className="h-5 w-5" />Скачать приложение заказчика</a></div>
            <div className="relative min-h-[240px] overflow-hidden bg-[linear-gradient(135deg,#bef264,#84cc16)]">
              <Image src="/proffi/treabo-client-app-banner.png" alt="Приложение Treabo для заказчика" fill sizes="(max-width: 768px) 100vw, 36vw" className="bg-black object-contain object-center" />
            </div>
          </div>
        </section>
      </div>
    </TreaboAccountShell>
  );
}
