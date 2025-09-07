import React from 'react';
import { 
  Grid, 
  Typography, 
  Table, 
  TableContainer, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Paper, 
  Divider, 
  Tooltip 
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Organization } from '@/types/auth-types';

interface SalesOutlet {
  name: string;
}

interface Creator {
  name: string;
}

interface Product {
  name: string;
  vat_exempted?: boolean;
}

interface MeasurementUnit {
  symbol: string;
}

interface SaleItem {
  id: number;
  product: Product;
  description: string;
  quantity: number;
  rate: number;
  measurement_unit: MeasurementUnit;
}

interface Sale {
  saleNo: string;
  reference?: string;
  transaction_date: string;
  sales_outlet: SalesOutlet;
  sales_person?: string;
  creator: Creator;
  stakeholder: Stakeholder;
  sale_items: SaleItem[];
  vat_percentage: number;
  vat_amount: number;
  amount: number;
  currency: Currency;
}

interface SalePreviewOnscreenProps {
  sale: Sale;
  organization: Organization;
}

const SalePreviewOnscreen: React.FC<SalePreviewOnscreenProps> = ({ sale, organization }) => {
  const currencyCode = sale.currency?.code;
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  return (
    <div>
      <Grid container spacing={1} textAlign="center">
        <Grid size={12}>
          <Typography variant="h4" style={{ color: mainColor }}>SALES ORDER</Typography>
          <Typography variant="body1" fontWeight="bold">{sale.saleNo}</Typography>
          {sale.reference && <Typography variant="body2">Ref: {sale.reference}</Typography>}
        </Grid>
      </Grid>

      <Grid container spacing={1} marginTop={2}>
        <Grid size={6}>
          <Typography variant="body2" style={{ color: mainColor }}>Sale Date & Time:</Typography>
          <Typography variant="body2">{readableDate(sale.transaction_date, true)}</Typography>
        </Grid>
        <Grid size={6}>
          <Typography variant="body2" style={{ color: mainColor }}>Outlet:</Typography>
          <Typography variant="body2">{sale.sales_outlet.name}</Typography>
        </Grid>
        {sale.sales_person &&
          <Grid size={6}>
            <Typography variant="body2" style={{ color: mainColor }}>Sales Person:</Typography>
            <Typography variant="body2">{sale.sales_person}</Typography>
          </Grid>
        }
        <Grid size={6}>
          <Typography variant="body2" style={{ color: mainColor }}>Served By:</Typography>
          <Typography variant="body2">{sale.creator.name}</Typography>
        </Grid>
      </Grid>

      <Grid container spacing={1} marginTop={2}>
        <Grid size={12} textAlign="center">
          <Typography variant="body2" style={{ color: mainColor, padding: '5px' }}>CLIENT</Typography>
          <Divider />
          <Typography variant="body1">{sale.stakeholder.name}</Typography>
          {sale.stakeholder?.address && <Typography variant="body2">{sale.stakeholder.address}</Typography>}
          {sale.stakeholder?.tin && (
            <Grid container justifyContent="space-between">
              <Typography variant="body2">TIN:</Typography>
              <Typography variant="body2">{sale.stakeholder.tin}</Typography>
            </Grid>
          )}
          {sale.stakeholder?.vrn && (
            <Grid container justifyContent="space-between">
              <Typography variant="body2">VRN:</Typography>
              <Typography variant="body2">{sale.stakeholder.vrn}</Typography>
            </Grid>
          )}
          {sale.stakeholder?.phone && (
            <Grid container justifyContent="space-between">
              <Typography variant="body2">Phone:</Typography>
              <Typography variant="body2">{sale.stakeholder.phone}</Typography>
            </Grid>
          )}
          {sale.stakeholder?.email && (
            <Grid container justifyContent="space-between">
              <Typography variant="body2">Email:</Typography>
              <Typography variant="body2">{sale.stakeholder.email}</Typography>
            </Grid>
          )}
        </Grid>
      </Grid>

      <TableContainer component={Paper} style={{ marginTop: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Product/Service</TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Qty</TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Price {sale?.vat_percentage ? '(Excl.)' : ''}</TableCell>
              {sale?.vat_percentage > 0 && (
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">VAT</TableCell>
              )}
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Amount {sale?.vat_percentage ? '(Incl.)' : ''}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sale.sale_items.map((saleItem, index) => (
              <TableRow key={saleItem.id} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div>{saleItem.product.name}</div>
                  {saleItem.description && <div>({saleItem.description})</div>}
                </TableCell>
                <TableCell align="right">{`${saleItem.quantity} ${saleItem.measurement_unit.symbol}`}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Price" arrow>
                    <Typography variant="body2">
                      {saleItem.rate.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </Typography>
                  </Tooltip>
                </TableCell>
                {sale?.vat_percentage > 0 && (
                  <TableCell align="right">
                    <Tooltip title="VAT" arrow>
                      <Typography variant="body2">
                        {(!saleItem.product?.vat_exempted
                          ? (sale.vat_percentage * saleItem.rate * 0.01).toLocaleString('en-US', { maximumFractionDigits: 2 })
                          : 0
                        )}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                )}
                <TableCell align="right">
                  <Tooltip title="Amount" arrow>
                    <Typography variant="body2">
                      {(saleItem.quantity * saleItem.rate * (!saleItem.product?.vat_exempted ? (100 + sale.vat_percentage) * 0.01 : 1))
                        .toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </Typography>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Grid container spacing={1} marginTop={5}>
        <Grid size={6}><Typography variant="body2" style={{ padding: '5px' }}>Total</Typography></Grid>
        <Grid size={6} textAlign="right"><Typography variant="body2" fontWeight="bold" style={{ padding: '5px' }}>{sale.amount.toLocaleString("en-US", { style: "currency", currency: currencyCode })}</Typography></Grid>
      </Grid>

      {sale.vat_percentage > 0 && (
        <>
          <Grid container spacing={1}>
            <Grid size={6}><Typography variant="body2" style={{ padding: '5px' }}>VAT</Typography></Grid>
            <Grid size={6} textAlign="right"><Typography variant="body2" fontWeight="bold" style={{ padding: '5px' }}>{sale.vat_amount.toLocaleString("en-US", { style: "currency", currency: currencyCode })}</Typography></Grid>
          </Grid>
          <Grid container spacing={1}>
            <Grid size={7}><Typography variant="body2" style={{ padding: '5px' }}>Grand Total (VAT Incl.)</Typography></Grid>
            <Grid size={5} textAlign="right"><Typography variant="body2" fontWeight="bold" style={{ padding: '5px' }}>{(sale.amount + sale.vat_amount).toLocaleString("en-US", { style: "currency", currency: currencyCode })}</Typography></Grid>
          </Grid>
        </>
      )}
    </div>
  );
};

export default SalePreviewOnscreen;