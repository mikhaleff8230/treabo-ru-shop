import { useEffect, useState } from 'react';
import { MessageCircle, Star } from 'lucide-react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import { fetchTreaboSpecialistReviews, normalizeTreaboAssetUrl, type TreaboSpecialistReview } from '@/data/treabo';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';

function stars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${index < Math.round(rating) ? 'fill-[#232323] text-[#232323]' : 'text-[#c7ccd8]'}`}
    />
  ));
}

export default function TreaboReviewsPage() {
  const auth = useTreaboAuth();
  const [reviews, setReviews] = useState<TreaboSpecialistReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchTreaboSpecialistReviews(String(auth.user.id))
      .then((payload) => setReviews(payload?.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [auth.user?.id]);

  return (
    <TreaboAccountShell title="Мои отзывы">
      <div className="space-y-4">
        {loading ? (
          <section className="rounded-[24px] bg-white p-6 text-sm font-bold text-[#7d849b] shadow-sm">
            Загружаем отзывы...
          </section>
        ) : !reviews.length ? (
          <section className="rounded-[24px] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f5fa]">
              <MessageCircle className="h-6 w-6 text-[#7d849b]" />
            </div>
            <h2 className="mt-4 text-xl font-black">Отзывов пока нет</h2>
            <p className="mt-2 text-sm font-semibold text-[#7d849b]">
              Когда заказчики поставят оценки и напишут комментарии, они появятся здесь.
            </p>
          </section>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-[24px] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1">{stars(Number(review.rating || 0))}</div>
                  <div className="mt-2 text-sm font-bold text-[#7d849b]">
                    {review.customer_name || 'Клиент'}
                    {review.task_title ? ` · ${review.task_title}` : ''}
                  </div>
                </div>
                <div className="rounded-full bg-[#f3f5fa] px-3 py-1 text-sm font-black">{review.rating}/5</div>
              </div>

              {review.comment ? <p className="mt-4 whitespace-pre-line text-base leading-7 text-[#232323]">{review.comment}</p> : null}

              {!!review.photos?.length && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {review.photos.map((photo, index) => (
                    <a key={`${review.id}-${index}`} href={normalizeTreaboAssetUrl(photo)} target="_blank" rel="noreferrer">
                      <img
                        src={normalizeTreaboAssetUrl(photo)}
                        alt={`Фото отзыва ${index + 1}`}
                        className="aspect-square w-full rounded-2xl object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </TreaboAccountShell>
  );
}
