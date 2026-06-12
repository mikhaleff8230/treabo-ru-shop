import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PinCodeInput from './pin-code-input';
import { ReactPhone } from '@/components/ui/forms/phone-input';
import client from '@/data/client';
import { useModalAction } from '@/components/modal-views/context';
import useAuth from './use-auth';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import { getAuthToken } from '@/data/client/token.utils';
import { useRouter } from 'next/router';
import { useMe } from '@/data/user';

// Ключи для хранения данных в localStorage
const PHONE_NUMBER_KEY = 'saved_phone_number';
const USER_NAME_KEY = 'saved_user_name';

export default function PinLoginForm() {
  const { closeModal, openModal } = useModalAction();
  const { authorize, getToken, isAuthorized } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [pinCode, setPinCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  
  // Получаем телефон и имя из localStorage
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [manualPhone, setManualPhone] = useState<string>('');

  // Пытаемся получить данные пользователя из API, если авторизован
  const { data: userData } = useMe();
  
  // Загружаем данные из localStorage и API при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem(PHONE_NUMBER_KEY);
      const savedName = localStorage.getItem(USER_NAME_KEY);
      
      // Сначала проверяем localStorage
      if (savedPhone) {
        setPhoneNumber(savedPhone);
      }
      if (savedName) {
        setUserName(savedName);
      }
      
      // Если нет в localStorage, но есть данные из API
      if (!savedPhone && userData) {
        if (userData.profile?.contact) {
          const apiPhone = userData.profile.contact;
          setPhoneNumber(apiPhone);
          localStorage.setItem(PHONE_NUMBER_KEY, apiPhone);
        }
        if (userData.name) {
          setUserName(userData.name);
          localStorage.setItem(USER_NAME_KEY, userData.name);
        }
      }
    }
  }, [userData]);

  // Мутация для входа по PIN-коду
  const { mutate: verifyPin } = useMutation(client.users.verifyPinCode, {
    onSuccess: (data) => {
      if (!data.token) {
        toast.error(<b>Ошибка входа</b>, {
          className: '-mt-10 xs:mt-0',
        });
        return;
      }
      
      // Сохраняем имя пользователя, если оно пришло в ответе
      if (data.user?.name) {
        setUserName(data.user.name);
        localStorage.setItem(USER_NAME_KEY, data.user.name);
      }
      if (data.user?.profile?.contact) {
        setPhoneNumber(data.user.profile.contact);
        localStorage.setItem(PHONE_NUMBER_KEY, data.user.profile.contact);
      }
      
      authorize(data.token);
      queryClient.invalidateQueries([API_ENDPOINTS.USERS_ME]);
      
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
      setIsVerifying(false);
      setPinError(error.response?.data?.message || 'Неверный PIN-код');
      // Не показываем toast, ошибка будет в поле ввода
    },
  });

  // Обработчик проверки PIN-кода
  const handleVerifyPin = (code: string) => {
    // Используем телефон из ручного ввода, если он есть, иначе из сохраненного
    const phoneToUse = manualPhone || phoneNumber;
    
    if (!phoneToUse || phoneToUse.length < 10) {
      setPinError('Введите номер телефона');
      setShowPhoneInput(true);
      return;
    }
    
    setIsVerifying(true);
    setPinError('');
    verifyPin({
      pin_code: code,
      phone_number: phoneToUse,
    });
  };
  
  // Обработчик ввода телефона вручную
  const handleManualPhoneSubmit = () => {
    if (!manualPhone || manualPhone.length < 10) {
      setPinError('Введите корректный номер телефона');
      return;
    }
    
    setPhoneNumber(manualPhone);
    localStorage.setItem(PHONE_NUMBER_KEY, manualPhone);
    setShowPhoneInput(false);
    setPinError('');
  };

  // Обработчик "Не помню код"
  const handleForgotPin = () => {
    closeModal();
    openModal('LOGIN_VIEW');
  };

  // Обработчик "Я не Александр"
  const handleNotThisUser = () => {
    // Очищаем сохраненные данные
    localStorage.removeItem(PHONE_NUMBER_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    setPhoneNumber('');
    setUserName('');
    closeModal();
    openModal('LOGIN_VIEW');
  };

  // Если нет телефона и не показываем поле ввода, предлагаем варианты
  if (!phoneNumber && !showPhoneInput) {
    return (
      <div className="flex items-center justify-center bg-gray-100 px-4 py-8 dark:bg-dark-300">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-dark-200">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900 dark:text-light">
                Вход по PIN-коду
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-light/70">
                Для входа по PIN-коду нужен номер телефона
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowPhoneInput(true)}
                className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Ввести номер телефона
              </button>
              
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  openModal('LOGIN_VIEW');
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-dark-300 dark:text-light dark:hover:bg-dark-200"
              >
                Войти через обычную форму
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gray-100 px-4 py-8 dark:bg-dark-300">
      <div className="w-full max-w-md">
        {/* Белая карточка с закругленными углами */}
        <form 
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
          className="rounded-2xl bg-white p-8 shadow-lg dark:bg-dark-200"
          data-form-type="pin-login"
          data-no-autofill="true"
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
          data-dashlane-ignore="true"
          data-lastpass-ignore="true"
          data-bitwarden-ignore="true"
        >
          {/* Приветствие */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-light">
              {userName ? `Здравствуйте, ${userName}!` : 'Здравствуйте!'}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-light/70">
              Введите код для быстрого входа
            </p>
          </div>

          {/* Поле ввода телефона (если нужно) */}
          {showPhoneInput && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-light">
                Номер телефона
              </label>
              <ReactPhone
                country="ru"
                value={manualPhone}
                onChange={(value) => setManualPhone(value)}
                inputClass="!w-full !h-11 !bg-white dark:!bg-dark-300 !border-gray-300 dark:!border-gray-600"
                buttonClass="!bg-white dark:!bg-dark-300 !border-gray-300 dark:!border-gray-600"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleManualPhoneSubmit}
                  className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  Продолжить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPhoneInput(false);
                    setManualPhone('');
                    setPinError('');
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-dark-300 dark:text-light"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Поле ввода PIN-кода */}
          {!showPhoneInput && (
            <div className="mb-6">
              {phoneNumber && (
                <p className="mb-3 text-center text-xs text-gray-500 dark:text-gray-400">
                  Телефон: {phoneNumber}
                </p>
              )}
              <PinCodeInput
                length={4}
                value={pinCode}
                onChange={setPinCode}
                onComplete={handleVerifyPin}
                disabled={isVerifying || !phoneNumber}
                error={pinError}
                mask={true}
              />
              {pinError && (
                <p className="mt-3 text-center text-sm text-red-600">{pinError}</p>
              )}
            </div>
          )}

          {/* Ссылки */}
          {!showPhoneInput && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setShowPhoneInput(true);
                  setManualPhone(phoneNumber);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
              >
                Изменить номер телефона
              </button>
              <button
                type="button"
                onClick={handleForgotPin}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
              >
                Не помню код
              </button>
              <button
                type="button"
                onClick={handleNotThisUser}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
              >
                Я не {userName || 'этот пользователь'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}


