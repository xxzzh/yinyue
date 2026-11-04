import { useState } from 'react';

// A query can also change through the shared header. Adjust before rendering
// results so every filter change starts on page one, without an effect render.
export function useCatalogPage(filters: readonly string[]) {
  const key = JSON.stringify(filters);
  const [selection, setSelection] = useState({ key, page: 1 });
  if (selection.key !== key) setSelection({ key, page: 1 });
  const page = selection.key === key ? selection.page : 1;
  return [page, (page: number) => setSelection({ key, page })] as const;
}
