import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import type { NextPageWithLayout, UpdateProfileInput } from '@/types';
import type { SubmitHandler } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import DashboardLayout from '@/layouts/_dashboard';
import { Form } from '@/components/ui/forms/form';
import Input from '@/components/ui/forms/input';
import Textarea from '@/components/ui/forms/textarea';
import { ReactPhone } from '@/components/ui/forms/phone-input';
import Button from '@/components/ui/button';
import client from '@/data/client';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import { useMe } from '@/data/user';
import pick from 'lodash/pick';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import Uploader from '@/components/ui/forms/uploader';
import * as yup from 'yup';
import PvzModal from '@/components/pvz/PvzModal';
import SavedAddresses from '@/components/profile/SavedAddresses';
import UserAddress from '@/components/profile/UserAddress';
import { useState } from 'react';
import { useModalAction } from '@/components/modal-views/context';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';

const profileValidationSchema = yup.object().shape({
  id: yup.string().required(),
  name: yup.string().required(),
  profile: yup.object().shape({
    id: yup.string(),
    bio: yup.string(),
    contact: yup.string(),
    avatar: yup
      .object()
      .shape({
        id: yup.string(),
        thumbnail: yup.string(),
        original: yup.string(),
      })
      .optional()
      .nullable(),
  }),
});
const ProfilePage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { me } = useMe();
  const { openModal } = useModalAction();
  const { mutate, isLoading } = useMutation(client.users.update, {
    onSuccess: () => {
      toast.success(<b>{t('text-profile-page-success-toast')}</b>, {
        className: '-mt-10 xs:mt-0',
      });
    },
    onError: (error) => {
      toast.error(<b>{t('text-profile-page-error-toast')}</b>, {
        className: '-mt-10 xs:mt-0',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.USERS_ME);
    },
  });
  const onSubmit: SubmitHandler<UpdateProfileInput> = (data) => {
    // Обрабатываем аватар - если это массив, берем первый элемент
    let avatar = data.profile?.avatar || null;
    if (Array.isArray(avatar)) {
      avatar = avatar.length > 0 ? avatar[0] : null;
    }
    
    // Формируем данные для отправки с явной структурой
    const input: UpdateProfileInput = {
      id: data.id,
      name: data.name || '',
      profile: {
        id: data.profile?.id || me?.profile?.id,
        bio: data.profile?.bio || '',
        contact: data.profile?.contact || '',
        avatar: avatar,
      },
    };
    
    console.log('Profile update data:', input); // Логирование для отладки
    mutate(input);
  };
  const [showPvzModal, setShowPvzModal] = useState(false);
  const [pvz, setPvz] = useState(me?.profile?.contact?.startsWith('ПВЗ:') ? me.profile.contact : '');
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useIsMounted();
  const isDarkMode = isMounted ? resolvedTheme === 'dark' : false;

  return (
    <motion.div
      variants={fadeInBottom()}
      className="flex min-h-full flex-grow flex-col"
    >
      <h1 className="mb-5 text-15px font-medium text-dark dark:text-light sm:mb-6">
        {t('text-profile-page-title')}
      </h1>
      
      {/* Переключатель темы */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-dark-400 sm:col-span-2">
        <span className="text-base font-medium text-dark dark:text-light">
          Темная тема
        </span>
        {isMounted && (
          <Switch
            checked={isDarkMode}
            onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            className={`${
              isDarkMode ? 'bg-accent' : 'bg-gray-300'
            } relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2`}
          >
            <span className="sr-only">Переключить тему</span>
            <span
              className={`${
                isDarkMode ? 'translate-x-7' : 'translate-x-1'
              } inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform`}
            />
          </Switch>
        )}
      </div>
      
      <Form<UpdateProfileInput>
        onSubmit={onSubmit}
        useFormProps={{
          defaultValues: pick(me, [
            'id',
            'name',
            'profile.id',
            'profile.contact',
            'profile.bio',
            'profile.avatar',
          ]),
        }}
        validationSchema={profileValidationSchema}
        className="flex flex-grow flex-col"
      >
        {({ register, reset, control, formState: { errors } }) => (
          <>
            <fieldset className="mb-6 grid gap-5 pb-5 sm:grid-cols-2 md:pb-9 lg:mb-8">
              <Controller
                name="profile.avatar"
                control={control}
                render={({ field: { ref, ...rest } }) => (
                  <div className="sm:col-span-2">
                    <span className="block cursor-pointer pb-2.5 font-normal text-dark/70 dark:text-light/70">
                      {t('text-profile-avatar')}
                    </span>
                    <div className="text-xs">
                      <Uploader {...rest} multiple={false} />
                    </div>
                  </div>
                )}
              />
              <Input
                label={t('text-profile-name')}
                {...register('name')}
                error={errors.name?.message}
              />
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="block cursor-pointer pb-2.5 font-normal text-dark/70 dark:text-light/70">
                    {t('text-profile-contact')}
                  </span>
                  {me?.profile?.phone_verified && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ✓ Подтвержден
                    </span>
                  )}
                </div>
                <Controller
                  name="profile.contact"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <ReactPhone country="ru" {...field} />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="small"
                        onClick={() => {
                          openModal('UPDATE_PHONE', {
                            currentPhone: field.value,
                            userId: me?.id,
                            onSuccess: () => {
                              queryClient.invalidateQueries(API_ENDPOINTS.USERS_ME);
                            },
                          });
                        }}
                      >
                        Обновить
                      </Button>
                    </div>
                  )}
                />
                {errors.profile?.contact?.message && (
                  <span
                    role="alert"
                    className="block pt-2 text-xs text-warning"
                  >
                    {'contact field is required'}
                  </span>
                )}
                <div className="mt-4 p-3 bg-gray-50 rounded flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ПВЗ для заказов</div>
                    <div className="font-semibold text-base">{pvz ? pvz : 'ПВЗ не выбран'}</div>
                  </div>
                  <button
                    type="button"
                    className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => setShowPvzModal(true)}
                  >
                    Изменить
                  </button>
                </div>
                {showPvzModal && (
                  <PvzModal
                    onClose={() => setShowPvzModal(false)}
                    onSelect={selected => {
                      setPvz(selected);
                      setShowPvzModal(false);
                      // TODO: обновить поле profile.contact через форму
                    }}
                    allowSaveToProfile={true}
                  />
                )}
              </div>
              <Textarea
                label={t('text-profile-bio')}
                {...register('profile.bio')}
                error={errors.profile?.bio?.message && 'bio field is required'}
                className="sm:col-span-2"
              />
              {/* Поле "Мой адрес" - после описания, перед ПВЗ */}
              <div className="sm:col-span-2">
                <UserAddress />
              </div>
              
              {/* PIN-код для быстрого входа */}
              <div className="sm:col-span-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-dark-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-dark dark:text-light">
                        PIN-код для быстрого входа
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {me?.profile?.pin_code 
                          ? 'PIN-код установлен. Вы можете использовать его для быстрого входа.'
                          : 'Установите PIN-код для быстрого входа без пароля'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={() => {
                        openModal('SET_PIN', {
                          onSuccess: () => {
                            queryClient.invalidateQueries(API_ENDPOINTS.USERS_ME);
                          },
                        });
                      }}
                    >
                      {me?.profile?.pin_code ? 'Изменить' : 'Установить'}
                    </Button>
                  </div>
                </div>
              </div>
            </fieldset>
            <div className="mt-auto flex items-center gap-4 pb-3 lg:justify-end">
              <Button
                type="reset"
                onClick={() =>
                  reset({
                    id: me?.id,
                    name: '',
                    profile: {
                      id: me?.profile?.id,
                      avatar: null,
                      bio: '',
                      contact: '',
                    },
                  })
                }
                disabled={isLoading}
                variant="outline"
                className="flex-1 lg:flex-none"
              >
                {t('text-cancel')}
              </Button>
              <Button
                className="flex-1 lg:flex-none"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {t('text-save-changes')}
              </Button>
            </div>
          </>
        )}
      </Form>
      
      {/* Секция сохраненных адресов */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <SavedAddresses />
      </div>
    </motion.div>
  );
};

ProfilePage.authorization = true;
ProfilePage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
    revalidate: 60, // In seconds
  };
};

export default ProfilePage;
