import { useRef, useState } from 'react';
import { useCards } from '@/data/card';
import visa from '@/assets/cards/visa.svg';
import mastercard from '@/assets/cards/mastercard.svg';
import jcb from '@/assets/cards/jcb.svg';
import mir from '@/assets/cards/mir.svg';
import tinkoff from '@/assets/cards/tinkoff.svg';
import sber from '@/assets/cards/sber.svg';
import alfa from '@/assets/cards/alfa.svg';
import pay from '@/assets/cards/pay.svg';

const CARD_STYLES: Record<string, { bg: string; logo: string; text: string }> = {
  visa: { bg: 'bg-blue-600', logo: visa, text: 'Visa' },
  mastercard: { bg: 'bg-neutral-900', logo: mastercard, text: 'MasterCard' },
  mir: { bg: 'bg-black', logo: mir, text: 'МИР' },
  tinkoff: { bg: 'bg-yellow-400', logo: tinkoff, text: 'Тинькофф' },
  sber: { bg: 'bg-green-400', logo: sber, text: 'Сбербанк' },
  alfa: { bg: 'bg-red-600', logo: alfa, text: 'Альфа-Банк' },
  pay: { bg: 'bg-black', logo: pay, text: 'Pay' },
  jcb: { bg: 'bg-green-700', logo: jcb, text: 'JCB' },
};

function getCardStyle(network: string) {
  const key = network?.toLowerCase();
  return CARD_STYLES[key] || { bg: 'bg-gray-200', logo: visa, text: network || 'Карта' };
}

export default function CardSelectorCheckout({ onSelect, onAddNew, onBindChange }: {
  onSelect?: (card: any) => void;
  onAddNew?: () => void;
  onBindChange?: (bind: boolean) => void;
}) {
  const { cards = [], isLoading } = useCards({ payment_gateway: 'tinkoff' });
  const [selected, setSelected] = useState<'new' | string>(cards[0]?.id || 'new');
  const [bind, setBind] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isLoading) return <div>Загрузка карт...</div>;

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -width : width, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Стрелки */}
      {cards.length > 2 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center border border-gray-200 transition-all duration-200 group hover:bg-[#F97316]"
            style={{ left: -20 }}
            aria-label="Скролл влево"
          >
            <span className="text-gray-600 group-hover:text-white transition-colors duration-200" style={{ fontSize: 20, fontWeight: 600 }}>{'←'}</span>
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center border border-gray-200 transition-all duration-200 group hover:bg-[#F97316]"
            style={{ right: -20 }}
            aria-label="Скролл вправо"
          >
            <span className="text-gray-600 group-hover:text-white transition-colors duration-200" style={{ fontSize: 20, fontWeight: 600 }}>{'→'}</span>
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto no-scrollbar py-2 px-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Новая карта */}
        <div
          onClick={() => { setSelected('new'); onAddNew?.(); }}
          className={`min-w-[170px] max-w-[170px] h-[100px] flex flex-col items-center justify-center border-2 ${selected === 'new' ? 'border-[#8B5CF6] bg-white shadow-lg' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'} rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-600">+</span>
            <span className="font-semibold text-base text-gray-700">Новой картой</span>
          </div>
          <span className="text-xs text-gray-500">Добавить карту</span>
        </div>
        {cards.map(card => {
          const style = getCardStyle(card.network);
          // Определяем индивидуальный фон и цвет для Visa и MasterCard
          let customBg = undefined;
          let customColor = undefined;
          if (card.network?.toLowerCase() === 'visa') {
            customBg = 'palegoldenrod';
            customColor = '#222';
          } else if (style.bg === 'bg-neutral-900') {
            customBg = '#222';
            customColor = '#fff';
          }
          return (
            <div
              key={card.id}
              onClick={() => { setSelected(card.id); onSelect?.(card); }}
              className={`min-w-[170px] max-w-[170px] h-[100px] flex flex-col justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${selected === card.id ? 'border-4 border-[#8B5CF6] shadow-xl scale-105' : 'border-2 border-gray-200 hover:shadow-lg hover:scale-102'} ${style.bg}`}
              style={{ background: customBg, color: customColor || (style.bg === 'bg-black' || style.bg === 'bg-neutral-900' ? '#fff' : '#222') }}
            >
              <div className="flex items-center gap-2">
                <img 
                  src={style.logo} 
                  alt={style.text} 
                  style={{ width: 32, height: 32 }} 
                  className="drop-shadow-sm"
                  onError={(e) => {
                    // Fallback для иконки если не загрузилась
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <span className="font-semibold text-sm" style={{ color: 'inherit' }}>{style.text}</span>
              </div>
              <div className="text-lg font-bold tracking-widest" style={{ color: 'inherit' }}>**** {card.last4}</div>
              <div className="text-xs opacity-80" style={{ color: 'inherit' }}>до {card.expires}</div>
            </div>
          );
        })}
      </div>
      <label className="flex items-center mt-3 text-sm cursor-pointer group">
        <input
          type="checkbox"
          checked={bind}
          onChange={e => { setBind(e.target.checked); onBindChange?.(e.target.checked); }}
          className="w-4 h-4 text-[#8B5CF6] bg-gray-100 border-gray-300 rounded focus:ring-[#8B5CF6] focus:ring-2 mr-3"
        />
        <span className="text-gray-700">
          <span className="text-[#8B5CF6] underline group-hover:text-[#7C3AED] transition-colors duration-200">Сохранить карту</span> для следующих покупок
        </span>
      </label>
    </div>
  );
} 