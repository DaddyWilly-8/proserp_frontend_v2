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
  const mainColor = organization?.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization?.settings?.main_color || "#2113AD");
  const contrastText = organization?.settings?.contrast_text || "#FFFFFF";
  const currencyCode = certificate.currency?.code || 'TZS';

  // Summary Items
  const grossItem = { id: 'gross', particular: 'Gross Amount Certified', amount: certificate.amount };
  const adjustmentItems = (certificate.adjustments || []).map((adj) => ({
    id: adj.id,
    particular: adj.description,
    amount: adj.type === 'deduction' ? -adj.amount : adj.amount,
  }));
  const summaryItems = [grossItem, ...adjustmentItems];
  const grandTotal = summaryItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // Certified Items with calculations
  const certifiedItems = certificate.items ?.map((it) => {
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
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" sx={{ color: headerColor, mb: 2, textAlign: 'center' }}>Payment Summary</Typography>
        <TableContainer component={Paper} elevation={4}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: mainColor }}>
                <TableCell sx={{ color: contrastText }}>S/N</TableCell>
                <TableCell sx={{ color: contrastText }}>Particulars</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Amount ({currencyCode})</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryItems.map((item, i) => (
                <TableRow key={item.id} sx={zebraRowSx}>
                  <TableCell>{i + 1}.</TableCell>
                  <TableCell>{item.particular}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', color: item.amount < 0 ? '#ff4444' : 'inherit' }}>
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ backgroundColor: mainColor, color: contrastText }}>
                  GRAND TOTAL ({currencyCode})
                </TableCell>
                <TableCell align="right" sx={{ backgroundColor: mainColor, color: contrastText, fontFamily: 'monospace' }}>
                  {formatCurrency(grandTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Certified Items - EXACTLY LIKE PDF */}
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
                <TableCell colSpan={2} sx={{ color: contrastText, textAlign: 'center' }}>Price Schedule</TableCell>
                <TableCell colSpan={3} sx={{ color: contrastText, textAlign: 'center' }}>Quantity</TableCell>
                <TableCell colSpan={3} sx={{ color: contrastText, textAlign: 'center' }}>Amount ({currencyCode})</TableCell>
              </TableRow>

              {/* SUB HEADER */}
              <TableRow sx={{ backgroundColor: mainColor + 'e0' }}>
                <TableCell sx={{ color: contrastText }}>S/N</TableCell>
                <TableCell sx={{ color: contrastText }}>Description</TableCell>
                <TableCell sx={{ color: contrastText }}>Unit</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Qty</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Unit Rate</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Amount</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Previous</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Present</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Cumulative</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Previous</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Present</TableCell>
                <TableCell sx={{ color: contrastText }} align="right">Cumulative</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {certifiedItems.map((item, i) => (
                <TableRow key={item.id} sx={zebraRowSx}>
                  <TableCell>{i + 1}.</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="center">{item.unit}</TableCell>
                  <TableCell align="right">{formatQty(item.contractQty)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatCurrency(item.unitRate)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatCurrency(item.contractAmount)}
                  </TableCell>
                  <TableCell align="right">{formatQty(item.previousQty)}</TableCell>
                  <TableCell align="right">
                    {formatQty(item.presentQty)}
                  </TableCell>
                  <TableCell align="right">{formatQty(item.cumulativeQty)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatCurrency(item.previousAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatCurrency(item.presentAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
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

      {/* Final Amount Box */}
      <Grid size={12} mt={6}>
        <Box sx={{ backgroundColor: mainColor, color: contrastText, p: 4, borderRadius: 2, textAlign: 'center', boxShadow: 8 }}>
          <Typography variant="h5" fontWeight="bold">
            Final Amount Payable: {currencyCode} {formatCurrency(grandTotal)}
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
}

export default CertificateOnScreen;