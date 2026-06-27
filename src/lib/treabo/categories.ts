import type { TreaboCategory } from '@/data/treabo';

export type TreaboCategorySearchParams = {
  q?: string | null;
  category_id?: string | null;
  city?: string | null;
};

export function categoryLabel(category: TreaboCategory) {
  return category.name_ru || category.slug || category.id;
}

export function buildCategoryIndex(categories: TreaboCategory[]) {
  const byKey = new Map<string, TreaboCategory>();

  for (const category of categories) {
    byKey.set(category.id, category);
    if (category.slug) byKey.set(category.slug, category);
    if (category.name_ru) byKey.set(category.name_ru.toLowerCase(), category);
  }

  return byKey;
}

export function searchCategories(categories: TreaboCategory[], query: string, limit = 8) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 1) return [];

  return categories
    .filter((category) => {
      const values = [category.id, category.slug || '', category.name_ru, category.name_ro || ''].map((value) =>
        value.toLowerCase(),
      );
      return values.some((value) => value.includes(needle));
    })
    .slice(0, limit);
}

export function resolveServiceLabels(services: string[] | undefined, categories: TreaboCategory[]) {
  if (!services?.length) return [];

  const index = buildCategoryIndex(categories);

  return services.map((service) => {
    const match = index.get(service) || index.get(service.toLowerCase());
    return match ? categoryLabel(match) : service;
  });
}

export function findCategoryById(categories: TreaboCategory[], categoryId?: string | null) {
  if (!categoryId) return null;
  return categories.find((category) => category.id === categoryId || category.slug === categoryId) || null;
}

export function buildMarketplaceSearchQuery(params: TreaboCategorySearchParams) {
  const search = new URLSearchParams();
  if (params.city?.trim()) search.set('city', params.city.trim());
  if (params.category_id?.trim()) search.set('category_id', params.category_id.trim());
  if (params.q?.trim()) search.set('q', params.q.trim());
  return search.toString();
}

export function flattenCategoryOptions(categories: TreaboCategory[]) {
  const parents = categories.filter((category) => !category.parent_id);
  const childrenByParent = new Map<string, TreaboCategory[]>();

  for (const category of categories) {
    if (!category.parent_id) continue;
    const list = childrenByParent.get(category.parent_id) || [];
    list.push(category);
    childrenByParent.set(category.parent_id, list);
  }

  const options: { id: string; label: string; parentLabel?: string }[] = [];

  for (const parent of parents) {
    const children = childrenByParent.get(parent.id) || [];
    if (children.length) {
      for (const child of children) {
        options.push({
          id: child.id,
          label: categoryLabel(child),
          parentLabel: categoryLabel(parent),
        });
      }
    } else {
      options.push({ id: parent.id, label: categoryLabel(parent) });
    }
  }

  for (const category of categories) {
    if (!options.some((option) => option.id === category.id)) {
      options.push({ id: category.id, label: categoryLabel(category) });
    }
  }

  return options;
}
