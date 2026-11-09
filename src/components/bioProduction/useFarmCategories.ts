import { useQuery } from '@tanstack/react-query';
import { farmServices } from './bio-production-services';
import { BioFarm } from './types';

/** The ids to offer in a product picker: the farm's chosen categories, or null when it has none (any product). */
export const categoryIds = (categories?: { id: number }[] | null): number[] | null => (categories?.length ? categories.map((category) => category.id) : null);

/**
 * The product categories a farm uses for inputs and for outputs, read from the farm so the pickers on a
 * batch only offer what belongs there. The server holds the same rule, so this only saves a wrong pick.
 */
export const useFarmCategories = (farmId?: number | null) => {
  const { data } = useQuery<BioFarm>({
    queryKey: ['bioFarm', farmId],
    queryFn: () => farmServices.get(farmId!),
    enabled: !!farmId,
  });

  return { input: categoryIds(data?.input_categories), output: categoryIds(data?.output_categories) };
};

/**
 * The input categories to offer where no single farm applies (a species template is used by every farm): the categories
 * the farms use for inputs, or null (any product) as soon as one farm has chosen none, since that farm is not restricted.
 */
export const useAllFarmInputCategories = () => {
  const { data } = useQuery<{ data: BioFarm[] }>({
    queryKey: ['bioFarmInputCategories'],
    queryFn: () => farmServices.getList({ limit: 500 }),
  });
  const farms = (data?.data ?? []).filter((farm) => farm.status !== 'inactive');
  if (!data || farms.length === 0 || farms.some((farm) => !farm.input_categories?.length)) return null;

  return Array.from(new Set(farms.flatMap((farm) => farm.input_categories!.map((category) => category.id))));
};
