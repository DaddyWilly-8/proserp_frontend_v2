import { useQuery } from '@tanstack/react-query';
import { unitGroupServices } from './bio-production-services';
import { BioOption } from './BioSelect';
import { BioUnitGroup } from './types';

/** A farm's groups, each in order after its parent, for choosing one or filtering by one. */
export const useUnitGroups = (farmId?: number | string | null, status?: 'active') =>
  useQuery<{ data: BioUnitGroup[] }>({
    queryKey: ['bioUnitGroupOptions', farmId, status],
    queryFn: () => unitGroupServices.getList({ farm_id: farmId, status, limit: 1000 }),
    enabled: !!farmId,
  });

/** The groups as choices, labelled by their full path ("Line 3 › Group 1"). A group's own branch can be left out (for choosing its parent). */
export const unitGroupOptions = (groups: BioUnitGroup[] = [], leaveOutBranchOf?: number): BioOption[] => {
  const branch = new Set<number>();
  if (leaveOutBranchOf) {
    branch.add(leaveOutBranchOf);
    let grew = true;
    while (grew) {
      grew = false;
      groups.forEach((group) => {
        if (group.parent_id && branch.has(group.parent_id) && !branch.has(group.id)) {
          branch.add(group.id);
          grew = true;
        }
      });
    }
  }

  return groups.filter((group) => !branch.has(group.id)).map((group) => ({ value: group.id, label: group.path }));
};
