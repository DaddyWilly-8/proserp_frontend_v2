import { fromGrams, normalizeUnit } from '../weightUnit';
import { stamp } from '../dateTime';
import { RoundRecord } from './roundTypes';

const money = (value: number | string | null | undefined) =>
  value == null ? '' : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const num = (value: number | string | null | undefined, digits = 2) =>
  value == null ? '' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

/** The facts shown above the lines of a record, as [label, value] pairs with empty ones dropped. */
export const recordFacts = (record: RoundRecord, text: any, inputTypes: Record<string, string>): [string, string][] =>
  (
    [
      [text.labels.farm, record.farm?.name],
      [text.labels.dateTime, stamp(record.record_date)],
      [text.labels.type, record.input_type ? inputTypes[record.input_type] : undefined],
      [text.labels.reason, record.reason],
      [text.labels.store, record.store?.name],
      [text.labels.product, record.product?.name],
      [text.labels.unit, record.measurement_unit?.symbol ?? record.measurement_unit?.name],
      [text.labels.causeAll, record.cause],
      [text.labels.ledger, record.ledger?.name],
      [text.labels.rate, record.rate != null ? money(record.rate) : undefined],
      [text.labels.creator, record.creator?.name],
    ] as [string, string | undefined][]
  ).filter((pair): pair is [string, string] => !!pair[1]);

/** Column headings and each line's cells, in the order the record is read on screen. */
export const recordTable = (record: RoundRecord, text: any): { head: string[]; rows: string[][]; numeric: boolean[] } => {
  const symbol = record.measurement_unit?.symbol ?? '';
  const head = [text.labels.productionUnit, text.labels.batch, text.labels.stage];
  const lead = (line: NonNullable<RoundRecord['lines']>[number]) => [line.unit?.name ?? '', line.batchNo, line.stage?.name ?? ''];
  if (record.kind === 'feeding') {
    return {
      head: [...head, `${text.labels.quantity}${symbol ? ` (${symbol})` : ''}`, text.labels.cost],
      rows: (record.lines ?? []).map((line) => [...lead(line), num(line.quantity, 5), num(line.cost)]),
      numeric: [false, false, false, true, true],
    };
  }
  if (record.kind === 'measurement') {
    return {
      head: [text.labels.productionUnit, text.labels.parameter, text.labels.value, text.labels.reading],
      rows: (record.lines ?? []).map((line) => [line.unit?.name ?? '', line.parameter?.name ?? '', `${num(line.value, line.parameter?.decimals ?? 2)} ${line.parameter?.unit_label ?? ''}`.trim(), line.status ?? 'ok']),
      numeric: [false, false, true, false],
    };
  }
  if (record.kind === 'harvest') {
    return {
      head: [...head, text.labels.harvested, text.labels.received, text.labels.cost],
      rows: (record.lines ?? []).map((line) => [...lead(line), num(line.quantity, 0), num(line.product_quantity, 5), money(line.cost)]),
      numeric: [false, false, false, true, true, true],
    };
  }
  if (record.kind === 'produce') {
    return {
      head: [...head, text.labels.collected, text.labels.cost],
      rows: (record.lines ?? []).map((line) => [...lead(line), num(line.quantity, 5), money(line.cost)]),
      numeric: [false, false, false, true, true],
    };
  }
  if (record.kind === 'cost') {
    return {
      head: [...head, text.labels.quantity, text.labels.rate, text.labels.amount],
      rows: (record.lines ?? []).map((line) => [...lead(line), num(line.quantity, 5), money(line.rate), money(line.amount)]),
      numeric: [false, false, false, true, true, true],
    };
  }
  if (record.kind === 'mortality') {
    return {
      head: [...head, text.labels.died, text.labels.cause],
      rows: (record.lines ?? []).map((line) => [...lead(line), num(line.quantity, 0), line.cause ?? '']),
      numeric: [false, false, false, true, false],
    };
  }
  return {
    head: [...head, text.labels.sampleSize, text.labels.averageWeight],
    rows: (record.lines ?? []).map((line) => [...lead(line), num(line.sample_size, 0), `${num(fromGrams(Number(line.average_weight_g), line.weight_unit), 4)} ${normalizeUnit(line.weight_unit)}`]),
    numeric: [false, false, false, true, true],
  };
};

/** Builds the record as an Excel workbook and hands it to the browser as a download. */
export const downloadRecordExcel = async (record: RoundRecord, text: any, inputTypes: Record<string, string>) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(record.recordNo.replace('/', '-'));
  const { head, rows, numeric } = recordTable(record, text);

  sheet.addRow([record.recordNo]).font = { bold: true, size: 14 };
  recordFacts(record, text, inputTypes).forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
  });
  sheet.addRow([]);

  const headRow = sheet.addRow(head);
  headRow.font = { bold: true };
  headRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  });
  rows.forEach((cells) => sheet.addRow(cells));
  numeric.forEach((isNumeric, index) => {
    if (isNumeric) sheet.getColumn(index + 1).alignment = { horizontal: 'right' };
  });
  sheet.columns.forEach((column, index) => {
    const longest = Math.max(head[index]?.length ?? 0, ...rows.map((cells) => cells[index]?.length ?? 0), 12);
    column.width = Math.min(longest + 2, 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${record.recordNo.replace('/', '-')}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};
