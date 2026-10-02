import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

export async function exportSalesPerformanceExcel(exportedData: any) {
  try {
    const {
      organization,
      rows,
      groupBy,
      from,
      to,
      baseCurrencyCode,
      printedBy,
    } = exportedData;

    const labelColumn = groupBy === 'sales_person' ? 'Sales Person' : 'Customer';

    const wb = createWorkbook();
    const ws = wb.addWorksheet('Sales Performance');
    // Each customer/sales person's own row sits above its product breakdown,
    // so the collapse toggle needs to live on that row too — summaryBelow
    // false tells Excel the parent is above the detail it controls, matching
    // the Income Statement Excel export.
    ws.properties.outlineProperties = {
      summaryBelow: false,
      summaryRight: false,
    };

    ws.columns = [
      { width: 10 }, // Rank
      { width: 32 }, // Customer / Sales Person
      { width: 18 }, // Transactions
      { width: 20 }, // Amount Ordered
      { width: 20 }, // Amount Collected
    ];

    ws.addRow([organization.name, ' ', ' ', ' ', 'SALES PERFORMANCE']);
    ws.addRow([
      ' ',
      ' ',
      ' ',
      ' ',
      `${readableDate(from, true)} - ${readableDate(to, true)}`,
    ]);
    if (baseCurrencyCode) {
      ws.addRow([' ', ' ', ' ', ' ', `Amounts in base currency (${baseCurrencyCode})`]);
    }
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell('E1').font = { bold: true, size: 12 };

    ws.addRow([]);
    const infoRow = ws.addRow(['Printed By', ' ', 'Printed On', ' ', ' ']);
    ws.addRow([printedBy || '', ' ', readableDate(undefined, true), ' ', ' ']);
    infoRow.eachCell((cell) => applyCellStyle(cell, CELL_STYLES.filterLabel));

    ws.addRow([]);

    const headerRow = ws.addRow([
      'Rank',
      labelColumn,
      'Transactions',
      'Amount Ordered',
      'Amount Collected',
    ]);
    headerRow.eachCell((cell, colNumber) => {
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      if (colNumber > 1) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    (rows || []).forEach((row: any, index: number) => {
      const dataRow = ws.addRow([
        index + 1,
        row.label,
        row.transaction_count,
        row.amount_ordered,
        row.amount_collected,
      ]);
      dataRow.eachCell((cell, colNumber) => {
        applyCellStyle(
          cell,
          colNumber === 2 ? CELL_STYLES.dataRowText : CELL_STYLES.dataRowNumeric
        );
        if (colNumber >= 4) {
          cell.numFmt = '#,##0.00';
        }
      });

      (row.products || []).forEach((product: any) => {
        const qtyLabel = `${(product.quantity || 0).toLocaleString('en-US', {
          maximumFractionDigits: 2,
        })}${product.unit_symbol ? ` ${product.unit_symbol}` : ''}`;
        const productRow = ws.addRow([
          '',
          `    ${product.product_name} (qty: ${qtyLabel})`,
          '',
          product.amount_ordered,
          '',
        ]);
        // Collapsible under its customer/sales person row — see
        // outlineProperties above.
        productRow.outlineLevel = 1;
        productRow.eachCell((cell, colNumber) => {
          applyCellStyle(
            cell,
            colNumber === 2 ? CELL_STYLES.filterLabel : CELL_STYLES.dataRowNumeric
          );
          if (colNumber === 4) {
            cell.numFmt = '#,##0.00';
          }
        });
      });
    });

    const totalOrdered = (rows || []).reduce(
      (sum: number, row: any) => sum + (row.amount_ordered || 0),
      0
    );
    const totalCollected = (rows || []).reduce(
      (sum: number, row: any) => sum + (row.amount_collected || 0),
      0
    );
    const totalTransactions = (rows || []).reduce(
      (sum: number, row: any) => sum + (row.transaction_count || 0),
      0
    );

    const totalRow = ws.addRow([
      '',
      'Total',
      totalTransactions,
      totalOrdered,
      totalCollected,
    ]);
    totalRow.eachCell((cell, colNumber) => {
      applyCellStyle(
        cell,
        colNumber === 2 ? CELL_STYLES.totalRowText : CELL_STYLES.totalRowNumeric
      );
      if (colNumber >= 4) {
        cell.numFmt = '#,##0.00';
      }
    });

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Sales Performance Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
