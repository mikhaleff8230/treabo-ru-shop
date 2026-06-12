import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import cn from 'classnames';

interface PinCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  mask?: boolean; // Скрывать введенные цифры точками
}

export default function PinCodeInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  mask = true,
}: PinCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));

  useEffect(() => {
    const newDigits = value.split('').slice(0, length);
    while (newDigits.length < length) {
      newDigits.push('');
    }
    setDigits(newDigits);
    
    // Автофокус на первое пустое поле
    if (!disabled && typeof window !== 'undefined') {
      const firstEmptyIndex = newDigits.findIndex(d => !d);
      if (firstEmptyIndex !== -1) {
        setTimeout(() => {
          focusInput(firstEmptyIndex);
        }, 100);
      }
    }
  }, [value, length, disabled]);

  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return;

    // Оставить только цифры
    const digit = newValue.replace(/\D/g, '').slice(-1);
    
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    const fullValue = newDigits.join('');
    onChange(fullValue);

    // Автопереход к следующему полю
    if (digit && index < length - 1) {
      focusInput(index + 1);
    }

    // Автопроверка при заполнении всех полей
    if (fullValue.length === length && onComplete) {
      setTimeout(() => {
        onComplete(fullValue);
      }, 100);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === length) {
      const newDigits = pastedData.split('');
      setDigits(newDigits);
      onChange(pastedData);
      
      if (onComplete) {
        setTimeout(() => {
          onComplete(pastedData);
        }, 100);
      }
    }
  };

  return (
    <div data-pin-code-container="true" data-no-autofill="true">
      {/* Невидимое поле для обмана браузера - заставляет его думать, что это уже поле пароля */}
      <input
        type="password"
        autoComplete="new-password"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        readOnly
      />
      <div className="flex justify-center gap-3">
        {digits.map((digit, index) => {
          // Находим первый пустой индекс
          const firstEmptyIndex = digits.findIndex(d => !d);
          // Активное поле - первое пустое поле
          const isActive = !disabled && !error && index === firstEmptyIndex && firstEmptyIndex !== -1;
          // Заполненное поле
          const isFilled = !disabled && digit && !error;
          // Пустое неактивное поле
          const isEmpty = !disabled && !digit && !error && !isActive;
          
          // Определяем, должно ли поле быть readonly (неактивные поля)
          const isReadOnly = !isActive && !isFilled && !disabled;
          
          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
                // Агрессивная защита от автозаполнения через прямое обращение к DOM
                if (el) {
                  // Устанавливаем атрибуты напрямую
                  el.setAttribute('autocomplete', 'off');
                  el.setAttribute('data-form-type', 'other');
                  el.setAttribute('data-1p-ignore', 'true');
                  el.setAttribute('data-lpignore', 'true');
                  el.setAttribute('data-bwignore', 'true');
                  el.setAttribute('data-dashlane-ignore', 'true');
                  el.setAttribute('data-lastpass-ignore', 'true');
                  el.setAttribute('data-bitwarden-ignore', 'true');
                  
                  // Убираем автозаполнение через стили
                  el.style.setProperty('-webkit-autofill', 'none', 'important');
                  el.style.setProperty('-webkit-text-fill-color', 'inherit', 'important');
                  el.style.setProperty('caret-color', 'inherit', 'important');
                  
                  // Отключаем автозаполнение через JavaScript
                  el.addEventListener('focus', () => {
                    el.setAttribute('readonly', 'readonly');
                    setTimeout(() => {
                      el.removeAttribute('readonly');
                    }, 100);
                  }, { once: true });
                }
              }}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => {
                // Трюк: делаем readonly на момент фокуса, потом убираем
                const target = e.target as HTMLInputElement;
                target.setAttribute('readonly', 'readonly');
                setTimeout(() => {
                  target.removeAttribute('readonly');
                }, 100);
              }}
              onInput={(e) => {
                // Дополнительная защита при вводе
                const target = e.target as HTMLInputElement;
                target.setAttribute('autocomplete', 'off');
              }}
              disabled={disabled}
              readOnly={isReadOnly}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              autoSave="off"
              spellCheck="false"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-dashlane-ignore="true"
              data-lastpass-ignore="true"
              data-bitwarden-ignore="true"
              data-form-type="other"
              data-autocomplete="off"
              data-ignore-autofill="true"
              data-pin-input="true"
              data-no-autofill="true"
              name={`pin-digit-${index}`}
              id={`pinCode${index}`}
              aria-label={`PIN код, цифра ${index + 1}`}
              className={cn(
                'h-14 w-14 rounded-lg border-2 text-center text-2xl font-bold',
                'transition-all duration-200 focus:outline-none',
                '[&::-webkit-credentials-auto-fill-button]:hidden',
                '[&::-webkit-strong-password-auto-fill-button]:hidden',
                '[&::-webkit-contacts-auto-fill-button]:hidden',
                '[&::-webkit-contacts-auto-fill-button]:hidden',
                {
                  // Активное поле (первое пустое) - черная рамка
                  'border-black bg-white text-gray-900 dark:bg-white dark:border-black': isActive,
                  // Заполненное поле - серая рамка
                  'border-gray-300 bg-white text-gray-900 dark:bg-white dark:border-gray-300': isFilled,
                  // Пустое неактивное поле - серая рамка
                  'border-gray-300 bg-white text-gray-900 dark:bg-white dark:border-gray-300': isEmpty,
                  // Ошибка - красная рамка
                  'border-red-500 bg-red-50 text-red-600 dark:bg-red-50 dark:border-red-500': error,
                  // Отключенное поле
                  'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-200 dark:border-gray-300': disabled,
                }
              )}
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                caretColor: 'inherit',
              }}
            />
          );
        })}
      </div>
      {error && (
        <p className="mt-3 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}


