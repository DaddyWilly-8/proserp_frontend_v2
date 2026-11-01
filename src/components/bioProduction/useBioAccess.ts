import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';

/** The four permissions of each master, which the list pages, their buttons and the menu read. */
export const BIO_MASTERS = {
  farms: [PERMISSIONS.BIO_FARMS_READ, PERMISSIONS.BIO_FARMS_CREATE, PERMISSIONS.BIO_FARMS_EDIT, PERMISSIONS.BIO_FARMS_DELETE],
  productionUnits: [PERMISSIONS.BIO_PRODUCTION_UNITS_READ, PERMISSIONS.BIO_PRODUCTION_UNITS_CREATE, PERMISSIONS.BIO_PRODUCTION_UNITS_EDIT, PERMISSIONS.BIO_PRODUCTION_UNITS_DELETE],
  speciesTemplates: [PERMISSIONS.BIO_SPECIES_TEMPLATES_READ, PERMISSIONS.BIO_SPECIES_TEMPLATES_CREATE, PERMISSIONS.BIO_SPECIES_TEMPLATES_EDIT, PERMISSIONS.BIO_SPECIES_TEMPLATES_DELETE],
  measurementParameters: [PERMISSIONS.BIO_MEASUREMENT_PARAMETERS_READ, PERMISSIONS.BIO_MEASUREMENT_PARAMETERS_CREATE, PERMISSIONS.BIO_MEASUREMENT_PARAMETERS_EDIT, PERMISSIONS.BIO_MEASUREMENT_PARAMETERS_DELETE],
} as const;

export type BioMaster = keyof typeof BIO_MASTERS;

/** Create / edit / delete per master: the order the four lists above are written in. */
const MASTER_ACTIONS = { create: 1, edit: 2, delete: 3 } as const;

/** The kinds of daily record, and the permission that acts on each (the same split as the server's). */
export type BioRecordKind = 'feeding' | 'mortality' | 'weighing' | 'cost' | 'harvest' | 'produce' | 'measurement';

const recordPermissions = (kind: BioRecordKind) => {
  if (kind === 'cost') return { create: PERMISSIONS.BIO_RECORDS_COST, edit: PERMISSIONS.BIO_RECORDS_COST, delete: PERMISSIONS.BIO_RECORDS_COST };
  if (kind === 'harvest' || kind === 'produce') return { create: PERMISSIONS.BIO_RECORDS_HARVEST, edit: PERMISSIONS.BIO_RECORDS_HARVEST, delete: PERMISSIONS.BIO_RECORDS_HARVEST };

  return { create: PERMISSIONS.BIO_RECORDS_CREATE, edit: PERMISSIONS.BIO_RECORDS_EDIT, delete: PERMISSIONS.BIO_RECORDS_DELETE };
};

/**
 * What the signed-in user may do in Bio Production. The server decides in the end; this keeps the menu,
 * the pages and the buttons from offering what would only be refused.
 */
export const useBioAccess = () => {
  const { checkOrganizationPermission } = useJumboAuth();
  const has = (...permissions: string[]) => checkOrganizationPermission(permissions);

  return {
    dashboard: has(PERMISSIONS.BIO_DASHBOARD_READ),
    /** Any permission of the module at all. */
    any: Object.values(PERMISSIONS).some((name) => name.startsWith('Bio') && has(name)),
    master: (master: BioMaster) => ({
      read: has(...BIO_MASTERS[master]),
      create: has(BIO_MASTERS[master][MASTER_ACTIONS.create]),
      edit: has(BIO_MASTERS[master][MASTER_ACTIONS.edit]),
      delete: has(BIO_MASTERS[master][MASTER_ACTIONS.delete]),
    }),
    batches: {
      read: has(PERMISSIONS.BIO_BATCHES_READ),
      create: has(PERMISSIONS.BIO_BATCHES_CREATE),
      delete: has(PERMISSIONS.BIO_BATCHES_DELETE),
      record: has(PERMISSIONS.BIO_BATCHES_RECORD),
      manage: has(PERMISSIONS.BIO_BATCHES_MANAGE),
      writeOff: has(PERMISSIONS.BIO_BATCHES_WRITE_OFF),
      harvest: has(PERMISSIONS.BIO_BATCHES_HARVEST),
    },
    records: {
      read: has(PERMISSIONS.BIO_RECORDS_READ),
      /** Create, edit and delete for one kind of record. */
      kind: (kind: BioRecordKind) => {
        const needed = recordPermissions(kind);

        return { create: has(needed.create), edit: has(needed.edit), delete: has(needed.delete) };
      },
    },
  };
};
