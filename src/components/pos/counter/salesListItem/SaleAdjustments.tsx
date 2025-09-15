import React, { useState } from 'react';
import posServices from '../../pos-services';
import {
  Alert,
  Box,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import SaleAdjustmentAction from './invoice/saleAdjustment/SaleAdjustmentAction';
import { useQuery } from '@tanstack/react-query';
import { SalesOrder } from '../SalesOrderType';

interface SaleAdjustmentsProps {
  expanded: boolean;
  sale: SalesOrder;
  activeTab: number;
}

interface Adjustment {
  id: number;
  invoiceNo: string;
  transaction_date: string;
  internal_reference?: string;
  customer_reference?: string;
  narration?: string;
  vfd_receipt?: string | null;
  adjustmentNo: string;
}

const SaleAdjustments: React.FC<SaleAdjustmentsProps> = ({ expanded, sale, activeTab }) => {
  const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null);
  const [openAdjustmentDeleteDialog, setOpenAdjustmentDeleteDialog] = useState(false);
  const [openAdjustmentEditDialog, setOpenAdjustmentEditDialog] = useState(false);

  const { data: saleAdjustments, isLoading } = useQuery<Adjustment[]>({
    queryKey: ['SaleAdjustments', { saleId: sale.id }],
    queryFn: () => posServices.saleRelatableAdjustments(sale.id),
    enabled:
      !!expanded &&
      activeTab === (!sale.is_instant_sale ? 3 : sale.payment_method === 'On Account' ? 2 : 1),
  });

  return (
    <>
      {isLoading && <LinearProgress />}

      {saleAdjustments?.length ? (
        saleAdjustments.map((adjustment) => (
          <Grid
            key={adjustment.id}
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              paddingX: 1,
            }}
            container
            columnSpacing={2}
            alignItems="center"
            mb={1}
          >
            <Grid size={{ xs: 12, md: 4, lg: 4 }}>
              <Tooltip title="Invoice No.">
                <Typography fontWeight="bold">{adjustment?.invoiceNo}</Typography>
              </Tooltip>
              <Tooltip title="Invoice Date">
                <Typography>{readableDate(adjustment?.transaction_date)}</Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 4, lg: 2 }}>
              <Tooltip title="Internal Reference">
                <Typography>{adjustment?.internal_reference}</Typography>
              </Tooltip>
              <Tooltip title="Customer Reference">
                <Typography variant="caption">{adjustment?.customer_reference}</Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 4, lg: 4 }} mt={0.5}>
              <Tooltip title="Narration">
                <Typography>{adjustment?.narration}</Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 12, lg: 2 }}>
              <Box display="flex" flexDirection="row" justifyContent="flex-end">
                {adjustment.vfd_receipt === null && (
                  <Tooltip title={`Edit ${adjustment.adjustmentNo}`}>
                    <IconButton
                      onClick={() => {
                        setSelectedAdjustment(adjustment);
                        setOpenAdjustmentEditDialog(true);
                      }}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {adjustment.vfd_receipt === null && (
                  <Tooltip title={`Delete ${adjustment.adjustmentNo}`}>
                    <IconButton
                      onClick={() => {
                        setSelectedAdjustment(adjustment);
                        setOpenAdjustmentDeleteDialog(true);
                      }}
                    >
                      <DeleteOutlined color="error" fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>
        ))
      ) : (
        !isLoading && (
          <Alert variant="outlined" severity="info">
            No Sale Adjustments found
          </Alert>
        )
      )}

      {/* SaleAdjustmentItemAction */}
      <SaleAdjustmentAction
        setOpenAdjustmentEditDialog={setOpenAdjustmentEditDialog}
        openAdjustmentDeleteDialog={openAdjustmentDeleteDialog}
        openAdjustmentEditDialog={openAdjustmentEditDialog}
        setOpenAdjustmentDeleteDialog={setOpenAdjustmentDeleteDialog}
        selectedAdjustment={selectedAdjustment}
        setSelectedAdjustment={setSelectedAdjustment as any}
      />
    </>
  );
};

export default SaleAdjustments;
