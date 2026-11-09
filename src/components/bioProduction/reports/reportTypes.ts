export type ReportId = 'group-cost' | 'batch-performance' | 'mortality' | 'feed' | 'harvest-output' | 'feed-projection';
export type ColumnType = 'text' | 'integer' | 'decimal' | 'money' | 'percent';

export interface ReportColumn {
  key: string;
  label: string;
  type: ColumnType;
}

/** What the server returns for every report: one shape, read by the screen, the PDF and the Excel file. */
export interface ReportTable {
  title: string;
  filters: Record<string, string>;
  columns: ReportColumn[];
  rows: Record<string, any>[];
  totals: Record<string, any> | null;
  notes: string[];
}

export interface ReportFilters {
  farm_id: number | string;
  from: string;
  to: string;
  group_id?: number | string;
  species_template_id?: number | string;
  status?: string;
  group_by?: string;
  days?: string;
}

/** Which of the optional filters a report offers, and the groupings it can be read by. */
export interface ReportDefinition {
  id: ReportId;
  filters: ('group' | 'species' | 'status')[];
  groupBy?: string[];
  /** Looks ahead from today for a chosen period, so it has no From and To. */
  period?: boolean;
}

export const REPORTS: ReportDefinition[] = [
  { id: 'group-cost', filters: [] },
  { id: 'batch-performance', filters: ['group', 'species', 'status'] },
  { id: 'mortality', filters: ['group'], groupBy: ['batch', 'group', 'unit', 'stage', 'cause', 'month'] },
  { id: 'feed', filters: ['group'], groupBy: ['product', 'group', 'unit', 'batch', 'month'] },
  { id: 'harvest-output', filters: ['group'], groupBy: ['month', 'batch', 'group', 'unit', 'product'] },
  { id: 'feed-projection', filters: ['group', 'species'], groupBy: ['batch', 'stage', 'product'], period: true },
];
