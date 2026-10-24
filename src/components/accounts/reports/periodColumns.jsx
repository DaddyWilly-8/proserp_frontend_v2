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
// With `netOnly` each period collapses to its single Net column. flex only
// matters for the PDF; Net is wider there because it carries the DR/CR suffix.
const subColumns = (netOnly) =>
  netOnly
    ? [{ label: 'Net', flex: 1.6 }]
    : [
        { label: 'Debit', flex: 1 },
        { label: 'Credit', flex: 1 },
        { label: 'Net', flex: 1.3 },
      ];
const groupFlex = (netOnly) =>
  subColumns(netOnly).reduce((sum, { flex }) => sum + flex, 0);

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

export const hasNetBalance = (node) =>
  PERIODS.some(([key]) => node[key]?.net?.amount);

/**
 * Net-only view: drops nodes whose Opening, Current and Closing nets are all
 * zero. A group stays if it has a net of its own or anything non-zero beneath
 * it (offsetting ledgers can net a group to zero without being empty).
 */
export const pruneZeroNetList = (nodes = []) =>
  nodes.flatMap((node) => {
    const children = pruneZeroNetList(node.children);
    const ledgers = pruneZeroNetList(node.ledgers);
    return hasNetBalance(node) || children.length || ledgers.length
      ? [{ ...node, children, ledgers }]
      : [];
  });

/** As pruneZeroNetList, but the root itself is always kept. */
export const pruneZeroNetTree = (root) => ({
  ...root,
  children: pruneZeroNetList(root.children),
  ledgers: pruneZeroNetList(root.ledgers),
});

// A net on the opposite side to the account's normal side (e.g. an asset or a
// debtor in credit, a liability or a creditor in debit) is a negative balance.
// Nodes without a normal_side (report totals) are never flagged.
export const isNegativeNet = (node, period) =>
  Boolean(
    node.normal_side &&
      node[period]?.net?.amount &&
      node[period].net.side !== node.normal_side
  );

export const NEGATIVE_COLOR = '#D32F2F';

/** Flat list of { value, negative } for every figure cell of a node, in column order. */
const periodCells = (node, netOnly) =>
  PERIODS.flatMap(([key]) => {
    const values = periodValues(node, key, netOnly);
    return values.map((value, i) => ({
      value,
      negative: i === values.length - 1 && isNegativeNet(node, key),
    }));
  });

const periodValues = (node, period, netOnly) =>
  netOnly
    ? [formatNet(node[period]?.net)]
    : [
        formatAmount(node[period]?.debit),
        formatAmount(node[period]?.credit),
        formatNet(node[period]?.net),
      ];

const periodBorder = (columnIndex, netOnly) =>
  columnIndex % (netOnly ? 1 : 3) === 0
    ? { borderLeft: '1px solid rgba(128,128,128,0.4)' }
    : {};

/** Two-row table head: leading labels span both rows, then the 3 x 3 period columns. */
export const PeriodTableHead = ({
  leadingLabels,
  backgroundColor,
  color,
  filters,
  netOnly = false,
}) => {
  const ranges = periodRanges(filters);
  const headerSx = { backgroundColor, color, fontWeight: 'bold' };
  return (
    <>
      <TableRow>
        {leadingLabels.map((label) => (
          <TableCell
            key={label}
            rowSpan={netOnly ? 1 : 2}
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
            colSpan={subColumns(netOnly).length}
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
      {/* Net-only has a single sub-column per period, so its "Net" label row adds nothing. */}
      {!netOnly && (
      <TableRow>
        {PERIODS.flatMap(([key]) =>
          subColumns(netOnly).map(({ label }, i) => (
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
      )}
    </>
  );
};

/** The Opening/Current/Closing cells (nine, or three when netOnly) for one node. */
export const PeriodCells = ({ node, sx, onClick, netOnly = false }) =>
  periodCells(node, netOnly).map(({ value, negative }, i) => (
    <TableCell
      key={i}
      align='right'
      onClick={onClick}
      sx={{
        whiteSpace: 'nowrap',
        ...periodBorder(i, netOnly),
        ...sx,
        // Rows that set their own text colour sit on a coloured background (totals, root row)
        ...(negative && !sx?.color ? { color: NEGATIVE_COLOR } : {}),
      }}
    >
      {value}
    </TableCell>
  ));

// ---- PDF ----------------------------------------------------------------
// Laid out like the Payroll Sheet PDF: tight page margins, thin bordered
// cells, small type and a header that repeats on every page. The Net column
// is a little wider than Debit/Credit because it carries the DR/CR suffix.

export const PDF_PAGE_STYLE = { ...pdfStyles.page, padding: 16 };

const CELL_BORDER = {
  borderWidth: 0.5,
  borderStyle: 'solid',
  borderColor: '#000000',
};

// Column widths are explicit percentages (border-box in the PDF engine), not
// flex: flex widths add each cell's padding and border on top of its share,
// so the header's grouped columns and the data rows drifted out of line.
const totalFlex = (leading, netOnly) =>
  leading.reduce((sum, { flex }) => sum + flex, 0) +
  PERIODS.length * groupFlex(netOnly);
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
  netOnly = false,
}) => {
  const ranges = periodRanges(filters);
  const total = totalFlex(leading, netOnly);
  const groupWidth = groupFlex(netOnly);
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
          style={{ width: pct(groupWidth, total), flexDirection: 'column' }}
        >
          <View style={box('100%', { alignItems: 'center' })}>
            <Text style={text}>{label}</Text>
            <Text style={{ ...text, fontWeight: 'normal', fontSize: 5.5 }}>
              {ranges[key]}
            </Text>
          </View>
          {!netOnly && (
          <View style={{ flexDirection: 'row', width: '100%' }}>
            {subColumns(netOnly).map(({ label: sub, flex }) => (
              <View
                key={sub}
                style={box(pct(flex, groupWidth), {
                  alignItems: 'flex-end',
                })}
              >
                <Text style={text}>{sub}</Text>
              </View>
            ))}
          </View>
          )}
        </View>
      ))}
    </View>
  );
};

/** leading: [{ text, flex, indent? }]; node supplies the nine period figures. */
export const PeriodPdfRow = ({
  leading,
  node,
  backgroundColor,
  bold,
  netOnly = false,
}) => {
  const total = totalFlex(leading, netOnly);
  const subs = subColumns(netOnly);
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
      {periodCells(node, netOnly).map(({ value, negative }, i) => (
        <View
          key={i}
          style={box(pct(subs[i % subs.length].flex, total), {
            alignItems: 'flex-end',
          })}
        >
          <Text style={negative ? { ...text, color: NEGATIVE_COLOR } : text}>
            {value}
          </Text>
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
