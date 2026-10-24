import React, { useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { PeriodCells, PeriodTableHead, pruneZeroNetTree } from '../periodColumns';

const TrialBalanceGroupedOnScreen = ({ reportData, authOrganization, netOnly, closingOnly }) => {
  const theme = useTheme();
  const [openRows, setOpenRows] = useState([]);

  const mainColor = authOrganization?.organization.settings?.main_color || '#2113AD';
  const headerColor = theme.type === 'dark' ? '#29f096' : mainColor;
  const contrastText = authOrganization?.organization.settings?.contrast_text || '#FFFFFF';

  if (!reportData) return null;

  const toggleRow = (rowId) => {
    setOpenRows((prevOpenRows) =>
      prevOpenRows.includes(rowId)
        ? prevOpenRows.filter((id) => id !== rowId)
        : [...prevOpenRows, rowId]
    );
  };

  const renderGroup = (group, level) => {
    const hasChildren = (group.children?.length > 0) || (group.ledgers?.length > 0);
    const isOpen = openRows.includes(`g-${group.id}`);

    return (
      <React.Fragment key={`g-${group.id}`}>
        <TableRow
          onClick={() => hasChildren && toggleRow(`g-${group.id}`)}
          sx={{ cursor: hasChildren ? 'pointer' : 'default', '&:hover': { bgcolor: 'action.hover' } }}
        >
          <TableCell style={{ paddingLeft: level * 20 }}>
            {hasChildren && (isOpen ? <KeyboardArrowDown /> : <KeyboardArrowRight />)}
            <span style={{ fontWeight: 'bold', marginLeft: 5 }}>{group.name}</span>
          </TableCell>
          <PeriodCells netOnly={netOnly} closingOnly={closingOnly} node={group} sx={{ fontWeight: 'bold' }} />
        </TableRow>
        {isOpen && group.children?.map((child) => renderGroup(child, level + 1))}
        {isOpen && group.ledgers?.map((ledger) => (
          <TableRow key={`l-${ledger.id}`}>
            <TableCell style={{ paddingLeft: (level + 1) * 20 }}>{ledger.name}</TableCell>
            <PeriodCells netOnly={netOnly} closingOnly={closingOnly} node={ledger} />
          </TableRow>
        ))}
      </React.Fragment>
    );
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="trial-balance-grouped">
        <TableHead>
          <PeriodTableHead netOnly={netOnly} closingOnly={closingOnly}
            leadingLabels={['LEDGER GROUP']}
            backgroundColor={headerColor}
            color={contrastText}
            filters={reportData.filters}
          />
        </TableHead>
        <TableBody>
          {(netOnly
            ? reportData.groups?.map((group) =>
                pruneZeroNetTree(group, closingOnly)
              )
            : reportData.groups
          )?.map((group) => renderGroup(group, 0))}
          <TableRow>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText, borderBottom: 'none' }}>
              TOTAL
            </TableCell>
            <PeriodCells netOnly={netOnly} closingOnly={closingOnly}
              node={reportData.totals}
              sx={{ backgroundColor: mainColor, color: contrastText, borderBottom: 'none', fontWeight: 'bold' }}
            />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TrialBalanceGroupedOnScreen;
