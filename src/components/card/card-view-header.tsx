import { useTranslation } from 'next-i18next';

const CardViewHeader = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-15px font-medium text-dark dark:text-light">
          {t('profile-sidebar-my-cards')}
        </h1>
      </div>
    </>
  );
};

export default CardViewHeader;
