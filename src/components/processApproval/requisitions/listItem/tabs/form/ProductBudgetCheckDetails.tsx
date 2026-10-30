import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import {
  Dialog,
  Typography,
  Box,
  Grid,
  Skeleton,
  Divider,
  Paper,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import requisitionsServices from '@/components/processApproval/requisitionsServices';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';

interface ProductBudgetCheckDetailsProps {
  requisition?: any;
  productId: number;
  costCenterId: number;
  productName: string;
  measurementUnit: MeasurementUnit;
  currency: Currency;
  open: boolean;
  onClose: () => void;
}

const fetchProductBudgetCheck = async (productId: number, costCenterId: number) => {
  return requisitionsServices.productBudgetCheck({
    product_id: productId,
    cost_center_id: costCenterId,
  });
};

const StatItem = ({ label, value, unit, currency }: { label: string; value?: number; unit?: string;currency?: Currency }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">
      {currency ? ` ${currency.code}` : ''} {''}
      {value?.toLocaleString?.() ?? '0'}
      {unit ? ` ${unit}` : ''}
    </Typography>
  </Box>
);

/* ---------------- Section wrapper ---------------- */
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography
      variant="subtitle1"
      mb={1}
      color="text.primary"
    >
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    <Grid container spacing={2}>
      {children}
    </Grid>
  </Paper>
);

const ProductBudgetCheckDetails: React.FC<ProductBudgetCheckDetailsProps> = ({
  measurementUnit,
  currency,
  productId,
  costCenterId,
  productName,
  open,
  onClose,
}) => {
  const dictionary = useDictionary();
  const { data, isFetching } = useQuery({
    queryKey: ['productBudgetCheck', { productId, costCenterId }],
    queryFn: () => fetchProductBudgetCheck(productId, costCenterId),
    enabled: open && !!productId && !!costCenterId,
  });

  const unit = measurementUnit?.symbol;

  return (
    <Dialog open={open} maxWidth="md" fullWidth onClose={onClose}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" textAlign={'center'} fontWeight={700}>
            {dictionary.forms.requisitions.budgetCheck.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={'center'}>
            {productName}
          </Typography>
        </Box>

        {isFetching ? (
          <Skeleton variant="rectangular" width="100%" height={240} />
        ) : !costCenterId ? (
          <Typography color="text.secondary" textAlign={'center'}>
            {dictionary.forms.requisitions.budgetCheck.selectCostCenter}
          </Typography>
        ) : data ? (
          <Grid container spacing={3}>
            {/* Budget */}
            <Grid size={12}>
              <Section title={dictionary.forms.requisitions.budgetCheck.budgetAllocation}>
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.budgetedQuantity}
                    value={data.budgeted_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.budgetedAmount}
                    value={data.budgeted_amount}
                    currency={currency}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* Requests & Approval */}
            <Grid size={12}>
              <Section title={dictionary.forms.requisitions.budgetCheck.requestAndApproval}>
                <Grid size={{xs: 6, md: 3}}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.requestedQuantity}
                    value={data.requested_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{xs: 6, md: 3}}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.requestedAmount}
                    value={data.requested_amount}
                    currency={currency}
                  />
                </Grid>
                <Grid size={{xs: 6, md: 3}}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.approvedQuantity}
                    value={data.approved_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{xs: 6, md: 3}}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.approvedAmount}
                    value={data.approved_amount}
                    currency={currency}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* Execution */}
            <Grid size={12}>
              <Section title={dictionary.forms.requisitions.budgetCheck.procurementAndReceiving}>
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.orderedQuantity}
                    value={data.ordered_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.receivedQuantity}
                    value={data.received_quantity}
                    unit={unit}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* Consumption */}
            <Grid size={12}>
              <Section title={dictionary.forms.requisitions.budgetCheck.consumption}>
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.consumedQuantity}
                    value={data.consumed_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.consumedAmount}
                    value={data.consumed_amount}
                    currency={currency}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* Store Availability */}
            <Grid size={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  mb={2}
                >
                  {dictionary.forms.requisitions.budgetCheck.storeAvailability}
                </Typography>

                {data.store_availability?.length ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{dictionary.forms.requisitions.budgetCheck.store}</TableCell>
                          <TableCell align="right">
                            {dictionary.forms.requisitions.budgetCheck.availableQuantity}{unit ? ` (${unit})` : ''}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.store_availability.map((store: any) => (
                          <TableRow
                            key={store.id}
                            sx={{
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                          >
                            <TableCell>{store.name}</TableCell>
                            <TableCell align="right">{store.available_quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    {dictionary.forms.requisitions.budgetCheck.noStoreAvailability}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Typography color="text.secondary">
            {dictionary.forms.requisitions.budgetCheck.noBudgetData}
          </Typography>
        )}
      </Box>
    </Dialog>
  );
};

export default ProductBudgetCheckDetails;