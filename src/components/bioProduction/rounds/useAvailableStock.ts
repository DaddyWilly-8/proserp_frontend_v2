import { useQuery } from '@tanstack/react-query';
import productServices from '@/components/productAndServices/products/productServices';

interface StockQuery {
  productId?: number | null;
  storeId?: number | null;
  costCenterId?: number | null;
  unitId?: number | string | null;
  /** 'YYYY-MM-DD HH:mm:ss': stock is read as at that moment, which is how the server issues it. */
  date?: string;
}

/**
 * What the store holds of a product for a cost center, as the sales form reads it (the same product
 * balances endpoint). `available` is the balance as at the date; `usable` is what may actually be
 * issued on that date: the lower of that and today's balance, because a backdated issue must not
 * leave a later balance negative. Both are in the chosen unit of measure, and null until known.
 */
export const useAvailableStock = ({ productId, storeId, costCenterId, unitId, date }: StockQuery) => {
  const enabled = !!productId && !!storeId && !!costCenterId && !!date;

  const { data, isFetching } = useQuery<any>({
    queryKey: ['bioStock', productId, storeId, costCenterId, unitId, date],
    queryFn: () =>
      productServices.getStoreBalances({
        as_at: date,
        productId,
        storeIds: [storeId],
        costCenterId,
        measurement_unit_id: unitId || undefined,
      }),
    enabled,
  });

  const row = data?.stock_balances?.find((balance: any) => balance.store_id === storeId && balance.cost_center_id === costCenterId);
  const available = enabled && data ? (row ? Number(row.balance) : 0) : null;
  const current = row?.current_balance != null ? Number(row.current_balance) : available;
  const usable = available == null ? null : Math.max(0, Math.min(available, current ?? available));

  return { available, usable, isFetching, enabled };
};
