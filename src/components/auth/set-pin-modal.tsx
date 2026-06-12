import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button';
import PinCodeInput from './pin-code-input';
import client from '@/data/client';
import { useModalAction } from '@/components/modal-views/context';
import { API_ENDPOINTS } from '@/data/client/endpoints';

interface SetPinModalProps {
  onSuccess?: () => void;
  onSkip?: () => void;
  isFirstTime?: boolean; // Первый раз после регистрации/входа
}

export default function SetPinModal({ onSuccess, onSkip, isFirstTime = false }: SetPinModalProps) {
  const { closeModal } = useModalAction();
  const queryClient = useQueryClient();
  
  const [pinCode, setPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');
  const [isSetting, setIsSetting] = useState(false);
  const [pinError, setPinError] = useState('');

  // Мутация для установки PIN-кода
  const { mutate: setPin } = useMutation(client.users.setPinCode, {
    onSuccess: () => {
      toast.success(<b>PIN-код успешно установлен</b>, {
        className: '-mt-10 xs:mt-0',
      });
      queryClient.invalidateQueries([API_ENDPOINTS.USERS_ME]);
      closeModal();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      setIsSetting(false);
      setPinError(error.response?.data?.message || 'Ошибка установки PIN-кода');
      toast.error(<b>{error.response?.data?.message || 'Ошибка установки PIN-кода'}</b>, {
        className: '-mt-10 xs:mt-0',
      });
    },
  });

  // Обработчик установки PIN-кода
  const handleSetPin = (code: string) => {
    if (code.length !== 4) return;
    
    if (!confirmPinCode) {
      // Первый ввод - запрашиваем подтверждение
      setConfirmPinCode(code);
      setPinCode('');
      setPinError('');
      return;
    }

    // Проверка совпадения
    if (code !== confirmPinCode) {
      setPinError('PIN-коды не совпадают');
      setPinCode('');
      setConfirmPinCode('');
      return;
    }

    // Установка PIN-кода
    setIsSetting(true);
    setPinError('');
    setPin({ pin_code: code });
  };

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-dark dark:text-light">
        {confirmPinCode ? 'Подтвердите PIN-код' : isFirstTime ? 'Установите PIN-код для быстрого входа' : 'Установите PIN-код'}
      </h2>

      <p className="mb-6 text-sm text-dark/70 dark:text-light/70">
        {confirmPinCode 
          ? 'Введите PIN-код еще раз для подтверждения'
          : isFirstTime 
            ? 'Установите 4-значный PIN-код для быстрого входа без пароля. Вы сможете использовать его для входа по номеру телефона.'
            : 'Введите 4 цифры для быстрого входа в будущем'}
      </p>

      <div className="mb-6">
        <PinCodeInput
          length={4}
          value={pinCode}
          onChange={setPinCode}
          onComplete={handleSetPin}
          disabled={isSetting}
          error={pinError}
          mask={true}
        />
      </div>

      <div className="flex gap-2">
        {isFirstTime && !confirmPinCode ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onSkip) {
                  onSkip();
                }
                closeModal();
              }}
              disabled={isSetting}
              className="flex-1"
            >
              Пропустить
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isSetting}
              className="flex-1"
            >
              Позже
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isSetting}
              className="flex-1"
            >
              Отмена
            </Button>
            {confirmPinCode && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPinCode('');
                  setConfirmPinCode('');
                  setPinError('');
                }}
                disabled={isSetting}
                className="flex-1"
              >
                Назад
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

