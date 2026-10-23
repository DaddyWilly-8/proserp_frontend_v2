import { TableCell, TableRow, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Text, View } from '@react-pdf/renderer';
import pdfStyles from '../../pdf/pdf-styles';

// Shared Opening / Current / Closing layout for the Trial Balance and Balance
// Sheet reports. Every node (ledger, group, total) carries
// { opening, current, closing }, each { debit, credit, net: { amount, side } }.

export const PERIODS = [
  ['opening', 'Opening'],
  ['current', 'Current'],
  ['closing', 'Closing'],
];
const SUB_COLUMNS = ['Debit', 'Credit', 'Net'];

const shortDate = (date) => dayjs(date).format('DD MMM YYYY');

/** The date range each period covers, shown under its heading. */
export const periodRanges = (filters) => ({
  opening: filters?.from ? `before ${shortDate(filters.from)}` : '–',
  current: filters?.from
    ? `${shortDate(filters.from)} – ${shortDate(filters.to)}`
    : `up to ${shortDate(filters?.to)}`,
  closing: `as at ${shortDate(filters?.to)}`,
});

export const formatAmount = (amount) =>
  amount
    ? amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '';

export const formatNet = (net) =>
  net?.amount ? `${formatAmount(net.amount)} ${net.side}` : '';

export const hasPeriodActivity = (node) =>
  PERIODS.some(([key]) => node[key]?.debit || node[key]?.credit);

const periodValues = (node, period) => [
  formatAmount(node[period]?.debit),
  formatAmount(node[period]?.credit),
  formatNet(node[period]?.net),
];

const periodBorder = (columnIndex) =>
  columnIndex % 3 === 0 ? { borderLeft: '1px solid rgba(128,128,128,0.4)' } : {};

/** Two-row table head: leading labels span both rows, then the 3 x 3 period columns. */
export const PeriodTableHead = ({
  leadingLabels,
  backgroundColor,
  color,
  filters,
}) => {
  const ranges = periodRanges(filters);
  const headerSx = { backgroundColor, color, fontWeight: 'bold' };
  return (
    <>
      <TableRow>
        {leadingLabels.map((label) => (
          <TableCell
            key={label}
            rowSpan={2}
            // The name column must not give way to the nine figure columns;
            // the table scrolls sideways instead of squeezing it.
            sx={{ ...headerSx, minWidth: label === 'S/N' ? 50 : 300 }}
          >
            {label}
          </TableCell>
        ))}
        {PERIODS.map(([key, label]) => (
          <TableCell
            key={key}
            colSpan={3}
            align='center'
            sx={{
              ...headerSx,
              borderLeft: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            {label}
            <Typography
              variant='caption'
              component='div'
              sx={{ fontWeight: 'normal', lineHeight: 1.2 }}
            >
              {ranges[key]}
            </Typography>
          </TableCell>
        ))}
      </TableRow>
      <TableRow>
        {PERIODS.flatMap(([key]) =>
          SUB_COLUMNS.map((label, i) => (
            <TableCell
              key={`${key}-${label}`}
              align='right'
              sx={{
                ...headerSx,
                ...(i === 0
                  ? { borderLeft: '1px solid rgba(255,255,255,0.4)' }
                  : {}),
              }}
            >
              {label}
            </TableCell>
          ))
        )}
      </TableRow>
    </>
  );
};

/** The nine Opening/Current/Closing cells for one node. */
export const PeriodCells = ({ node, sx, onClick }) =>
  PERIODS.flatMap(([key]) => periodValues(node, key)).map((value, i) => (
    <TableCell
      key={i}
      align='right'
      onClick={onClick}
      sx={{ whiteSpace: 'nowrap', ...periodBorder(i), ...sx }}
    >
      {value}
    </TableCell>
  ));

// ---- PDF ----------------------------------------------------------------
// Laid out like the Payroll Sheet PDF: tight page margins, thin bordered
// cells, small type and a header that repeats on every page. The Net column
// is a little wider than Debit/Credit because it carries the DR/CR suffix.

export const PDF_PAGE_STYLE = { ...pdfStyles.page, padding: 16 };

const SUB_FLEX = [1, 1, 1.3];
const GROUP_FLEX = SUB_FLEX.reduce((a, b) => a + b, 0);
const CELL_BORDER = {
  borderWidth: 0.5,
  borderStyle: 'solid',
  borderColor: '#000000',
};

// Column widths are explicit percentages (border-box in the PDF engine), not
// flex: flex widths add each cell's padding and border on top of its share,
// so the header's grouped columns and the data rows drifted out of line.
const totalFlex = (leading) =>
  leading.reduce((sum, { flex }) => sum + flex, 0) + PERIODS.length * GROUP_FLEX;
const pct = (flex, total) => `${(flex / total) * 100}%`;

// Every cell is a bordered View wrapping its Text: a View stretches to the
// full row height, so a wrapped name can't leave its neighbours' borders and
// shading short of the row.
const pdfBox = (width, extra = {}) => ({
  ...CELL_BORDER,
  width,
  flexGrow: 0,
  flexShrink: 0,
  justifyContent: 'center',
  paddingVertical: 3,
  paddingHorizontal: 3,
  ...extra,
});

export const PeriodPdfHeader = ({
  leading,
  mainColor,
  contrastText,
  filters,
}) => {
  const ranges = periodRanges(filters);
  const total = totalFlex(leading);
  const text = {
    color: contrastText,
    fontWeight: 'bold',
    fontSize: 7,
  };
  const box = (width, extra) =>
    pdfBox(width, { backgroundColor: mainColor, ...extra });
  return (
    <View style={{ flexDirection: 'row' }} fixed>
      {leading.map(({ label, flex }) => (
        <View key={label} style={box(pct(flex, total))}>
          <Text style={text}>{label}</Text>
        </View>
      ))}
      {PERIODS.map(([key, label]) => (
        <View
          key={key}
          style={{ width: pct(GROUP_FLEX, total), flexDirection: 'column' }}
        >
          <View style={box('100%', { alignItems: 'center' })}>
            <Text style={text}>{label}</Text>
            <Text style={{ ...text, fontWeight: 'normal', fontSize: 5.5 }}>
              {ranges[key]}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', width: '100%' }}>
            {SUB_COLUMNS.map((sub, i) => (
              <View
                key={sub}
                style={box(pct(SUB_FLEX[i], GROUP_FLEX), {
                  alignItems: 'flex-end',
                })}
              >
                <Text style={text}>{sub}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

/** leading: [{ text, flex, indent? }]; node supplies the nine period figures. */
export const PeriodPdfRow = ({ leading, node, backgroundColor, bold }) => {
  const total = totalFlex(leading);
  const box = (width, extra) =>
    pdfBox(width, { borderColor: '#9E9E9E', backgroundColor, ...extra });
  const text = {
    fontWeight: bold ? 'bold' : 'normal',
    fontSize: 6.5,
  };
  return (
    <View style={pdfStyles.tableRow} wrap={false}>
      {leading.map(({ text: label, flex, indent = 0 }, i) => (
        // The indent lives on an inner View: padding on the cell itself
        // would still be fine now, but this keeps the box identical to the header's.
        <View key={i} style={box(pct(flex, total))}>
          <View style={{ paddingLeft: indent * 8 }}>
            <Text style={text}>{label}</Text>
          </View>
        </View>
      ))}
      {PERIODS.flatMap(([key]) => periodValues(node, key)).map((value, i) => (
        <View
          key={i}
          style={box(pct(SUB_FLEX[i % 3], total), { alignItems: 'flex-end' })}
        >
          <Text style={text}>{value}</Text>
        </View>
      ))}
    </View>
  );
};

/** "01 Jan 2026 – 23 Oct 2026" style subtitle used by the PDFs. */
export const periodSubtitle = (filters, readableDate) =>
  filters?.from
    ? `Period: ${readableDate(filters.from, true)} to ${readableDate(filters.to, true)}`
    : `Up to: ${readableDate(filters?.to, true)}`;
