import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import ProjectLiabilityDocumentDialog from '@/components/projectManagement/projects/profile/dashboard/ProjectLiabilityDocumentDialog';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  Paper as TablePaper,
  TableRow,
  useTheme,
} from '@mui/material';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { PeriodCells, PeriodTableHead, pruneZeroNetTree } from '../periodColumns';

const DebtorCreditorOnScreen = ({ reportData, authOrganization, user, netOnly }) => {
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find((c) => c.is_base === 1);
  const organization = authOrganization?.organization;
  const theme = useTheme();
  const mainColor =
    authOrganization?.organization.settings?.main_color || '#2113AD';
  const contrastText =
    authOrganization?.organization.settings?.contrast_text || '#FFFFFF';

  const [openDialog, setOpenDialog] = useState(false);
  const [openRows, setOpenRows] = useState([]);
  const [liabilitiesPayload, setLiabilitiesPayload] = useState(null);

  const rawRootGroup = reportData?.debtors || reportData?.creditors;
  const rootGroup =
    rawRootGroup && netOnly ? pruneZeroNetTree(rawRootGroup) : rawRootGroup;
  // debtors are rooted at the Accounts Receivable group (increases with
  // debit), creditors at Accounts Payable (increases with credit) — fixed
  // per report type, so this doesn't need to travel per-ledger anymore.
  const increasesWith = reportData?.debtors ? 'DR' : 'CR';

  if (!reportData || !rootGroup) return null;

  const toggleRow = (rowId) => {
    setOpenRows((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  const handleViewLedger = (ledger) => {
    let cost_center_id = [];
    reportData?.filters?.cost_centers?.map((itm) => cost_center_id.push(itm?.id));

    setLiabilitiesPayload({
      from: reportData?.filters?.from
        ? dayjs(reportData.filters.from).toISOString()
        : dayjs(organization?.recording_start_date).toISOString(),
      to: reportData?.filters?.to
        ? dayjs(reportData.filters.to).toISOString()
        : dayjs().toISOString(),
      cost_center_ids: cost_center_id,
      with_item_description: true,
      ledger_id: ledger.id,
      liabilityName: ledger.name,
      increasesWith,
    });
    setOpenDialog(true);
  };

  const renderGroup = (group, level) => {
    const hasChildren = (group.children?.length > 0) || (group.ledgers?.length > 0);
    const isOpen = level === 0 || openRows.includes(`g-${group.id}`);

    return (
      <React.Fragment key={`g-${group.id}`}>
        <TableRow
          onClick={() => level > 0 && hasChildren && toggleRow(`g-${group.id}`)}
          sx={{
            cursor: level > 0 && hasChildren ? 'pointer' : 'default',
            backgroundColor: level === 0 ? mainColor : theme.palette.action.hover,
            '&:hover': level > 0 ? { bgcolor: 'action.selected' } : undefined,
          }}
        >
          <TableCell
            style={{ paddingLeft: level * 20 }}
            sx={{ color: level === 0 ? contrastText : undefined, fontWeight: 'bold' }}
          >
            {level > 0 && hasChildren && (isOpen ? <KeyboardArrowDown /> : <KeyboardArrowRight />)}
            <span style={{ marginLeft: 5 }}>{group.name}</span>
          </TableCell>
          <PeriodCells netOnly={netOnly}
            node={group}
            sx={{ color: level === 0 ? contrastText : undefined, fontWeight: 'bold' }}
          />
        </TableRow>
        {isOpen && group.children?.map((child) => renderGroup(child, level + 1))}
        {isOpen && group.ledgers?.map((ledger, index) => (
          <TableRow
            key={`l-${ledger.id}`}
            sx={{
              backgroundColor:
                index % 2 === 0 ? theme.palette.background.paper : theme.palette.action.hover,
            }}
          >
            <TableCell style={{ paddingLeft: (level + 1) * 20 }}>{ledger.name}</TableCell>
            <PeriodCells netOnly={netOnly}
              node={ledger}
              sx={{
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' },
              }}
              onClick={() => handleViewLedger(ledger)}
            />
          </TableRow>
        ))}
      </React.Fragment>
    );
  };

  return (
    <>
      <Box sx={{ marginTop: 3 }}>
        <TableContainer component={TablePaper}>
          <Table>
            <TableHead>
              <PeriodTableHead netOnly={netOnly}
                leadingLabels={['Name']}
                backgroundColor={mainColor}
                color={contrastText}
                filters={reportData.filters}
              />
            </TableHead>
            <TableBody>
              {renderGroup(rootGroup, 0)}
              <TableRow>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, borderBottom: 'none' }}>
                  Total
                </TableCell>
                <PeriodCells netOnly={netOnly}
                  node={reportData.total}
                  sx={{ backgroundColor: mainColor, color: contrastText, borderBottom: 'none', fontWeight: 'bold' }}
                />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {liabilitiesPayload && (
        <ProjectLiabilityDocumentDialog
          openDialog={openDialog}
          onClose={setOpenDialog}
          baseCurrency={baseCurrency}
          organization={authOrganization}
          user={user}
          liabilitiesPaylod={liabilitiesPayload}
        />
      )}
    </>
  );
};

export default DebtorCreditorOnScreen;
