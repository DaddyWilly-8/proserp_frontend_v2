import React from 'react';
import {
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  Divider,
  TableContainer,
  useTheme,
} from '@mui/material';

function CertificateOnScreen({ certificate, organization }) {
  const theme = useTheme();
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const headerColor = theme.palette.mode === 'dark' ? '#29f096' : mainColor;
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';
  const currencyCode = certificate.currency?.code || 'TZS';

  // Summary Items
  const grossItem = { id: 'gross', particular: 'Gross Amount Certified', amount: certificate.amount };
  const adjustmentItems = (certificate.adjustments || []).map((adj) => ({
    id: adj.id,
    particular: { action: adj.type === 'deduction' ? 'Less' : 'Add', text: adj.description },
    amount: adj.type === 'deduction' ? -adj.amount : adj.amount,
  }));

  // VAT
  const vatAmount = certificate.vat_percentage ? (certificate.amount * certificate.vat_percentage) / 100 : 0;
  const vatItem = certificate.vat_percentage
    ? {
        id: 'vat',
        particular: { action: 'Add', text: `${certificate.vat_percentage}% VAT` },
        amount: vatAmount,
      }
    : null;

  const summaryItems = vatItem ? [grossItem, ...adjustmentItems, vatItem] : [grossItem, ...adjustmentItems];
  const grandTotal = summaryItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // Certified Items
  const certifiedItems = certificate.items?.map((it) => {
    const previousQty = it.previous_certified_quantity || 0;
    const presentQty = it.certified_quantity || 0;
    const cumulativeQty = previousQty + presentQty;
    const rate = it.rate || 0;

    return {
      id: it.task?.id || Math.random(),
      description: it.task?.name || 'N/A',
      unit: it.measurement_unit?.symbol || '',
      contractQty: it.task?.quantity || 0,
      unitRate: rate,
      contractAmount: (it.task?.quantity || 0) * rate,
      previousQty,
      presentQty,
      cumulativeQty,
      previousAmount: previousQty * rate,
      presentAmount: presentQty * rate,
      cumulativeAmount: cumulativeQty * rate,
    };
  }) || [];

  // Format helpers
  const formatCurrency = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatQty = (v) => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 4 });

  // Zebra row styling
  const zebraRowSx = {
    '&:nth-of-type(even)': { backgroundColor: theme.palette.action.hover },
    '&:hover': { backgroundColor: `${mainColor}22 !important` },
  };

  return (
    <Grid container spacing={4} sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Grid size={12} textAlign="center">
        <Typography variant="h4" sx={{ color: headerColor, mb: 1 }}>
          CERTIFICATE SUMMARY
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Certificate No: {certificate.certificateNo || certificate.certificate_no || certificate.id}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Date: {new Date(certificate.certificate_date).toLocaleDateString()}
        </Typography>
        <Divider sx={{ my: 3, borderColor: headerColor, borderWidth: 2 }} />
      </Grid>

      {/* Payment Summary */}
      <Grid size={{ xs: 12, md: 7 }} ml="auto">
        <Typography variant="h6" sx={{ color: headerColor, mb: 2, textAlign: 'center' }}>
          Payment Summary
        </Typography>
        <TableContainer component={Paper} elevation={4}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: mainColor }}>
                <TableCell sx={{ color: contrastText, fontSize: '0.9rem' }}>S/N</TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.9rem' }}>Particulars</TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.9rem' }} align="right">
                  Amount ({currencyCode})
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryItems.map((item, i) => (
                <TableRow key={item.id} sx={zebraRowSx}>
                  <TableCell>{i + 1}.</TableCell>
                  <TableCell>
                    {typeof item.particular === 'string' ? (
                      item.particular
                    ) : (
                      <>
                        <Typography component="span" sx={{ fontStyle: 'italic', mr: 1 }}>
                          {item.particular.action}
                        </Typography>
                        {item.particular.text}
                      </>
                    )}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontFamily: 'monospace',
                      color: item.amount < 0 ? '#ff4444' : 'inherit',
                      fontWeight: item.amount < 0 || item.id === 'vat' ? 'bold' : 'normal',
                    }}
                  >
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ backgroundColor: mainColor, color: contrastText }}>
                  GRAND TOTAL ({currencyCode})
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ backgroundColor: mainColor, color: contrastText, fontFamily: 'monospace' }}
                >
                  {formatCurrency(grandTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Certified Items */}
      <Grid size={12} mt={5}>
        <Typography variant="h5" sx={{ color: headerColor, textAlign: 'center', mb: 3 }}>
          Certified Items
        </Typography>

        <TableContainer component={Paper} elevation={4}>
          <Table size="small">
            {/* GROUP HEADER */}
            <TableHead>
              <TableRow sx={{ backgroundColor: mainColor }}>
                <TableCell colSpan={4} sx={{ color: contrastText, textAlign: 'center' }}></TableCell>
                <TableCell colSpan={2} sx={{ color: contrastText, textAlign: 'center' }}>
                  Price Schedule
                </TableCell>
                <TableCell colSpan={3} sx={{ color: contrastText, textAlign: 'center' }}>
                  Quantity
                </TableCell>
                <TableCell colSpan={3} sx={{ color: contrastText, textAlign: 'center' }}>
                  Amount ({currencyCode})
                </TableCell>
              </TableRow>

              {/* SUB HEADER */}
              <TableRow sx={{ backgroundColor: mainColor + 'e0' }}>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }}>S/N</TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }}>Description</TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }}>Unit</TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }} align="right">
                  Qty
                </TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }} align="right">
                  Unit Rate
                </TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }} align="right">
                  Amount
                </TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }} align="right">
                  Previous
                </TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }} align="right">
                  Present
                </TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }} align="right">
                  Cumulative
                </TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }} align="right">
                  Previous
                </TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }} align="right">
                  Present
                </TableCell>
                <TableCell sx={{ color: contrastText, fontSize: '0.8rem' }} align="right">
                  Cumulative
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {certifiedItems.map((item, i) => (
                <TableRow key={item.id} sx={zebraRowSx}>
                  <TableCell>{i + 1}.</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="center">{item.unit}</TableCell>
                  <TableCell align="right">{formatQty(item.contractQty)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {formatCurrency(item.unitRate)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {formatCurrency(item.contractAmount)}
                  </TableCell>
                  <TableCell align="right">{formatQty(item.previousQty)}</TableCell>
                  <TableCell align="right" sx={{ color: headerColor }}>
                    {formatQty(item.presentQty)}
                  </TableCell>
                  <TableCell align="right">{formatQty(item.cumulativeQty)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {formatCurrency(item.previousAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: headerColor, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {formatCurrency(item.presentAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {formatCurrency(item.cumulativeAmount)}
                  </TableCell>
                </TableRow>
              ))}

              {/* GRAND TOTAL ROW */}
              {certifiedItems.length > 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="right" sx={{ backgroundColor: mainColor, color: contrastText }}>
                    GRAND TOTAL ({currencyCode})
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: mainColor, color: contrastText, fontFamily: 'monospace' }}>
                    {formatCurrency(certifiedItems.reduce((s, i) => s + i.contractAmount, 0))}
                  </TableCell>
                  <TableCell colSpan={3} sx={{ backgroundColor: mainColor }}></TableCell>
                  <TableCell align="right" sx={{ backgroundColor: mainColor, color: contrastText, fontFamily: 'monospace' }}>
                    {formatCurrency(certifiedItems.reduce((s, i) => s + i.previousAmount, 0))}
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: mainColor, color: contrastText, fontFamily: 'monospace' }}>
                    {formatCurrency(certifiedItems.reduce((s, i) => s + i.presentAmount, 0))}
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: mainColor, color: contrastText, fontFamily: 'monospace' }}>
                    {formatCurrency(certifiedItems.reduce((s, i) => s + i.cumulativeAmount, 0))}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export default CertificateOnScreen;