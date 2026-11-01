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
