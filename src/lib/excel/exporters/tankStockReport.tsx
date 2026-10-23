import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

const BORDER = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
} as const;

const HEADINGS = ['Period', 'Product', 'Tank', 'Opening', 'Stock In', 'Stock Out', 'Closing'];

export async function exportTankStockReportToExcel(exportedData: any) {
  try {
    const { activeStation, filters, organization, reportData } = exportedData;

    // Summary: first opening, summed movements, last closing - per tank
    const productMap = new Map<number, any>();
    reportData.forEach((day: any) => {
      day.readings.forEach((product: any) => {
        if (!productMap.has(product.id)) {
          productMap.set(product.id, {
            id: product.id,
            name: product.name,
            tanks: new Map<string, any>(),
          });
        }
        const productData = productMap.get(product.id);
        product.tanks.forEach((tank: any) => {
          if (!productData.tanks.has(tank.tank)) {
            productData.tanks.set(tank.tank, {
              tank: tank.tank,
              opening: tank.opening,
              stock_in: 0,
              stock_out: 0,
              closing: tank.closing,
            });
          }
          const tankData = productData.tanks.get(tank.tank);
          tankData.stock_in += tank.stock_in || 0;
          tankData.stock_out += tank.stock_out || 0;
          tankData.closing = tank.closing;
        });
      });
    });
    const summary = Array.from(productMap.values()).map((product) => ({
      ...product,
      tanks: Array.from(product.tanks.values()),
    }));

    const wb = createWorkbook();
    const ws = wb.addWorksheet('Tank Stock Report');
    ws.columns = [
      { width: 22 },
      { width: 20 },
      { width: 18 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    ws.addRow([organization.name, '', '', '', '', '', activeStation.name]);
    ws.addRow(['', '', '', '', '', '', 'Tank Stock Report']);
    ws.addRow([
      '',
      '',
      '',
      '',
      '',
      '',
      readableDate(filters.from, true) + '-' + readableDate(filters.to, true),
    ]);
    for (let r = 1; r <= 3; r++) {
      ws.getRow(r).font = { bold: true, size: 12 };
    }
    ws.addRow([]);

    const writeHeader = () => {
      const row = ws.addRow(HEADINGS);
      row.height = 20;
      row.eachCell((cell) => applyCellStyle(cell, CELL_STYLES.tableHeader));
    };

    const writeProducts = (label: string, products: any[]) => {
      const startRow = (ws.lastRow?.number ?? 0) + 1;

      products.forEach((product) => {
        const totals = { opening: 0, stock_in: 0, stock_out: 0, closing: 0 };
        const productStart = (ws.lastRow?.number ?? 0) + 1;

        product.tanks.forEach((tank: any) => {
          const row = ws.addRow([
            '',
            '',
            tank.tank,
            tank.opening,
            tank.stock_in,
            tank.stock_out,
            tank.closing,
          ]);
          totals.opening += tank.opening || 0;
          totals.stock_in += tank.stock_in || 0;
          totals.stock_out += tank.stock_out || 0;
          totals.closing += tank.closing || 0;
          for (let col = 3; col <= 7; col++) {
            const cell = row.getCell(col);
            cell.border = BORDER;
            if (col > 3) {
              cell.numFmt = '#,##0.00';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
          }
        });

        // Totals only colour the tank/figure columns - Period and Product
        // stay merged down through this row, as in the Dipping Report.
        const totalRow = ws.addRow([
          '',
          '',
          'TOTAL',
          totals.opening,
          totals.stock_in,
          totals.stock_out,
          totals.closing,
        ]);
        for (let col = 3; col <= 7; col++) {
          const cell = totalRow.getCell(col);
          applyCellStyle(cell, CELL_STYLES.tableHeader);
          cell.border = BORDER;
          if (col > 3) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        }

        ws.mergeCells(`B${productStart}:B${totalRow.number}`);
        const productCell = ws.getCell(`B${productStart}`);
        productCell.value = product.name;
        productCell.border = BORDER;
        productCell.alignment = {
          wrapText: true,
          vertical: 'middle',
          horizontal: 'left',
        };
      });

      const endRow = ws.lastRow?.number ?? startRow;
      ws.mergeCells(`A${startRow}:A${endRow}`);
      const cell = ws.getCell(`A${startRow}`);
      cell.value = label;
      cell.border = BORDER;
      cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    };

    reportData.forEach((day: any) => {
      writeHeader();
      writeProducts(readableDate(day.date), day.readings);
      ws.addRow([]);
    });

    const summaryRow = ws.addRow(['Summary']);
    ws.mergeCells(`A${summaryRow.number}:G${summaryRow.number}`);
    applyCellStyle(ws.getCell(`A${summaryRow.number}`), CELL_STYLES.tableHeader);
    ws.getCell(`A${summaryRow.number}`).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    writeHeader();
    writeProducts('SUMMARY', summary);

    return await wb.xlsx.writeBuffer();
  } catch (error: any) {
    console.error('Error exporting tank stock report:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
