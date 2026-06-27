import { useEffect, useState } from 'react';
import { Camera, ImagePlus, Pencil, Star, Trash2 } from 'lucide-react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import { fetchTreaboStats, uploadTreaboFile, type TreaboStats } from '@/data/treabo';
import { getStoredTreaboToken } from '@/data/treabo-auth';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';

export default function TreaboProfilePage() {
  const auth = useTreaboAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<TreaboStats | null>(null);
  const portfolio = auth.user?.portfolio || [];
  const rating = Number(stats?.rating ?? auth.user?.rating ?? 0);
  const reviewsCount = Number(stats?.reviews_count ?? auth.user?.reviews_count ?? 0);

  useEffect(() => {
    const token = getStoredTreaboToken();
    if (!token) return;

    fetchTreaboStats(token)
      .then(setStats)
      .catch(() => undefined);
  }, []);

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
      if (uploaded.url) {
        await auth.updateProfile({ avatar: uploaded.url });
      }
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
      const uploaded = await Promise.all(
        selected.map((file) => uploadTreaboFile(file, { token, folder: 'portfolio' })),
      );
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

  return (
    <TreaboAccountShell title="Анкета">
      <div className="space-y-4">
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

        <section className="rounded-[30px] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-[#edf1f7]">
              {auth.user?.avatar ? (
                <img src={auth.user.avatar} alt={auth.user.name} className="h-full w-full object-cover" />
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black leading-tight">{auth.user?.name || 'Специалист Treabo'}</h2>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
                    <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-[#232323]" /> {rating.toFixed(1).replace('.', ',')}</span>
                    <span>{reviewsCount} отзывов</span>
                    <span className="text-[#7d849b]">Паспорт проверен</span>
                  </div>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f5f6f1] px-3 py-1.5 text-sm font-bold">Квалификация подтверждена</span>
                <span className="rounded-full bg-[#f5f6f1] px-3 py-1.5 text-sm font-bold">{auth.user?.city || 'Chișinău'}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-sm">
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
                  <img src={photo} alt="Портфолио мастера" className="h-32 w-full object-cover" loading="lazy" />
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
              Добавьте фотографии выполненных работ. Они будут отображаться в списке мастеров и анкете.
            </div>
          )}
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">О себе</h2>
            <Pencil className="h-4 w-4" />
          </div>
          <p className="max-w-3xl text-base leading-7">
            Здесь будет описание мастера, услуги, выезд к клиенту, портфолио и подтвержденные документы.
            Сейчас страница подготовлена под данные из приложения Treabo.
          </p>
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-sm">
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
