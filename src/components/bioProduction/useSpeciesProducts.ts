import { useQuery } from '@tanstack/react-query';
import { speciesTemplateServices } from './bio-production-services';
import { BioSpeciesTemplate } from './types';

/**
 * The products a species yields, for the harvest and produce pickers to offer. Undefined when the template
 * lists none (any product may be picked); the server holds the same rule.
 */
export const useSpeciesProducts = (templateId?: number | null) => {
  const { data } = useQuery<BioSpeciesTemplate>({
    queryKey: ['bioSpeciesTemplate', templateId, 'products'],
    queryFn: () => speciesTemplateServices.get(templateId!),
    enabled: !!templateId,
  });

  return data?.products?.length ? data.products : undefined;
};
