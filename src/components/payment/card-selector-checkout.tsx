import React, { useState } from 'react';
import { useCards, useAddCards } from '@/data/card';
import { useModalAction } from '@/components/modal-views/context';
import { PaymentGateway } from '@/types';
import visaIcon from '@/assets/cards/visa.svg';
import mastercardIcon from '@/assets/cards/mastercard.svg';
import mirIcon from '@/assets/cards/mir.svg';
import jcbIcon from '@/assets/cards/jcb.svg';
import Image from '@/components/ui/image';

const CARD_ICONS: Record<string, any> = {
  visa: visaIcon,
  mastercard: mastercardIcon,
  mir: mirIcon,
  jcb: jcbIcon,
};

interface CardSelectorCheckoutProps {
  selectedCardId: string | null;
  onSelect: (cardId: string | null) => void;
  onAddCardSuccess?: () => void;
  onBindCardChange?: (bind: boolean) => void;
  bindCard?: boolean;
  isLoading?: boolean;
  onPay: () => void;
  payButtonText?: string;
  totalText?: string;
  discountText?: string;
  economyText?: string;
}

export const CardSelectorCheckout: React.FC<CardSelectorCheckoutProps> = ({
  selectedCardId,
  onSelect,
  onAddCardSuccess,
  onBindCardChange,
  bindCard = true,
  isLoading,
  onPay,
  payButtonText = 'Оплатить картой',
  totalText,
  discountText,
  economyText,
}) => {
  const { cards, isLoading: cardsLoading } = useCards();
  const { openModal } = useModalAction();
  const [bind, setBind] = useState(bindCard);

  const handleAddCard = () => {
    openModal('ADD_NEW_CARD_MODAL', {
      onSuccess: onAddCardSuccess,
    });
  };

  const handleBindChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBind(e.target.checked);
    onBindCardChange?.(e.target.checked);
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-xl border mb-6">
      <div className="mb-2 text-sm font-medium text-gray-700">Способ оплаты</div>
      <div className="flex items-center mb-4">
        <span className="inline-flex items-center px-3 py-2 border rounded bg-gray-50 text-gray-700">
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect width="20" height="20" rx="6" fill="#F3F4F6"/><path d="M5 10h10" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className="ml-2">Российская банковская карта</span>
        </span>
      </div>
      <div className="flex gap-4 mb-4">
        {/* Сохранённые карты */}
        {cards.map(card => (
          <button
            key={card.id}
            type="button"
            className={`flex-1 border rounded p-4 flex flex-col items-center justify-center transition-all ${selectedCardId === card.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}
            onClick={() => onSelect(card.id)}
          >
            <div className="flex items-center mb-2">
              <Image src={CARD_ICONS[card.network] || visaIcon} width={36} height={24} alt={card.network} />
              <span className="ml-2 text-lg font-semibold">**** {card.last4}</span>
            </div>
            {selectedCardId === card.id && (
              <span className="mt-1 text-blue-500 text-xs font-medium">Выбрано</span>
            )}
          </button>
        ))}
        {/* Новая карта */}
        <button
          type="button"
          className={`flex-1 border rounded p-4 flex flex-col items-center justify-center transition-all ${selectedCardId === null ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}
          onClick={() => { onSelect(null); handleAddCard(); }}
        >
          <div className="flex items-center mb-2">
            <Image src={visaIcon} width={32} height={20} alt="Visa" className="mx-1" />
            <Image src={mastercardIcon} width={32} height={20} alt="Mastercard" className="mx-1" />
            <Image src={mirIcon} width={32} height={20} alt="Mir" className="mx-1" />
            <Image src={jcbIcon} width={32} height={20} alt="JCB" className="mx-1" />
          </div>
          <span className="text-gray-600">Новая карта</span>
        </button>
      </div>
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="bind-card"
          checked={bind}
          onChange={handleBindChange}
          className="accent-blue-500 mr-2"
        />
        <label htmlFor="bind-card" className="text-sm text-blue-700 cursor-pointer select-none">
          Привязать карту для удобного пополнения баланса
        </label>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded px-6 py-2 transition-all disabled:opacity-60"
          onClick={onPay}
          disabled={isLoading || cardsLoading}
        >
          {payButtonText}
        </button>
        <div className="flex flex-col text-right text-sm">
          {totalText && <span>Итого <b>{totalText}</b></span>}
          {discountText && <span className="line-through text-gray-400">{discountText}</span>}
          {economyText && <span className="text-blue-600">Экономия {economyText}</span>}
        </div>
      </div>
    </div>
  );
};

export default CardSelectorCheckout; 