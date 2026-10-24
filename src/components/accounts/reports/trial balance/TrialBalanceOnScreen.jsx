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

const TrialBalanceOnScreen = ({ reportData, authOrganization, netOnly }) => {
  const theme = useTheme();

  if (!reportData) return null;

  const mainColor = authOrganization?.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : mainColor;
  const contrastText = authOrganization?.organization.settings?.contrast_text || "#FFFFFF";

  const ledgers = reportData.ledgers.filter(
    netOnly ? hasNetBalance : hasPeriodActivity
  );
  const totalSx = { backgroundColor: mainColor, color: contrastText, borderBottom: 'none', fontWeight: 'bold' };

  return (
    <div>
      <Divider style={{ margin: '20px 0' }} />

      <Grid container spacing={1}>
        <Grid size={12}>
          <Typography variant="subtitle1" style={{ color: headerColor }}>
            Printed On
          </Typography>
          <Typography variant="body2">
            {readableDate(undefined, true)}
          </Typography>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <PeriodTableHead netOnly={netOnly}
              leadingLabels={['S/N', 'Ledger Name']}
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
                <PeriodCells netOnly={netOnly} node={ledger} />
              </TableRow>
            ))}

            <TableRow>
              <TableCell colSpan={2} sx={totalSx}>TOTAL</TableCell>
              <PeriodCells netOnly={netOnly} node={reportData.totals} sx={totalSx} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default TrialBalanceOnScreen;
