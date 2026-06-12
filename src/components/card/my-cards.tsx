import CardViewHeader from '@/components/card/card-view-header';
import CardsView from '@/components/card/card-view';
import { useCards } from '@/data/card';
import ErrorMessage from '@/components/ui/error-message';
import TableLoader from '@/components/ui/loader/table-loader';
import { useTranslation } from 'next-i18next';

interface MyCardsProps {
  paymentGateway?: string;
}

const MyCards: React.FC<MyCardsProps> = ({ paymentGateway }) => {
  const { t } = useTranslation();
  const { cards, isLoading, error } = useCards(paymentGateway ? { payment_gateway: paymentGateway } : undefined);

  if (isLoading) {
    return (
      <div className="flex w-full flex-col">
        <div className="mb-8 flex items-center justify-center">
          <h1 className="text-heading text-center text-base font-semibold">
            {t('profile-sidebar-my-cards')}
          </h1>
        </div>

        <TableLoader uniqueKey={`table-loader`} />
      </div>
    );
  }

  if (error) return <ErrorMessage message={error?.message} />;

  return (
    <>
      <CardViewHeader />
      <CardsView payments={cards} />
    </>
  );
};

export default MyCards;
