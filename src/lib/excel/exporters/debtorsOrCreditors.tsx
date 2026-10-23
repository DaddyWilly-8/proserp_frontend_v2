import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import dayjs from 'dayjs';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

export async function exportDebtorsOrCreditorsToExcel(exportedData: any) {
  try {
    const { authOrganization, reportData, user } = exportedData;
    const reportPeriod = reportData.filters.from
      ? `Period: ${readableDate(reportData.filters.from, true)} to ${readableDate(reportData.filters.to, true)}`
      : `Up to: ${readableDate(reportData.filters.to, true)}`;

    const rootGroup = reportData.debtors || reportData.creditors;

    // create workbook and worksheet
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Debtors or Creditors Report');
    // The group's own row sits above its children (not a trailing
    // subtotal), so the collapse toggle needs to live on that row too —
    // summaryBelow false tells Excel the parent is above the detail it
    // controls, matching the Trial Balance / Income Statement exports.
    ws.properties.outlineProperties = {
      summaryBelow: false,
      summaryRight: false,
    };

    // column widths
    // Name, then Opening / Current / Closing x Debit / Credit / Net
    const baseColumns = [
      { width: 40 },
      ...Array.from({ length: 9 }, () => ({ width: 18 })),
    ];

    ws.columns = baseColumns;

    // header section
    ws.addRow([
      authOrganization.organization.name,
      ' ',
      ' ',
      ' ',
      ' ',
      reportData.debtors ? `Debtors Report` : `Creditors Report`,
    ]);
    ws.addRow([' ', ' ', ' ', ' ', ' ', reportPeriod]);

    ws.getCell('A1').font = {
      bold: true,
      size: 12,
    };
    ws.getCell('F1').font = {
      bold: true,
      size: 12,
    };
    ws.getCell('F2').font = {
      bold: true,
      size: 12,
    };

    ws.addRow([]);

    // info section
    if (reportData.filters?.cost_centers?.length > 0) {
      ws.mergeCells('A4:C4');
      ws.getCell('A4').value = 'Cost Centers ';
      ws.getCell('D4').value = 'Printed By';
      ws.getCell('F4').value = 'Printed On';
      let row = 5;
      let col = 65;
      for (let c = 0; c < reportData.filters.cost_centers.length; c++) {
        ws.getCell(`${String.fromCharCode(col)}${row}`).value =
          reportData.filters.cost_centers[c].name;

        ws.getCell(`${String.fromCharCode(col)}${row}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
        col++;

        if (col > 67) {
          col = 65;
          row++;
        }
      }

      ws.getCell('D5').value = user?.name;
      ws.getCell('F5').value = readableDate(undefined, true);
    } else {
      ws.addRow([
        'Cost Centers',
        ' ',
        ' ',
        'Printed By',
        ' ',
        'Printed On',
        ' ',
      ]);
      ws.getCell('A5').value = 'All';
      ws.getCell('D5').value = user?.name;
      ws.getCell('F5').value = readableDate(undefined, true);
    }

    for (let c = 65; c < 71; c++) {
      for (let r = 4; r < 6; r++) {
        ws.getCell(`${String.fromCharCode(c)}${r}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      }
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(c)}4`),
        CELL_STYLES.tableHeader
      );
    }

    ws.addRow([]);

    // HEADER ROWS (period group row + Debit/Credit/Net row) AND DATA ROWS
    const groupRow = (ws.lastRow?.number ?? 0) + 1;
    const subRow = groupRow + 1;
    const periods = ['Opening', 'Current', 'Closing'];
    const periodKeys = ['opening', 'current', 'closing'];
    const lastColumn = 10; // A (name) + 9 period columns

    ws.mergeCells(`A${groupRow}:A${subRow}`);
    ws.getCell(`A${groupRow}`).value = 'Name';
    // Each period heading carries the date range it covers on a second line
    const shortDate = (date: any) => dayjs(date).format('DD MMM YYYY');
    const { from, to } = reportData.filters;
    const ranges = [
      from ? `before ${shortDate(from)}` : '-',
      from ? `${shortDate(from)} - ${shortDate(to)}` : `up to ${shortDate(to)}`,
      `as at ${shortDate(to)}`,
    ];
    ws.getRow(groupRow).height = 32;
    periods.forEach((label, i) => {
      const start = 2 + i * 3;
      ws.mergeCells(groupRow, start, groupRow, start + 2);
      ws.getCell(groupRow, start).value = `${label}\n${ranges[i]}`;
      ['Debit', 'Credit', 'Net'].forEach((sub, j) => {
        ws.getCell(subRow, start + j).value = sub;
      });
    });

    const thinBorder = {
      top: { style: 'thin' as const, color: { argb: 'FF000000' } },
      bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
      left: { style: 'thin' as const, color: { argb: 'FF000000' } },
      right: { style: 'thin' as const, color: { argb: 'FF000000' } },
    };

    for (let r = groupRow; r <= subRow; r++) {
      for (let c = 1; c <= lastColumn; c++) {
        const cell = ws.getCell(r, c);
        cell.border = thinBorder;
        applyCellStyle(cell, CELL_STYLES.tableHeader);
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        };
      }
    }

    // Writes the nine Opening/Current/Closing cells for a node.
    const writePeriodCells = (row: number, node: any, bold: boolean) => {
      periodKeys.forEach((key, i) => {
        const start = 2 + i * 3;
        const figures = node[key];
        const values: (number | string)[] = [
          figures?.debit || '',
          figures?.credit || '',
          figures?.net?.amount
            ? `${figures.net.amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} ${figures.net.side}`
            : '',
        ];
        values.forEach((value, j) => {
          const cell = ws.getCell(row, start + j);
          cell.value = value;
          cell.numFmt = '#,##0.00;[Red]-#,##0.00';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.border = thinBorder;
          if (bold) cell.font = { bold: true };
        });
      });
    };

    // Writes one row per tree node (ledger-group or leaf ledger), group
    // rows first then that group's own subgroups/ledgers directly below —
    // same depth-first order as the backend's TrialBalanceGroupedExport —
    // and gives every row below the root an outlineLevel so Excel's native
    // group collapse arrows work like the on-screen collapsible tree.
    const writeGroupTreeRow = (
      node: any,
      level: number,
      isGroup: boolean
    ) => {
      const row = (ws.lastRow?.number ?? 0) + 1;

      const nameCell = ws.getCell(`A${row}`);
      nameCell.value = node.name;
      nameCell.alignment = { indent: level };
      nameCell.border = thinBorder;
      if (isGroup) nameCell.font = { bold: true };

      writePeriodCells(row, node, isGroup);

      if (level > 0) {
        ws.getRow(row).outlineLevel = level;
      }

      if (isGroup) {
        (node.children || []).forEach((child: any) =>
          writeGroupTreeRow(child, level + 1, true)
        );
        (node.ledgers || []).forEach((ledger: any) =>
          writeGroupTreeRow(ledger, level + 1, false)
        );
      }
    };

    if (rootGroup) {
      writeGroupTreeRow(rootGroup, 0, true);
    }

    // TOTAL ROW
    const totalRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getRow(totalRow).height = 20;
    ws.getCell(`A${totalRow}`).value = 'Total';
    writePeriodCells(totalRow, reportData.total ?? {}, true);
    for (let c = 1; c <= lastColumn; c++) {
      const cell = ws.getCell(totalRow, c);
      cell.border = thinBorder;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      if (c > 1) cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
