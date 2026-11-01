import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface PagedBatchList<T> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
  [extra: string]: any;
}

/**
 * One page at a time of a batch's inputs, costs or mortality, newest first from the server. The query
 * key starts with `name` and the batch id so a batch action can refresh every page of the list.
 */
export function usePagedBatchList<T>(
  batchId: number,
  name: string,
  fetcher: (batchId: number, params: Record<string, unknown>) => Promise<PagedBatchList<T>>,
  filters: Record<string, unknown> = {}
) {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const { data } = useQuery<PagedBatchList<T>>({
    queryKey: [name, batchId, { ...filters, page, limit }],
    queryFn: () => fetcher(batchId, { ...filters, page: page + 1, limit }),
    placeholderData: (previous) => previous,
  });

  // Removing the last row of a page leaves it empty: step back one.
  useEffect(() => {
    if (data && data.data.length === 0 && page > 0) setPage(page - 1);
  }, [data, page]);

  return {
    rows: data?.data ?? [],
    total: data?.total ?? 0,
    /** The whole response, for the totals that ride along with a page. */
    response: data,
    page,
    limit,
    setPage,
    setLimit: (next: number) => {
      setLimit(next);
      setPage(0);
    },
  };
}
