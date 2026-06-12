import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import type { NextPageWithLayout } from '@/types';
import GeneralLayout from '@/layouts/_general-layout';
import PageHeading from '@/components/ui/page-heading';
import GeneralContainer from '@/layouts/_general-container';
import Seo from '@/layouts/_seo';
import routes from '@/config/routes';

const ReturnPage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  
  return (
    <>
      <Seo
        title="Условия возврата товаров"
        description="Условия и сроки возврата товаров на SANCAN.ru"
        url={routes.return}
      />
      <div className="mx-auto flex h-full w-full max-w-screen-xl flex-col p-4 sm:p-5">
        <PageHeading
          title="Условия возврата товаров"
          subtitle="Сроки и условия возврата товаров"
        />
        <GeneralContainer>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <h2>Сроки возврата</h2>
            <p>
              Вы можете вернуть товар в течение 21 дня с момента получения заказа, если товар не был в употреблении, 
              сохранены его товарный вид, потребительские свойства, пломбы, фабричные ярлыки, а также имеется товарный 
              чек или кассовый чек либо иной подтверждающий оплату указанного товара документ.
            </p>

            <h2>Условия возврата</h2>
            <p>
              Возврат товара надлежащего качества возможен в случае, если сохранены его товарный вид, потребительские 
              свойства, а также документ, подтверждающий факт и условия покупки указанного товара.
            </p>

            <h3>Товары, не подлежащие возврату</h3>
            <p>
              Согласно Постановлению Правительства РФ от 31.12.2020 № 2463, не подлежат возврату следующие категории товаров:
            </p>
            <ul>
              <li>Товары, изготовленные на заказ или имеющие индивидуально-определенные свойства</li>
              <li>Цифровые товары, если они были предоставлены потребителю</li>
              <li>Товары, бывшие в употреблении</li>
              <li>Товары без упаковки или с поврежденной упаковкой</li>
            </ul>

            <h2>Процедура возврата</h2>
            <ol>
              <li>Свяжитесь с нашей службой поддержки для оформления возврата</li>
              <li>Укажите номер заказа и причину возврата</li>
              <li>Дождитесь подтверждения возврата от нашей службы поддержки</li>
              <li>Отправьте товар по указанному адресу</li>
              <li>После получения товара мы вернем деньги в течение 10 рабочих дней</li>
            </ol>

            <h2>Возврат денежных средств</h2>
            <p>
              Денежные средства возвращаются тем же способом, которым была произведена оплата товара. 
              Срок возврата денежных средств составляет не более 10 дней с момента получения товара продавцом.
            </p>

            <h2>Контакты</h2>
            <p>
              Для оформления возврата свяжитесь с нашей службой поддержки:
            </p>
            <ul>
              <li>Email: support@sancan.ru</li>
              <li>Телефон: +7 (800) 123-45-67</li>
              <li>Время работы: Пн-Пт с 9:00 до 18:00</li>
            </ul>
          </div>
        </GeneralContainer>
      </div>
    </>
  );
};

ReturnPage.getLayout = function getLayout(page) {
  return <GeneralLayout>{page}</GeneralLayout>;
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
    revalidate: 60, // In seconds
  };
};

export default ReturnPage;

