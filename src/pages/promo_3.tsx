import Button from '@/components/ui/button';
import Card from '@/components/common/card';
import { Package, TrendingUp, Headphones, ChevronDown } from 'lucide-react';
import type { NextPageWithLayout } from '@/types';
import { TitleSeo } from '@/components/seo/title-seo';

const PromoPage: NextPageWithLayout = () => {

  return (
    <>
      <TitleSeo 
        title="SANCAN Seller - Стань продавцом" 
        description="Начните бизнес на Sancan с бесплатной регистрацией. Мы создаём среду, в которой бренды, производители и селлеры получают больше, чем просто витрину товаров."
      />
      <div className="min-h-screen bg-white dark:bg-dark-100">
        {/* Header */}
        <header className="border-b border-light-500 dark:border-dark-600 bg-dark-100 dark:bg-dark-200">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-light dark:text-light">
                SANCAN <span className="font-light">seller</span>
              </h1>
              <nav className="hidden md:flex items-center gap-6">
                <a href="https://sancan.ru/marketplace" className="text-sm text-light/80 hover:text-light transition-colors">О проекте</a>
                <a href="https://sancan.ru/earn" className="text-sm text-light/80 hover:text-light transition-colors">Зарабатывать с Sancan</a>
                <a href="#" className="text-sm text-light/80 hover:text-light transition-colors">Что продавать</a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="inline-flex border-promo-primary text-promo-primary hover:bg-promo-primary hover:text-promo-primary-foreground"
                onClick={() => window.open('https://seller.sancan.ru/login', '_blank')}
                style={{ backgroundColor: 'rgba(224, 243, 22, 1)' }}
              >
                Войти в кабинет
              </Button>
             
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-dark-100 dark:bg-dark-200 py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-6xl font-bold text-light dark:text-light leading-tight">
                  Продвигайте бизнес на Sancan с бесплатной регистрацией
                </h2>
                <p className="text-lg text-light/80 dark:text-light/80">
                Мы создаём среду, в которой бренды, производители и селлеры получают больше, чем просто витрину товаров.
                </p>
                <Button
                variant="outline"
                className="hidden md:inline-flex border-promo-primary text-promo-primary hover:bg-promo-primary hover:text-promo-primary-foreground"
                onClick={() => window.open('https://seller.sancan.ru/login', '_blank')}
                style={{ backgroundColor: 'rgba(224, 243, 22, 1)' }}
              >
                Стать продавцом
              </Button>
              </div>
              <div className="relative">
                <div className="w-full aspect-square max-w-md mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-brand-dark/20 rounded-3xl blur-3xl"></div>
                  <div className="relative flex items-center justify-center h-full">
                    <Package className="w-48 h-48 text-brand/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-white dark:bg-dark-100 py-16" style={{ backgroundColor: 'rgba(230, 163, 29, 0.5)' }}>
          <div className="grid md:grid-cols-3 gap-6">
			
              <Card className="bg-blue-500/20 dark:bg-blue-500/20 border-0 p-8 rounded-2xl hover:scale-105 transition-transform">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold text-dark dark:text-light">
                    Помогаем мастерам и небольшим брендам.
                    </h3>
                    <p className="text-dark/70 dark:text-light/70">
                    Пространство для тех, кто создаёт своими руками и сердцем.
                    </p>
                    
                  </div>
                  <TrendingUp className="w-12 h-12 text-brand shrink-0" />
                </div>
              </Card>

              <Card className="bg-blue-500/20 dark:bg-blue-500/20 border-0 p-8 rounded-2xl hover:scale-105 transition-transform">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold text-dark dark:text-light">
                    Медиа-платформа для селлеров.
                    </h3>
                    <p className="text-dark/70 dark:text-light/70">
                    Дополнительный канал продаж без гонки за ценой. Добавляйте свои товары, ведите трафик напрямую и усиливайте присутствие за пределами маркетплейсов.
                    </p>
                    
                  </div>
                  <Package className="w-12 h-12 text-blue-500 shrink-0" />
                </div>
              </Card>

              <Card className="bg-pink-500/20 dark:bg-pink-500/20 border-0 p-8 rounded-2xl hover:scale-105 transition-transform">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold text-dark dark:text-light">
                    Создавайте визуальные плейсы для ваших коллекций.
                    </h3>
                    <p className="text-dark/70 dark:text-light/70">
                    Добавляйте прямые ссылки на товары, чтобы аудитория могла легко переходить к покупке.
                    </p>
                    
                  </div>
                  <Headphones className="w-12 h-12 text-pink-500 shrink-0" />
                </div>
              </Card>
            </div>
        </section>

        {/* Steps Section */}
        <section className="bg-dark-100 dark:bg-dark-200 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-light dark:text-light mb-12 text-center">
              Всего 4 шага, и можно продавать
            </h2>
            
            <div className="grid md:grid-cols-4 gap-6 mb-16">
               <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl">
                <div className="space-y-2">
                  <div className="text-sm text-dark/60 dark:text-light/60">Шаг 1</div>
                  <h3 className="text-xl font-bold text-dark dark:text-light">Регистрация</h3>
                </div>
              </Card>
              
              <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl">
                <div className="space-y-2">
                  <div className="text-sm text-dark/60 dark:text-light/60">Шаг 2</div>
                  <h3 className="text-xl font-bold text-dark dark:text-light">Создание товарных карточек</h3>
                  <p className="text-sm text-dark/60 dark:text-light/60">3 мин</p>
                </div>
              </Card>
              
              <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl">
                <div className="space-y-2">
                  <div className="text-sm text-dark/60 dark:text-light/60">Шаг 3</div>
                  <h3 className="text-xl font-bold text-dark dark:text-light">Создание плейсов</h3>
                  <p className="text-sm text-dark/60 dark:text-light/60">30 мин</p>
                </div>
              </Card>
              
              <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl">
                <div className="space-y-2">
                  <div className="text-sm text-dark/60 dark:text-light/60">Шаг 4</div>
                  <h3 className="text-xl font-bold text-dark dark:text-light">Сбор статистики=Продажи</h3>
                  <p className="text-sm text-dark/60 dark:text-light/60">5 мин</p>
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-dark-300 border-0 p-8 rounded-2xl">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-dark dark:text-light">
                    Ссылка на маркетплейс из карточки товара
                  </h3>
                  <p className="text-dark/70 dark:text-light/70">
                    Привлекайте трафик из плейсов на товары, и используйте ссылку на маркетплейс Ozon/Wildberries
                  </p>
                  <button className="text-brand hover:text-brand-dark p-0 h-auto font-semibold">
                    Узнать больше →
                  </button>
                </div>
              </Card>

              <Card className="bg-white dark:bg-dark-300 border-0 p-8 rounded-2xl">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-dark dark:text-light">
                    Калькулятор
                  </h3>
                  <p className="text-dark/70 dark:text-light/70">
                    Рассчитайте свой бюджет на продвижение
                  </p>
                  <button className="text-brand hover:text-brand-dark p-0 h-auto font-semibold">
                    Попробовать →
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Telegram Bot CTA */}
        <section className="bg-white dark:bg-dark-100 py-6">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-r from-brand to-brand-dark border-0 p-8 rounded-2xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-brand" />
                  </div>
                  <p className="text-lg font-medium text-white">
                    Поможем пройти все шаги в нашем чате
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 border-white text-white hover:bg-white hover:text-brand"
                  onClick={() => window.open('https://t.me/seller_sancan', '_blank')}
                >
                  Перейти →
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Knowledge Base Section */}
        <section className="bg-white dark:bg-dark-100 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-dark dark:text-light mb-12">
              Поделимся опытом
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl hover:scale-105 transition-transform">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-dark dark:text-light">
                    Самозанятые продавцы
                  </h3>
                  <p className="text-dark/70 dark:text-light/70">
                    Как продавать и расти
                  </p>
                  <button className="text-brand hover:text-brand-dark p-0 h-auto font-semibold">
                    Читать →
                  </button>
                </div>
              </Card>

              <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl hover:scale-105 transition-transform">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-dark dark:text-light">
                    Развеиваем страхи
                  </h3>
                  <p className="text-dark/70 dark:text-light/70">
                    Чего боятся продавцы
                  </p>
                  <button className="text-brand hover:text-brand-dark p-0 h-auto font-semibold">
                    Читать →
                  </button>
                </div>
              </Card>

              <Card className="bg-brand border-0 p-6 rounded-2xl hover:scale-105 transition-transform">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-dark dark:text-light">
                    Еще больше статей
                  </h3>
                  <p className="text-dark/70 dark:text-light/70">
                    Всё о том, как быстро начать продажи на Sancan
                  </p>
                  <button className="text-brand hover:text-brand-dark p-0 h-auto font-semibold">
                    Смотреть все →
                  </button>
                </div>
              </Card>

              <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl hover:scale-105 transition-transform">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-dark dark:text-light">
                    Всё про тарифы Sancan
                  </h3>
                  <p className="text-dark/70 dark:text-light/70">
                    За что платят продавцы
                  </p>
                  <button className="text-brand hover:text-brand-dark p-0 h-auto font-semibold">
                    Читать →
                  </button>
                </div>
              </Card>

              <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl hover:scale-105 transition-transform">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-dark dark:text-light">
                    Как стать заметным
                  </h3>
                  <p className="text-dark/70 dark:text-light/70">
                    Руководство по продвижению товаров
                  </p>
                  <button className="text-brand hover:text-brand-dark p-0 h-auto font-semibold">
                    Читать →
                  </button>
                </div>
              </Card>

              <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl hover:scale-105 transition-transform">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-dark dark:text-light">
                    Ходовой товар
                  </h3>
                  <p className="text-dark/70 dark:text-light/70">
                    Как не ошибиться при выборе товара
                  </p>
                  <button className="text-brand hover:text-brand-dark p-0 h-auto font-semibold">
                    Читать →
                  </button>
                </div>
              </Card>

              <Card className="bg-white dark:bg-dark-300 border border-light-500 dark:border-dark-600 p-6 rounded-2xl hover:scale-105 transition-transform">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-dark dark:text-light">
                    Доставка ТК СДЭК
                  </h3>
                  <p className="text-dark/70 dark:text-light/70">
                    Почему это выгодно
                  </p>
                  <button className="text-brand hover:text-brand-dark p-0 h-auto font-semibold">
                    Читать →
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="bg-dark-100 dark:bg-dark-200 py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-light dark:text-light mb-2">
                  18 %
                </div>
                <div className="text-light/70 dark:text-light/70">
                  комиссия платформы от продажи
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-light dark:text-light mb-2">
                  ∞
                </div>
                <div className="text-light/70 dark:text-light/70">
                  плейсов и товаров
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-light dark:text-light mb-2">
                  товары на заказ
                </div>
                <div className="text-light/70 dark:text-light/70">
                  удобно мастерам и студиям
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-light dark:text-light mb-2">
                  &gt;2000
                </div>
                <div className="text-light/70 dark:text-light/70">
                  План PRO
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white dark:bg-dark-100 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-5xl font-bold text-dark dark:text-light">
                  Зарегистрируйтесь</h2> 
				  <h3 className="text-xl font-bold text-dark dark:text-light">
				  и начните продвигать свой продукт по новому
                </h3>
                <p className="text-lg text-dark/70 dark:text-light/70">
                  Будьте первыми и подключите бесплатно <b>План PRO</b> на 30 дней - проверьте все возможности.
                </p>
              </div>
              
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-dark-100 dark:bg-dark-200 border-t border-light-500 dark:border-dark-600 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-light dark:text-light">Проект SANCAN.RU</h3>
              <p className="text-light/70 dark:text-light/70 max-w-2xl mx-auto">
                Медиа-платформа для продвижения оригинальных товаров и брендов.
              </p>
              
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

PromoPage.getLayout = function getLayout(page: React.ReactElement) {
  return <>{page}</>;
};

export default PromoPage;

