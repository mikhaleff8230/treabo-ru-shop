import * as yup from 'yup';
import type { SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { LoginUserInput } from '@/types';
import { Form } from '@/components/ui/forms/form';
import Password from '@/components/ui/forms/password';
import Input from '@/components/ui/forms/input';
import Button from '@/components/ui/button';
import { useModalAction } from '@/components/modal-views/context';
import useAuth from '@/components/auth/use-auth';
import CheckBox from '@/components/ui/forms/checkbox';
import { RegisterBgPattern } from '@/components/auth/register-bg-pattern';
import client from '@/data/client';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import YandexAuthButton from './yandex-auth-button';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import { getAuthToken } from '@/data/client/token.utils';
import { useState } from 'react';
import AuthTabs from './auth-tabs';
import { ReactPhone } from '@/components/ui/forms/phone-input';
import OtpCodeInput from './otp-code-input';

const loginValidationSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

const phoneLoginValidationSchema = yup.object().shape({
  phone_number: yup.string().required('Телефон обязателен'),
});

export default function LoginUserForm() {
  const { t } = useTranslation('common');
  const { openModal, closeModal } = useModalAction();
  const { authorize } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Состояние для переключателя вкладок
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');
  
  // Состояние для OTP
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Мутация для обычного входа по email
  const { mutate: login } = useMutation(client.users.login, {
    onSuccess: (data) => {
      if (!data.token) {
        toast.error(<b>{t('text-wrong-user-name-and-pass')}</b>, {
          className: '-mt-10 xs:mt-0',
        });
        return;
      }
      
      authorize(data.token);
      queryClient.invalidateQueries([API_ENDPOINTS.USERS_ME]);
      
      // Получаем данные пользователя и сохраняем имя и телефон
      setTimeout(() => {
        client.users.me().then((userData) => {
          if (userData?.name) {
            localStorage.setItem('saved_user_name', userData.name);
          }
          if (userData?.profile?.contact) {
            localStorage.setItem('saved_phone_number', userData.profile.contact);
          }
        }).catch(() => {
          // Игнорируем ошибки при получении данных пользователя
        });
      }, 500);
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const savedToken = getAuthToken();
          if (savedToken) {
            closeModal();
          } else {
            setTimeout(() => {
              authorize(data.token);
              setTimeout(() => {
                if (getAuthToken()) {
                  closeModal();
                }
              }, 100);
            }, 100);
          }
        });
      });
      
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        router.push('/select-address');
      }
    },
  });

  // Мутация для отправки OTP
  const { mutate: sendOtp } = useMutation(client.users.sendOtpCode, {
    onSuccess: (data) => {
      if (data.success && data.id) {
        setOtpId(data.id);
        setIsSendingOtp(false);
        toast.success(<b>Код отправлен на {phoneNumber}</b>, {
          className: '-mt-10 xs:mt-0',
        });
      } else {
        setIsSendingOtp(false);
        toast.error(<b>Ошибка отправки кода</b>, {
          className: '-mt-10 xs:mt-0',
        });
      }
    },
    onError: (error: any) => {
      setIsSendingOtp(false);
      toast.error(<b>{error.response?.data?.message || 'Ошибка отправки кода'}</b>, {
        className: '-mt-10 xs:mt-0',
      });
    },
  });

  // Мутация для входа через OTP
  const { mutate: otpLogin } = useMutation(client.users.otpLogin, {
    onSuccess: (data) => {
      if (!data.token) {
        toast.error(<b>Ошибка входа</b>, {
          className: '-mt-10 xs:mt-0',
        });
        return;
      }
      
      // Сохраняем телефон в localStorage для быстрого входа по PIN-коду
      if (phoneNumber) {
        localStorage.setItem('saved_phone_number', phoneNumber);
      }
      
      authorize(data.token);
      queryClient.invalidateQueries([API_ENDPOINTS.USERS_ME]);
      
      // Получаем данные пользователя и сохраняем имя
      setTimeout(() => {
        client.users.me().then((userData) => {
          if (userData?.name) {
            localStorage.setItem('saved_user_name', userData.name);
          }
          if (userData?.profile?.contact) {
            localStorage.setItem('saved_phone_number', userData.profile.contact);
          }
        }).catch(() => {
          // Игнорируем ошибки при получении данных пользователя
        });
      }, 500);
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const savedToken = getAuthToken();
          if (savedToken) {
            closeModal();
          } else {
            setTimeout(() => {
              authorize(data.token);
              setTimeout(() => {
                if (getAuthToken()) {
                  closeModal();
                }
              }, 100);
            }, 100);
          }
        });
      });
      
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        router.push('/select-address');
      }
    },
    onError: (error: any) => {
      setIsVerifyingOtp(false);
      setOtpError(error.response?.data?.message || 'Неверный код');
      toast.error(<b>{error.response?.data?.message || 'Неверный код'}</b>, {
        className: '-mt-10 xs:mt-0',
      });
    },
  });

  // Обработчик отправки формы по email
  const onSubmit: SubmitHandler<LoginUserInput> = (data) => {
    login(data);
  };

  // Обработчик отправки OTP
  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error(<b>Введите корректный номер телефона</b>, {
        className: '-mt-10 xs:mt-0',
      });
      return;
    }
    
    setIsSendingOtp(true);
    setOtpError('');
    sendOtp({ phone_number: phoneNumber });
  };

  // Обработчик проверки OTP кода
  const handleVerifyOtp = (code: string) => {
    if (!otpId) return;
    
    setIsVerifyingOtp(true);
    setOtpError('');
    otpLogin({
      otp_id: otpId,
      code: code,
      phone_number: phoneNumber,
    });
  };

  // Сброс состояния при смене вкладки
  const handleTabChange = (tab: 'phone' | 'email') => {
    setActiveTab(tab);
    setOtpId(null);
    setOtpCode('');
    setOtpError('');
    setPhoneNumber('');
  };

  return (
    <div className="bg-light px-6 pt-10 pb-8 dark:bg-dark-300 sm:px-8 lg:p-12">
      <RegisterBgPattern className="absolute bottom-0 left-0 text-light dark:text-dark-300 dark:opacity-60" />
      <div className="relative z-10 flex items-center">
        <div className="w-full shrink-0 text-left md:w-[380px]">
          <div className="flex flex-col pb-5 text-center xl:pb-6 xl:pt-2">
            <h2 className="text-lg font-medium tracking-[-0.3px] text-dark dark:text-light lg:text-xl">
              {t('text-welcome-back')}
            </h2>
            <div className="mt-1.5 text-13px leading-6 tracking-[0.2px] dark:text-light-900 lg:mt-2.5 xl:mt-3">
              {t('text-join-now')}{' '}
              <button
                onClick={() => openModal('REGISTER')}
                className="inline-flex font-semibold text-brand hover:text-dark-400 hover:dark:text-light-500"
              >
                {t('text-create-account')}
              </button>
            </div>
          </div>

          {/* Переключатель вкладок */}
          <AuthTabs activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Форма входа по телефону */}
          {activeTab === 'phone' && (
            <div className="space-y-4 pt-4 lg:space-y-5">
              {!otpId ? (
                <>
                  {/* Поле ввода телефона */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-light">
                      Телефон
                    </label>
                    <ReactPhone
                      country="ru"
                      value={phoneNumber}
                      onChange={(value) => setPhoneNumber(value)}
                      inputClass="!w-full !h-11 !bg-light dark:!bg-dark-300 !border-gray-300 dark:!border-gray-600"
                      buttonClass="!bg-light dark:!bg-dark-300 !border-gray-300 dark:!border-gray-600"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || !phoneNumber}
                    loading={isSendingOtp}
                    className="!mt-5 w-full text-sm tracking-[0.2px] lg:!mt-7"
                  >
                    {isSendingOtp ? 'Отправка...' : 'ПОЛУЧИТЬ КОД'}
                  </Button>
                </>
              ) : (
                <>
                  {/* Поле ввода OTP кода */}
                  <div>
                    <p className="mb-4 text-center text-sm text-dark/70 dark:text-light/70">
                      Введите код из SMS, отправленный на {phoneNumber}
                    </p>
                    <OtpCodeInput
                      length={6}
                      value={otpCode}
                      onChange={setOtpCode}
                      onComplete={handleVerifyOtp}
                      disabled={isVerifyingOtp}
                      error={otpError}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOtpId(null);
                        setOtpCode('');
                        setOtpError('');
                      }}
                      disabled={isVerifyingOtp}
                      className="flex-1"
                    >
                      Изменить номер
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || isVerifyingOtp}
                      className="flex-1"
                    >
                      Отправить снова
                    </Button>
                  </div>
                </>
              )}

              {/* Разделитель */}
              {/* <div className="relative my-5 flex items-center">
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                <span className="mx-4 flex-shrink text-sm text-gray-500 dark:text-gray-400">
                  или
                </span>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              </div> */}

                {/* Кнопка авторизации через Яндекс */}
                {/* <YandexAuthButton mode="login" /> */}
                
                {/* Кнопка входа по PIN-коду */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm tracking-[0.2px]"
                  onClick={() => {
                    closeModal();
                    openModal('PIN_LOGIN');
                  }}
                >
                  Войти по PIN-коду
                </Button>
            </div>
          )}

          {/* Форма входа по email */}
          {activeTab === 'email' && (
            <Form<LoginUserInput>
              onSubmit={onSubmit}
              validationSchema={loginValidationSchema}
              className="space-y-4 pt-4 lg:space-y-5"
            >
              {({ register, formState: { errors } }) => (
                <>
                  <Input
                    label="contact-us-email-field"
                    inputClassName="bg-light dark:bg-dark-300"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                  <Password
                    label="text-auth-password"
                    inputClassName="bg-light dark:bg-dark-300"
                    {...register('password')}
                    error={errors.password?.message}
                  />
                  <div className="flex items-center justify-between space-x-5 rtl:space-x-reverse">
                    <CheckBox
                      label="text-remember-me"
                    />
                    <button
                      type="button"
                      className="text-13px font-semibold text-brand hover:text-dark-400 hover:dark:text-light-500"
                      onClick={() => openModal('FORGOT_PASSWORD_VIEW')}
                    >
                      {t('text-forgot-password')}
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="!mt-5 w-full text-sm tracking-[0.2px] lg:!mt-7"
                  >
                    ВОЙТИ В АККАУНТ
                  </Button>
                  
                  {/* Разделитель */}
                  {/* <div className="relative my-5 flex items-center">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="mx-4 flex-shrink text-sm text-gray-500 dark:text-gray-400">
                      или
                    </span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                  </div> */}

                  {/* Кнопка авторизации через Яндекс */}
                  {/* <YandexAuthButton mode="login" /> */}
                </>
              )}
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
