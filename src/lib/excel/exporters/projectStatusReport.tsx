import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

const AMT_FMT = '#,##0.00';
const PCT_FMT = '0.00"%"';

interface ProjectStatusReportRow {
  projectNo?: string;
  name?: string;
  client?: string;
  category?: string;
  contract_value?: number;
  site_implementation_percentage?: number;
  time_elapsed_percentage?: number | null;
  progressive_revenue?: number;
  progressive_revenue_percentage?: number | null;
  billed_revenue?: number;
  billed_revenue_percentage?: number | null;
  unbilled_revenue?: number;
  unbilled_revenue_percentage?: number | null;
  received_payments?: number;
  received_payments_percentage?: number | null;
  certified_pending_payment?: number;
  certified_pending_payment_percentage?: number | null;
  outstanding_liabilities?: number;
  remarks?: string | null;
}

interface ProjectStatusReportTotals {
  contract_value?: number;
  progressive_revenue?: number;
  billed_revenue?: number;
  unbilled_revenue?: number;
  received_payments?: number;
  certified_pending_payment?: number;
  outstanding_liabilities?: number;
}

// Columns A-T, matching the Project Engineer's manual "PROJECT REPORT STATUS" spreadsheet's
// PROJECTS sheet - see ProjectStatusReportController::index() for where each figure comes from.
const COLUMNS = [
  { header: 'S/N', width: 6 },
  { header: 'Project No.', width: 14 },
  { header: 'Project Name', width: 40 },
  { header: 'Client', width: 20 },
  { header: 'Category', width: 16 },
  { header: 'Contract Value', width: 18, fmt: AMT_FMT },
  { header: 'Site Implementation %', width: 14, fmt: PCT_FMT },
  { header: 'Time Elapsed %', width: 12, fmt: PCT_FMT },
  { header: 'Progressive Revenue', width: 18, fmt: AMT_FMT },
  { header: '%', width: 9, fmt: PCT_FMT },
  { header: 'Billed Revenue', width: 18, fmt: AMT_FMT },
  { header: '%', width: 9, fmt: PCT_FMT },
  { header: 'Unbilled Revenue (WIP)', width: 18, fmt: AMT_FMT },
  { header: '%', width: 9, fmt: PCT_FMT },
  { header: 'Received Payments', width: 18, fmt: AMT_FMT },
  { header: '%', width: 9, fmt: PCT_FMT },
  { header: 'Certified Pending Payment', width: 18, fmt: AMT_FMT },
  { header: '%', width: 9, fmt: PCT_FMT },
  { header: 'Outstanding Liabilities', width: 18, fmt: AMT_FMT },
  { header: 'Remarks', width: 30 },
];

const colLetter = (index: number) => String.fromCharCode(65 + index);

export async function exportProjectStatusReportExcel(exportedData: any) {
  try {
    const { authOrganization, rows, totals } = exportedData as {
      authOrganization: any;
      rows: ProjectStatusReportRow[];
      totals: ProjectStatusReportTotals;
    };

    const orgName = authOrganization?.organization?.name || 'Organization';

    const wb = createWorkbook();
    const ws = wb.addWorksheet('Project Status Report');

    ws.columns = COLUMNS.map((c) => ({ width: c.width }));

    const lastColLetter = colLetter(COLUMNS.length - 1);

    ws.addRow([orgName]);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.mergeCells(`A1:${lastColLetter}1`);

    ws.addRow(['Project Status Report']);
    ws.getCell('A2').font = { bold: true, size: 14 };
    ws.mergeCells(`A2:${lastColLetter}2`);

    ws.addRow([`As at: ${readableDate(undefined, true)}`]);
    ws.mergeCells(`A3:${lastColLetter}3`);

    ws.addRow([]);

    const headerRowNum = (ws.lastRow?.number ?? 0) + 1;
    ws.getRow(headerRowNum).height = 30;
    COLUMNS.forEach((col, i) => {
      const cell = ws.getCell(`${colLetter(i)}${headerRowNum}`);
      cell.value = col.header;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    (rows || []).forEach((row, index) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      const values = [
        index + 1,
        row.projectNo ?? '',
        row.name ?? '',
        row.client ?? '',
        row.category ?? '',
        row.contract_value ?? 0,
        row.site_implementation_percentage ?? 0,
        row.time_elapsed_percentage ?? null,
        row.progressive_revenue ?? 0,
        row.progressive_revenue_percentage ?? null,
        row.billed_revenue ?? 0,
        row.billed_revenue_percentage ?? null,
        row.unbilled_revenue ?? 0,
        row.unbilled_revenue_percentage ?? null,
        row.received_payments ?? 0,
        row.received_payments_percentage ?? null,
        row.certified_pending_payment ?? 0,
        row.certified_pending_payment_percentage ?? null,
        row.outstanding_liabilities ?? 0,
        row.remarks ?? '',
      ];
      ws.addRow(values);

      COLUMNS.forEach((col, i) => {
        const cell = ws.getCell(`${colLetter(i)}${rowNum}`);
        if (col.fmt) {
          applyCellStyle(cell, CELL_STYLES.dataRowNumeric);
          cell.numFmt = col.fmt;
        } else {
          applyCellStyle(cell, CELL_STYLES.dataRowText);
        }
      });
    });

    const totalRowNum = (ws.lastRow?.number ?? 0) + 1;
    const totalValues = [
      '', '', 'TOTAL', '', '',
      totals?.contract_value ?? 0, '', '',
      totals?.progressive_revenue ?? 0, '',
      totals?.billed_revenue ?? 0, '',
      totals?.unbilled_revenue ?? 0, '',
      totals?.received_payments ?? 0, '',
      totals?.certified_pending_payment ?? 0, '',
      totals?.outstanding_liabilities ?? 0, '',
    ];
    ws.addRow(totalValues);
    COLUMNS.forEach((col, i) => {
      const cell = ws.getCell(`${colLetter(i)}${totalRowNum}`);
      applyCellStyle(cell, col.fmt ? CELL_STYLES.totalRowNumeric : CELL_STYLES.totalRowText);
      if (col.fmt) {
        cell.numFmt = col.fmt;
      }
    });

    return await wb.xlsx.writeBuffer();
  } catch (error: any) {
    console.error('Error exporting Project Status Report Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
