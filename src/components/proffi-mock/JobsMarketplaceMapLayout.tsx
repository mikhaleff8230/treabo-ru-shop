import { List, Map, Maximize2, Minimize2 } from 'lucide-react';
import type { ReactNode } from 'react';
import TreaboTasksMap, {
  buildTaskMapPoints,
  type TreaboMapBounds,
} from '@/components/treabo/TreaboTasksMap';
import type { TreaboTask } from '@/data/treabo';

type JobsMarketplaceMapLayoutProps = {
  tasks: TreaboTask[];
  mapFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExitMap: () => void;
  highlightedTaskId?: string | null;
  onTaskMapClick: (task: TreaboTask) => void;
  onBoundsChange: (bounds: TreaboMapBounds) => void;
  viewOnMapLabel: string;
  mapFullWidthLabel: string;
  backToListLabel: string;
  tasksInViewLabel: string;
  emptyLabel: string;
  visibleTasksCount: number;
  listContent: ReactNode;
};

export default function JobsMarketplaceMapLayout({
  tasks,
  mapFullscreen,
  onToggleFullscreen,
  onExitMap,
  highlightedTaskId,
  onTaskMapClick,
  onBoundsChange,
  viewOnMapLabel,
  mapFullWidthLabel,
  backToListLabel,
  tasksInViewLabel,
  emptyLabel,
  visibleTasksCount,
  listContent,
}: JobsMarketplaceMapLayoutProps) {
  const pointsCount = buildTaskMapPoints(tasks).length;

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onExitMap}
        className="inline-flex items-center gap-2 rounded-full border border-[#E7E9EC] bg-white px-4 py-2 text-xs font-semibold text-[#232323] transition hover:bg-[#FAFAFA]"
      >
        <List className="h-4 w-4" />
        {backToListLabel}
      </button>
      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-pressed={mapFullscreen}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
          mapFullscreen
            ? 'border-[#232323] bg-[#232323] text-white'
            : 'border-[#E7E9EC] bg-white text-[#232323] hover:bg-[#FAFAFA]'
        }`}
      >
        {mapFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        {mapFullWidthLabel}
      </button>
    </div>
  );

  const listPanel = (
    <aside
      className={`order-2 flex min-h-0 flex-col border-[#E7E9EC] bg-white md:order-1 ${
        mapFullscreen
          ? 'h-full w-full shrink-0 border-r md:w-[min(100%,320px)] lg:w-[360px]'
          : 'max-h-[42vh] w-full shrink-0 border-t md:max-h-none md:w-[min(100%,320px)] md:border-b-0 md:border-r md:border-t-0 lg:w-[360px]'
      }`}
    >
      <div className="shrink-0 border-b border-[#E7E9EC] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#232323]">
          <Map className="h-4 w-4" />
          {viewOnMapLabel}
        </div>
        <div className="mt-1 text-xs text-[#777D88]">
          {tasksInViewLabel}
          {` · ${visibleTasksCount}`}
          {pointsCount ? ` из ${pointsCount} на карте` : ''}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
        {listContent || (
          <div className="rounded-[20px] border border-[#E7E9EC] bg-[#F7F7F4] p-6 text-center text-sm text-[#777D88]">
            {emptyLabel}
          </div>
        )}
      </div>
    </aside>
  );

  const mapPanel = (
    <div
      className={`order-1 min-h-0 min-w-0 flex-1 md:order-2 ${
        mapFullscreen ? 'h-full' : 'h-[min(52vh,520px)] md:h-[min(68vh,720px)]'
      }`}
    >
      <TreaboTasksMap
        tasks={tasks}
        heightClassName="h-full min-h-0"
        className="h-full rounded-none border-0 md:rounded-[24px] md:border md:border-[#E7E9EC]"
        highlightedTaskId={highlightedTaskId}
        onTaskClick={onTaskMapClick}
        navigateOnClick={false}
        onBoundsChange={onBoundsChange}
        preserveViewport
      />
    </div>
  );

  if (mapFullscreen) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col overflow-hidden bg-[#F7F7F4]">
        <div className="shrink-0 border-b border-[#E7E9EC] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          {controls}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          {mapPanel}
          {listPanel}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">{controls}</div>
      <div className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#E7E9EC] bg-white shadow-[0_8px_24px_rgba(25,31,42,0.045)] md:min-h-[min(68vh,720px)] md:flex-row">
        {mapPanel}
        {listPanel}
      </div>
    </>
  );
}
