import { X } from 'lucide-react';
import type { TreaboTask } from '@/data/treabo';
import TreaboTasksMap, { buildTaskMapPoints } from '@/components/treabo/TreaboTasksMap';

type TreaboTasksMapModalProps = {
  open: boolean;
  onClose: () => void;
  tasks: TreaboTask[];
  onTaskClick?: (task: TreaboTask) => void;
  highlightedTaskId?: string | null;
};

export default function TreaboTasksMapModal({
  open,
  onClose,
  tasks,
  onTaskClick,
  highlightedTaskId,
}: TreaboTasksMapModalProps) {
  if (!open) return null;

  const points = buildTaskMapPoints(tasks);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Закрыть" onClick={onClose} />
      <div className="relative z-10 flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:h-[80vh] sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <div className="text-sm font-bold text-[#7d849b]">Карта заданий</div>
            <h2 className="text-xl font-black text-[#232323]">
              {points.length ? `${points.length} точек на карте` : 'Москва и Россия'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 p-1">
          <TreaboTasksMap
            tasks={tasks}
            heightClassName="h-full min-h-[420px]"
            highlightedTaskId={highlightedTaskId}
            onTaskClick={(task) => {
              onTaskClick?.(task);
              onClose();
            }}
            navigateOnClick={!onTaskClick}
            className="rounded-[20px] border-0"
          />
        </div>
      </div>
    </div>
  );
}
