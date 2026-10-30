import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';
import { formatDate } from '@/components/accounts/bankReconciliation/reconciliation/date-format';
import {
  balanceRows,
  describeEntryMatch,
  describeLineMatch,
  FLAG_LABELS,
  FLAG_ORDER,
  statementBalancesText,
  statementStatusText,
  VIEW_LABELS,
} from '@/components/accounts/reports/reconciliationStatement/reconciliation-statement-helpers';

const AMOUNT_FORMAT = '#,##0.00';

// Writes a titled block (organization / report / period) at the top of a sheet
// and returns the next free row.
function writeSheetHeader(ws: any, organizationName: string, title: string, subtitle: string, lastCol: number) {
  ws.addRow([organizationName]);
  ws.addRow([title]);
  ws.addRow([subtitle]);
  ws.getCell('A1').font = { bold: true, size: 12 };
  ws.getCell('A2').font = { bold: true, size: 12 };
  ws.getCell('A3').font = { size: 10 };
  ws.addRow([]);
  return lastCol;
}

function writeTable(ws: any, headers: string[], rows: any[][], amountCols: number[], flagCol: number) {
  const headerRow = ws.addRow(headers);
  headerRow.height = 22;
  headers.forEach((_, i) => applyCellStyle(headerRow.getCell(i + 1), CELL_STYLES.tableHeader));

  rows.forEach((values) => {
    const row = ws.addRow(values);
    values.forEach((_, i) => {
      const cell = row.getCell(i + 1);
      const isAmount = amountCols.includes(i + 1);
      applyCellStyle(cell, isAmount ? CELL_STYLES.dataRowNumeric : CELL_STYLES.dataRowText);
      if (isAmount) cell.numFmt = AMOUNT_FORMAT;
      cell.alignment = { ...(cell.alignment || {}), vertical: 'top', wrapText: true };
    });
    // Colour the flag so the reconciled / unreconciled split reads at a glance.
    const flagCell = row.getCell(flagCol);
    const colour = { Reconciled: 'FF1B7A3D', Unreconciled: 'FFC62828', 'Partly matched': 'FFB26A00', Outstanding: 'FF1565C0', Ignored: 'FF666666' }[
      String(flagCell.value)
    ];
    if (colour) flagCell.font = { ...(flagCell.font || {}), bold: true, color: { argb: colour } };
  });
}

export async function exportReconciliationStatementToExcel(exportedData: any) {
  try {
    const { authOrganization, reportData, user } = exportedData;
    const organizationName = authOrganization?.organization?.name ?? '';
    const accountName = [reportData.bank_account?.name, reportData.bank_account?.bank].filter(Boolean).join(' — ');
    const period = `${accountName} · ${formatDate(reportData.from)} to ${formatDate(reportData.to)} · ${VIEW_LABELS[reportData.view] ?? ''}`;
    const printed = `Printed by ${user?.name ?? ''} on ${formatDate(new Date().toISOString())}`;

    const wb = createWorkbook();

    // ---- Summary -----------------------------------------------------
    const summary = wb.addWorksheet('Summary');
    summary.columns = [{ width: 28 }, ...FLAG_ORDER.map(() => ({ width: 22 }))];
    writeSheetHeader(summary, organizationName, 'Reconciliation Statement', period, 6);
    summary.addRow([printed]);
    summary.addRow([]);

    summary.addRow(['Statements covered']).font = { bold: true };
    if (!reportData.statements?.length) summary.addRow(['No bank statement overlaps this period.']);
    (reportData.statements || []).forEach((s: any) => {
      summary.addRow([statementStatusText(s)]);
      summary.addRow([statementBalancesText(s)]).font = { size: 9, color: { argb: 'FF666666' } };
    });
    summary.addRow([]);

    // Opening / closing balances: the bank's figure against the books'.
    const balHeader = summary.addRow(['Balances', 'Bank', 'Books', 'Difference']);
    balHeader.height = 22;
    balHeader.eachCell((cell: any) => applyCellStyle(cell, CELL_STYLES.tableHeader));
    balanceRows(reportData.balances).forEach((row) => {
      const r = summary.addRow([row.label, row.bank ?? '—', row.books ?? '—', row.difference ?? '—']);
      r.eachCell((cell: any, col: number) => {
        applyCellStyle(cell, col === 1 ? CELL_STYLES.dataRowText : CELL_STYLES.dataRowNumeric);
        if (col > 1) cell.numFmt = AMOUNT_FORMAT;
      });
    });
    summary.addRow([]);

    const headerRow = summary.addRow(['Whole period', ...FLAG_ORDER.map((f) => FLAG_LABELS[f])]);
    headerRow.height = 22;
    headerRow.eachCell((cell: any) => applyCellStyle(cell, CELL_STYLES.tableHeader));
    (
      [
        ['Bank statement lines — count', 'lines', 'count'],
        ['Bank statement lines — amount', 'lines', 'amount'],
        ['Book entries — count', 'entries', 'count'],
        ['Book entries — amount', 'entries', 'amount'],
      ] as const
    ).forEach(([label, side, field]) => {
      const row = summary.addRow([label, ...FLAG_ORDER.map((f) => reportData.totals?.[side]?.[f]?.[field] ?? 0)]);
      row.eachCell((cell: any, col: number) => {
        applyCellStyle(cell, col === 1 ? CELL_STYLES.dataRowText : CELL_STYLES.dataRowNumeric);
        if (col > 1 && field === 'amount') cell.numFmt = AMOUNT_FORMAT;
      });
    });

    // ---- Bank statement lines -------------------------------------------
    const lines = wb.addWorksheet('Bank Lines');
    lines.columns = [{ width: 12 }, { width: 50 }, { width: 18 }, { width: 16 }, { width: 60 }];
    writeSheetHeader(lines, organizationName, 'Bank statement lines', period, 5);
    writeTable(
      lines,
      ['Date', 'Description', 'Amount', 'Status', 'Matched to'],
      (reportData.lines || []).map((l: any) => [
        formatDate(l.line_date),
        l.description,
        l.amount,
        FLAG_LABELS[l.flag] ?? l.flag,
        (l.matches || []).map(describeLineMatch).join('\n'),
      ]),
      [3],
      4
    );

    // ---- Book entries -----------------------------------------------------
    const entries = wb.addWorksheet('Book Entries');
    entries.columns = [{ width: 12 }, { width: 16 }, { width: 50 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 50 }];
    writeSheetHeader(entries, organizationName, 'Book entries', period, 7);
    writeTable(
      entries,
      ['Date', 'Voucher', 'Description', 'Amount', 'Status', 'Not yet matched', 'Matched lines'],
      (reportData.entries || []).map((e: any) => [
        formatDate(e.journal_date),
        e.voucher_no,
        [e.description, e.counterparty].filter(Boolean).join(' — '),
        e.amount,
        FLAG_LABELS[e.flag] ?? e.flag,
        e.flag === 'reconciled' ? 0 : e.remaining_amount,
        (e.lines || []).map(describeEntryMatch).join('\n'),
      ]),
      [4, 6],
      5
    );

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Excel:', e);
    throw new Error(e?.message || 'Excel export failed during workbook generation');
  }
}
