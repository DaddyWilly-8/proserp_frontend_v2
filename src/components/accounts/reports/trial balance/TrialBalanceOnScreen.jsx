import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import {
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import {
  PeriodCells,
  PeriodTableHead,
  hasNetBalance,
  hasPeriodActivity,
} from '../periodColumns';

const TrialBalanceOnScreen = ({ reportData, authOrganization, netOnly, closingOnly }) => {
  const theme = useTheme();
  const dictionary = useDictionary();
  const t = dictionary.reports.accountsReports;

  if (!reportData) return null;

  const mainColor = authOrganization?.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : mainColor;
  const contrastText = authOrganization?.organization.settings?.contrast_text || "#FFFFFF";

  const ledgers = reportData.ledgers.filter(
    (ledger) =>
      netOnly
        ? hasNetBalance(ledger, closingOnly)
        : hasPeriodActivity(ledger, closingOnly)
  );
  const totalSx = { backgroundColor: mainColor, color: contrastText, borderBottom: 'none', fontWeight: 'bold' };

  return (
    <div>
      <Divider style={{ margin: '20px 0' }} />

      <Grid container spacing={1}>
        <Grid size={12}>
          <Typography variant="subtitle1" style={{ color: headerColor }}>
            {t.common.printedOn}
          </Typography>
          <Typography variant="body2">
            {readableDate(undefined, true)}
          </Typography>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <PeriodTableHead netOnly={netOnly} closingOnly={closingOnly}
              leadingLabels={[t.common.serialNumber, t.trialBalance.ledgerName]}
              labels={t.common}
              backgroundColor={mainColor}
              color={contrastText}
              filters={reportData.filters}
            />
          </TableHead>
          <TableBody>
            {ledgers.map((ledger, index) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: index % 2 === 0
                    ? theme.palette.background.paper
                    : theme.palette.action.hover
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{ledger.name}</TableCell>
                <PeriodCells netOnly={netOnly} closingOnly={closingOnly} node={ledger} />
              </TableRow>
            ))}

            <TableRow>
              <TableCell colSpan={2} sx={totalSx}>
                {t.common.total.toUpperCase()}
              </TableCell>
              <PeriodCells netOnly={netOnly} closingOnly={closingOnly} node={reportData.totals} sx={totalSx} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default TrialBalanceOnScreen;
