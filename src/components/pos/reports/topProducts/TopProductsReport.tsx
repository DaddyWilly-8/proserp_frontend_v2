'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Organization, User } from '@/types/auth-types';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import posServices from '../../pos-services';
import ProductSalesCardPDF from '../../../dashboard/posCards/ProductSalesCardPDF';

const topOptions = [
  { name: 'Products', value: 'products' },
  { name: 'Categories', value: 'product categories' },
  { name: 'Brands', value: 'brands' },
];

const fmt = (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  open: boolean;
  onClose: () => void;
}

const TopProductsReport: React.FC<Props> = ({ open, onClose }) => {
  const { authUser, authOrganization, checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowSmScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const organization = authOrganization?.organization as Organization;
  const user = authUser?.user as User;
  const costCenters = authOrganization?.costCenters;

  const [from, setFrom] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [to, setTo] = useState<Dayjs | null>(dayjs().endOf('day'));
  const [top, setTop] = useState('products');
  const [orderBy, setOrderBy] = useState('profit');
  const [orderDirection, setOrderDirection] = useState('desc');
  const [limit, setLimit] = useState('10');
  const [salesPersonsSelected, setSalesPersonsSelected] = useState<string[]>([]);
  const [queryParams, setQueryParams] = useState<any>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const costCenterIds =
    user?.is_admin || checkOrganizationPermission('CostCenters:All')
      ? 'all'
      : (costCenters || []).map((cc: any) => cc.id);

  const { data: salesPersons = [] } = useQuery({
    queryKey: ['salesPerson'],
    queryFn: posServices.getSalesPerson,
    enabled: open,
  });

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['topProductsReport', queryParams],
    enabled: !!queryParams,
    queryFn: async () => {
      const res = await posServices.productSales(queryParams);
      return (Array.isArray(res) ? res : []).map((r: any) => ({
        ...r,
        unit_symbol: r.unit_symbol ?? '',
        quantity: Number(r.quantity ?? 0),
        revenue: Number(r.revenue ?? 0),
        cogs: Number(r.cogs ?? 0),
        profit: Number(r.profit ?? 0),
      }));
    },
  });

  const handleGenerate = () => {
    setShowPdf(false);
    setQueryParams({
      from: from?.toISOString(),
      to: to?.toISOString(),
      top,
      order_by: orderBy,
      order_direction: orderDirection,
      limit,
      cost_center_ids: costCenterIds,
      sales_persons: salesPersonsSelected,
    });
  };

  const selectedTop = topOptions.find((o) => o.value === top)?.name || top;
  const topProductsData = {
    params: queryParams || {},
    costCenters,
    user: user?.name,
  };

  const handleExcel = async () => {
    try {
      setIsExporting(true);
      const blob = await posServices.exportProductSalesExcel({
        popularProducts: rows,
        organization,
        topProductsData,
        selectedTop,
        salesPersonsSelected,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Top ${selectedTop} ${dayjs(to).format('YYYY-MM-DD')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth fullScreen={belowSmScreen} maxWidth='lg' scroll='paper'>
      <DialogTitle>Top Products Report</DialogTitle>
      <DialogContent>
        <Grid container spacing={1} mt={0.5} mb={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <DateTimePicker label='From' value={from} onChange={setFrom} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <DateTimePicker label='To' value={to} onChange={setTo} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='tp-top'>Top</InputLabel>
              <Select labelId='tp-top' label='Top' value={top} onChange={(e) => setTop(e.target.value)}>
                {topOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='tp-order'>Order By</InputLabel>
              <Select labelId='tp-order' label='Order By' value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
                <MenuItem value='profit'>Profit</MenuItem>
                <MenuItem value='revenue'>Sales</MenuItem>
                <MenuItem value='quantity'>Quantity</MenuItem>
                <MenuItem value='cogs'>CoGS</MenuItem>
                <MenuItem value='margin'>Margin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 1 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='tp-dir'>Order</InputLabel>
              <Select labelId='tp-dir' label='Order' value={orderDirection} onChange={(e) => setOrderDirection(e.target.value)}>
                <MenuItem value='desc'>Desc</MenuItem>
                <MenuItem value='asc'>Asc</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 1 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='tp-limit'>Limit</InputLabel>
              <Select labelId='tp-limit' label='Limit' value={limit} onChange={(e) => setLimit(e.target.value)}>
                {['5', '10', '20', '50', '100'].map((l) => (
                  <MenuItem key={l} value={l}>{l}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              size='small'
              options={salesPersons as string[]}
              value={salesPersonsSelected}
              onChange={(e, v) => setSalesPersonsSelected(v)}
              renderInput={(p) => <TextField {...p} label='Sales Person (all)' />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Stack direction='row' spacing={1} alignItems='center' justifyContent={{ xs: 'space-between', md: 'flex-end' }}>
              {rows.length > 0 && (
                <FileExportGrid
                  exportExcel
                  handlExcelExport={handleExcel}
                  exportingExcel={isExporting}
                  exportPdf
                  handlePdf={() => setShowPdf((p) => !p)}
                />
              )}
              <Button variant='contained' size='small' onClick={handleGenerate} disabled={!from || !to || isFetching}>
                Generate
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {isFetching && <LinearProgress />}
        {showPdf && rows.length > 0 ? (
          <PDFContent
            fileName='Top Product Sales'
            document={
              <ProductSalesCardPDF
                salesPersonsSelected={salesPersonsSelected}
                selectedTop={selectedTop}
                popularProducts={rows as any}
                topProductsData={topProductsData as any}
                organization={organization}
              />
            }
          />
        ) : queryParams && !isFetching && rows.length === 0 ? (
          <Alert severity='info' variant='outlined'>No product data was found</Alert>
        ) : rows.length > 0 ? (
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>{selectedTop}</TableCell>
                  <TableCell align='right'>Quantity</TableCell>
                  <TableCell align='right'>Revenue</TableCell>
                  <TableCell align='right'>CoGS</TableCell>
                  <TableCell align='right'>Profit</TableCell>
                  <TableCell align='right'>Margin</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r: any, i: number) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.name}</TableCell>
                    <TableCell align='right'>{`${r.unit_symbol} ${r.quantity.toLocaleString()}`}</TableCell>
                    <TableCell align='right'>{fmt(r.revenue)}</TableCell>
                    <TableCell align='right'>{fmt(r.cogs)}</TableCell>
                    <TableCell align='right'>{fmt(r.profit)}</TableCell>
                    <TableCell align='right'>{r.revenue ? `${fmt((r.profit * 100) / r.revenue)}%` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          !isFetching && <Typography color='text.secondary'>Set the filters and press Generate.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TopProductsReport;
