import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import ProjectLiabilityDocumentDialog from '@/components/projectManagement/projects/profile/dashboard/ProjectLiabilityDocumentDialog';
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
import { useState } from 'react';

const DebtorCreditorOnScreen = ({ reportData, authOrganization, user }) => {
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find((c) => c.is_base === 1);
  const organization = authOrganization?.organization;
  const theme = useTheme();
  const mainColor =
    authOrganization?.organization.settings?.main_color || '#2113AD';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : authOrganization?.organization.settings?.main_color || '#2113AD';
  const contrastText =
    authOrganization?.organization.settings?.contrast_text || '#FFFFFF';

  const [openDialog, setOpenDialog] = useState(false);

  let cost_center_id = [];
  reportData?.filters?.cost_centers?.map((itm) => cost_center_id.push(itm?.id));

  const [liabilitiesPayload, setLiabilitiesPayload] = useState({
    from: dayjs(organization?.recording_start_date).toISOString(),
    to: reportData?.filters?.as_at
      ? dayjs(reportData?.filters?.as_at).toISOString()
      : dayjs().toISOString(),
    cost_center_ids: cost_center_id,
    with_item_description: true,
  });

  return reportData ? (
    <>
      <Box sx={{ marginTop: 3 }}>
        <TableContainer component={TablePaper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                >
                  S/N
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                  align='right'
                >
                  Amount
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(reportData.debtors || reportData.creditors).map(
                (data, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor:
                        index % 2 === 0
                          ? theme.palette.background.paper
                          : theme.palette.action.hover,
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{data.name}</TableCell>
                    <TableCell
                      align='right'
                      onClick={() => {
                        setLiabilitiesPayload((prevPayload) => ({
                          ...prevPayload,
                          ledger_id: data.id,
                          liabilityName: data.name,
                          increasesWith: data.increasesWith,
                        }));
                        setOpenDialog(true);
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {data.amount?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                )
              )}
              <TableRow>
                <TableCell
                  colSpan={2}
                  align='left'
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                >
                  Total
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                >
                  {Object.values(reportData.debtors || reportData.creditors)
                    .reduce((total, item) => total + item.amount, 0)
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <ProjectLiabilityDocumentDialog
        openDialog={openDialog}
        onClose={setOpenDialog}
        baseCurrency={baseCurrency}
        organization={authOrganization}
        user={user}
        liabilitiesPaylod={liabilitiesPayload}
      />
    </>
  ) : null;
};

export default DebtorCreditorOnScreen;
