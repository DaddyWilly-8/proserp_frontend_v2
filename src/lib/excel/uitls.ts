import Exceljs from 'exceljs';

export function getExcelColumnName(index: number): string {
  let column = '';
  while (index > 0) {
    let remainder = (index - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    index = Math.floor((index - 1) / 26);
  }
  return column;
}

/**
 * The rendered length of a cell's value — good enough for sizing a column,
 * not for display. Handles the value shapes ExcelJS actually stores (plain
 * values, rich text runs, formula results, dates), since `cell.value` isn't
 * always a plain string/number.
 */
function cellDisplayLength(cell: Exceljs.Cell): number {
  const value = cell.value;

  if (value === null || value === undefined) return 0;

  if (value instanceof Date) {
    return value.toLocaleDateString().length;
  }

  if (typeof value === 'object') {
    if ('richText' in value) {
      return value.richText.map((run) => run.text).join('').length;
    }
    if ('result' in value) {
      return String(value.result ?? '').length;
    }
    if ('text' in value) {
      return String((value as any).text ?? '').length;
    }
    return String(value).length;
  }

  // A numFmt'd number (e.g. "#,##0.00") renders wider than its raw digit
  // count once formatted — toLocaleString is a close enough stand-in
  // without re-implementing Excel's number-format parser.
  if (typeof value === 'number' && cell.numFmt) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 }).length;
  }

  return String(value).length;
}

/**
 * Sizes every column to fit its widest cell instead of a fixed guess —
 * walks every row once (only after all data/headers are written), measuring
 * each cell's rendered text length. Merged cells only carry a value on their
 * top-left ("master") cell, so a wide merged title row never blows out a
 * data column's width — its length is attributed to that one column only.
 *
 * Call this last, right before `wb.xlsx.writeBuffer()`.
 */
export function autosizeColumns(
  ws: Exceljs.Worksheet,
  {
    minWidth = 8,
    maxWidth = 60,
    padding = 2,
  }: { minWidth?: number; maxWidth?: number; padding?: number } = {}
): void {
  const widths: number[] = [];

  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      // A merged cell (a title row spanning the whole sheet, a section
      // header, a signature line) isn't representative of that one column's
      // actual data width — counting it would blow every such column out to
      // fit a sentence that visually spans a dozen columns.
      if (cell.isMerged) return;

      const length = cellDisplayLength(cell);
      if (length > (widths[colNumber] || 0)) {
        widths[colNumber] = length;
      }
    });
  });

  widths.forEach((width, colNumber) => {
    if (!colNumber) return;
    ws.getColumn(colNumber).width = Math.min(
      maxWidth,
      Math.max(minWidth, width + padding)
    );
  });
}
