import { ChevronRight, ExternalLink } from 'lucide-react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';

const groups = [
  { title: 'Поддержка', items: ['Помощь', 'Справка'] },
  { title: 'Приложение', items: ['Написать отзыв', 'О приложении', 'Приложение для клиентов'] },
  { title: 'Другое', items: ['Treabo 25'] },
];

export default function TreaboSupportPage() {
  return (
    <TreaboAccountShell title="Поддержка">
      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.title} className="rounded-[30px] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-black">{group.title}</h2>
            <div className="divide-y divide-zinc-100">
              {group.items.map((item, index) => (
                <button key={item} className="flex w-full items-center justify-between py-4 text-left font-bold">
                  {item}
                  {index % 2 === 0 ? <ChevronRight className="h-5 w-5 text-[#7d849b]" /> : <ExternalLink className="h-4 w-4 text-[#7d849b]" />}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </TreaboAccountShell>
  );
}
