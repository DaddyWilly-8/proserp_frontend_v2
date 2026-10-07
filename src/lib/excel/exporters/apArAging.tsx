import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

const BUCKET_COLUMNS = [
  { key: 'current', label: 'Current (0-30)' },
  { key: 'days_31_60', label: '31-60' },
  { key: 'days_61_90', label: '61-90' },
  { key: 'days_91_120', label: '91-120' },
  { key: 'over_120', label: '120+' },
];

export async function exportApArAgingToExcel(exportedData: any) {
  try {
    const { authOrganization, reportData, user } = exportedData;
    const reportTitle = reportData.filters?.type === 'receivable' ? 'A/R Aging Report' : 'A/P Aging Report';
    const reportPeriod = `As at: ${readableDate(reportData.filters?.as_at, true)}`;

    const wb = createWorkbook();
    const ws = wb.addWorksheet('Aging Report');
    // The group's own row sits above its children (not a trailing
    // subtotal), so the collapse toggle needs to live on that row too —
    // summaryBelow false tells Excel the parent is above the detail it
    // controls, matching the other grouped report exports.
    ws.properties.outlineProperties = {
      summaryBelow: false,
      summaryRight: false,
    };

    ws.columns = [
      { width: 8 },
      { width: 30 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    // header section
    ws.addRow([authOrganization.organization.name, ' ', ' ', ' ', ' ', ' ', ' ', reportTitle]);
    ws.addRow([' ', ' ', ' ', ' ', ' ', ' ', ' ', reportPeriod]);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell('H1').font = { bold: true, size: 12 };
    ws.getCell('H2').font = { bold: true, size: 12 };

    ws.addRow([]);

    // info section
    const infoRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${infoRow}`).value = 'Cost Centers';
    ws.getCell(`A${infoRow}`).font = { bold: true, size: 11 };
    ws.getCell(`C${infoRow}`).value = 'Printed By';
    ws.getCell(`C${infoRow}`).font = { bold: true, size: 11 };
    ws.getCell(`D${infoRow}`).value = user?.name;
    ws.getCell(`E${infoRow}`).value = 'Printed On';
    ws.getCell(`E${infoRow}`).font = { bold: true, size: 11 };
    ws.getCell(`F${infoRow}`).value = readableDate(undefined, true);

    const costCenterNames = (reportData.filters?.cost_centers || []).map((c: any) => c.name).join(', ');
    ws.getCell(`B${infoRow}`).value = costCenterNames || 'All';

    ws.addRow([]);

    // header row
    const headerRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getRow(headerRow).height = 22;
    ws.mergeCells(`A${headerRow}:B${headerRow}`);
    ws.getCell(`A${headerRow}`).value = 'Name';
    BUCKET_COLUMNS.forEach((col, i) => {
      ws.getCell(`${String.fromCharCode(67 + i)}${headerRow}`).value = col.label;
    });
    ws.getCell(`H${headerRow}`).value = 'Total';

    for (let c = 65; c <= 72; c++) {
      applyCellStyle(ws.getCell(`${String.fromCharCode(c)}${headerRow}`), CELL_STYLES.tableHeader);
    }

    // Writes one row per tree node (ledger-group or leaf ledger), group
    // rows first then that group's own subgroups/ledgers directly below,
    // and gives every row below the root an outlineLevel so Excel's
    // native group collapse arrows work like the on-screen collapsible
    // tree.
    const writeAgingTreeRow = (node: any, level: number, isGroup: boolean) => {
      const r = (ws.lastRow?.number ?? 0) + 1;
      ws.mergeCells(`A${r}:B${r}`);
      const nameCell = ws.getCell(`A${r}`);
      nameCell.value = node.name;
      nameCell.alignment = { indent: level };
      if (isGroup) nameCell.font = { bold: true };

      BUCKET_COLUMNS.forEach((col, i) => {
        const cell = ws.getCell(`${String.fromCharCode(67 + i)}${r}`);
        cell.value = node.buckets?.[col.key] || 0;
        cell.numFmt = '#,##0.00';
        if (isGroup) cell.font = { bold: true };
      });
      const totalCell = ws.getCell(`H${r}`);
      totalCell.value = node.total || 0;
      totalCell.numFmt = '#,##0.00';
      if (isGroup) totalCell.font = { bold: true };

      for (let c = 65; c <= 72; c++) {
        const cell = ws.getCell(`${String.fromCharCode(c)}${r}`);
        applyCellStyle(cell, c >= 67 ? CELL_STYLES.dataRowNumeric : CELL_STYLES.dataRowText);
      }

      if (level > 0) {
        ws.getRow(r).outlineLevel = level;
      }

      if (isGroup) {
        (node.children || []).forEach((child: any) => writeAgingTreeRow(child, level + 1, true));
        (node.ledgers || []).forEach((ledger: any) => writeAgingTreeRow(ledger, level + 1, false));
      }
    };

    if (reportData.group) {
      writeAgingTreeRow(reportData.group, 0, true);
    }

    // total row
    const totalRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getRow(totalRow).height = 20;
    ws.mergeCells(`A${totalRow}:B${totalRow}`);
    ws.getCell(`A${totalRow}`).value = 'Total';
    BUCKET_COLUMNS.forEach((col, i) => {
      const cell = ws.getCell(`${String.fromCharCode(67 + i)}${totalRow}`);
      cell.value = reportData.totals?.[col.key] || 0;
      cell.numFmt = '#,##0.00';
    });
    const grandTotalCell = ws.getCell(`H${totalRow}`);
    grandTotalCell.value = reportData.grand_total || 0;
    grandTotalCell.numFmt = '#,##0.00';

    for (let c = 65; c <= 72; c++) {
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(c)}${totalRow}`),
        c >= 67 ? CELL_STYLES.totalRowNumeric : CELL_STYLES.totalRowText
      );
    }

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Excel:', e);
    throw new Error(e?.message || 'Excel export failed during workbook generation');
  }
}
