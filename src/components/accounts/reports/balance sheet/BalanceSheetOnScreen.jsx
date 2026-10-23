import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import React, { useState } from 'react';
import { PeriodCells, PeriodTableHead, hasPeriodActivity } from '../periodColumns';

const BalanceSheetOnScreen = ({ reportData }) => {
  const [openRows, setOpenRows] = useState([]);

  const toggleRow = (rowId) => {
    setOpenRows((prevOpenRows) =>
      prevOpenRows.includes(rowId)
        ? prevOpenRows.filter((id) => id !== rowId)
        : [...prevOpenRows, rowId]
    );
  };

  // Each expanded node is followed by its own "Total <name>" row; the node
  // already carries the rolled-up figures, so the total just repeats them.
  const renderChildren = (parent, level) => (
    <>
      {parent.children.filter(hasPeriodActivity).map((child) => {
        const isOpen = openRows.includes(child.id);
        return (
          <React.Fragment key={child.id}>
            <TableRow onClick={() => toggleRow(child.id)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }}}>
              <TableCell style={{ paddingLeft: level * 20 }}>
                {child.children?.length > 0 && (isOpen ? <KeyboardArrowDown/> : <KeyboardArrowRight/>)}
                <span style={{ fontWeight: isOpen ? 'bold' : 'normal', marginLeft: level === 0 ? 5 : level === 1 ? 10 : 15 }}>{child.name}</span>
              </TableCell>
              <PeriodCells node={child} sx={{ fontWeight: isOpen ? 'bold' : 'normal' }} />
            </TableRow>
            {isOpen && child.children?.length > 0 && renderChildren(child, level + 1)}
          </React.Fragment>
        );
      })}
      <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
        <TableCell style={{ paddingLeft: level * 20 }}>
          <span>Total {parent.name}</span>
        </TableCell>
        <PeriodCells node={parent} />
      </TableRow>
    </>
  );

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="balance-sheet">
        <TableHead>
          <PeriodTableHead
            leadingLabels={['CATEGORY']}
            backgroundColor='transparent'
            color='inherit'
            filters={reportData.filters}
          />
        </TableHead>
        <TableBody>
          {reportData.balanceSheetData?.map((component, index) => {
            const isOpen = openRows.includes(component.id);
            return (
              <React.Fragment key={component.id}>
                <TableRow onClick={() => toggleRow(component.id)} sx={{cursor: 'pointer', '&:hover': {bgcolor: 'action.hover'}}}>
                  <TableCell>
                    {component.children?.length > 0 && (isOpen ? <KeyboardArrowDown/> : <KeyboardArrowRight/>)}
                    <span style={{ marginLeft: 5, fontWeight: isOpen ? 'bold' : 'normal' }}>{component.name}</span>
                  </TableCell>
                  <PeriodCells node={component} />
                </TableRow>
                {hasPeriodActivity(component) && isOpen && component.children?.length > 0 && renderChildren(component, index + 1)}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BalanceSheetOnScreen;
