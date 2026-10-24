import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import dayjs from 'dayjs';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

// Net-only view: drops nodes whose Opening, Current and Closing nets are all
// zero; a group stays if it, or anything beneath it, has a non-zero net.
// (Same rule as the on-screen/PDF pruning in reports/periodColumns.jsx, kept
// local so this server-side exporter doesn't import React components.)
const hasNetBalance = (node: any) =>
  ['opening', 'current', 'closing'].some((key) => node[key]?.net?.amount);
const pruneZeroNetList = (nodes: any[] = []): any[] =>
  nodes.flatMap((node) => {
    const children = pruneZeroNetList(node.children);
    const ledgers = pruneZeroNetList(node.ledgers);
    return hasNetBalance(node) || children.length || ledgers.length
      ? [{ ...node, children, ledgers }]
      : [];
  });
const pruneZeroNetTree = (root: any) => ({
  ...root,
  children: pruneZeroNetList(root.children),
  ledgers: pruneZeroNetList(root.ledgers),
});

export async function exportDebtorsOrCreditorsToExcel(exportedData: any) {
  try {
    const {
      authOrganization,
      reportData,
      user,
      netOnly = false,
      closingOnly = false,
    } = exportedData;
    // Net-only shows one column per period instead of Debit / Credit / Net
    const subCount = netOnly ? 1 : 3;
    // Closing-only shows just the Closing period instead of Opening / Current / Closing
    const periodCount = closingOnly ? 1 : 3;
    const reportPeriod = reportData.filters.from
      ? `Period: ${readableDate(reportData.filters.from, true)} to ${readableDate(reportData.filters.to, true)}`
      : `Up to: ${readableDate(reportData.filters.to, true)}`;

    const rawRootGroup = reportData.debtors || reportData.creditors;
    const rootGroup =
      rawRootGroup && netOnly ? pruneZeroNetTree(rawRootGroup) : rawRootGroup;

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
      ...Array.from({ length: periodCount * subCount }, () => ({ width: 18 })),
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
    // Net-only has no Debit/Credit/Net row: one heading row carries everything
    const subRow = netOnly ? groupRow : groupRow + 1;
    const allPeriods = ['Opening', 'Current', 'Closing'];
    const allKeys = ['opening', 'current', 'closing'];
    const periods = closingOnly ? allPeriods.slice(-1) : allPeriods;
    const periodKeys = closingOnly ? allKeys.slice(-1) : allKeys;
    const lastColumn = 1 + periodCount * subCount; // A (name) + the period columns

    if (!netOnly) ws.mergeCells(`A${groupRow}:A${subRow}`);
    ws.getCell(`A${groupRow}`).value = 'Name';
    // Each period heading carries the date range it covers on a second line
    const shortDate = (date: any) => dayjs(date).format('DD MMM YYYY');
    const { from, to } = reportData.filters;
    const allRanges = [
      from ? `before ${shortDate(from)}` : '-',
      from ? `${shortDate(from)} - ${shortDate(to)}` : `up to ${shortDate(to)}`,
      `as at ${shortDate(to)}`,
    ];
    const ranges = closingOnly ? allRanges.slice(-1) : allRanges;
    ws.getRow(groupRow).height = 32;
    periods.forEach((label, i) => {
      const start = 2 + i * subCount;
      if (subCount > 1) ws.mergeCells(groupRow, start, groupRow, start + subCount - 1);
      // Closing-only: the "as at" date alone heads the column
      ws.getCell(groupRow, start).value = closingOnly
        ? ranges[i]
        : `${label}\n${ranges[i]}`;
      if (!netOnly) {
        ['Debit', 'Credit', 'Net'].forEach((sub, j) => {
          ws.getCell(subRow, start + j).value = sub;
        });
      }
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
        const start = 2 + i * subCount;
        const figures = node[key];
        const netText =
          figures?.net?.amount
            ? `${figures.net.amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} ${figures.net.side}`
            : '';
        const values: (number | string)[] = netOnly
          ? [netText]
          : [figures?.debit || '', figures?.credit || '', netText];
        values.forEach((value, j) => {
          const cell = ws.getCell(row, start + j);
          cell.value = value;
          cell.numFmt = '#,##0.00;[Red]-#,##0.00';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.border = thinBorder;
          // A net on the opposite side to the node's normal side is a negative balance
          const isNet = j === values.length - 1;
          const negative =
            isNet &&
            node.normal_side &&
            figures?.net?.amount &&
            figures.net.side !== node.normal_side;
          if (bold || negative) {
            cell.font = {
              ...(bold ? { bold: true } : {}),
              ...(negative ? { color: { argb: 'FFD32F2F' } } : {}),
            };
          }
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
