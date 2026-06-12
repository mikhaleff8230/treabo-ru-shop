import DynamicProductGrid from '@/components/product/dynamic-grid';

export default function SearchResults({ searchText }: { searchText: string }) {
  const filters = {
    name: searchText,
  };

  return (
    <DynamicProductGrid
      limit={45}
      filters={filters}
      showLoadMore={true}
    />
  );
}
