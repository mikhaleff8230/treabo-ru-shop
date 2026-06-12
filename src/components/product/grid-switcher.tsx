import { atom, useAtom } from 'jotai';
import Button from '@/components/ui/button';
import { CompactGridIcon } from '@/components/icons/compact-grid-icon';
import { NormalGridIcon } from '@/components/icons/normal-grid-icon';

const gridCompactViewAtom = atom(true);
const viewModeAtom = atom<'grid' | 'list'>('grid');

export function useGridSwitcher() {
  const [isGridCompact, setIsGridCompact] = useAtom(gridCompactViewAtom);
  return {
    isGridCompact,
    setIsGridCompact,
  };
}

export function useViewMode() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  return {
    viewMode,
    setViewMode,
  };
}

export default function GridSwitcher() {
  const { isGridCompact, setIsGridCompact } = useGridSwitcher();
  return (
    <Button
      onClick={() => setIsGridCompact(!isGridCompact)}
      variant="icon"
      aria-label="Layout"
      className="hidden 2xl:flex 2xl:w-5"
    >
      {isGridCompact ? (
        <CompactGridIcon className="h-[18px] w-[18px]" />
      ) : (
        <NormalGridIcon className="h-[16px] w-[16px]" />
      )}
    </Button>
  );
}

