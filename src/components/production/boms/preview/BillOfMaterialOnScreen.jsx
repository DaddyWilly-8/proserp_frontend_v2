import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from '@mui/material';

function BillOfMaterialOnScreen({ billOfMaterial, organization }) {

  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  return (
    <Box p={2}>
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Grid size={{xs: 12, sm: 6}} textAlign={{ xs: 'left', sm: 'right' }}>
          <Typography variant="h6" fontWeight="bold" color={mainColor}>
            Bill Of Material
          </Typography>
          <Typography variant="subtitle1">{billOfMaterial.bomNo}</Typography>
        </Grid>
      </Grid>

      {/* Output product info */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{xs: 12, sm: 8}}>
          <Typography variant="subtitle2" color={mainColor}>
            Output Product
          </Typography>
          <Typography variant="body1">{billOfMaterial.product.name}</Typography>
        </Grid>
        <Grid size={{xs: 12, sm: 4}}>
          <Typography variant="subtitle2" color={mainColor}>
            Quantity
          </Typography>
          <Typography variant="body1">
            {billOfMaterial.quantity} {billOfMaterial.measurement_unit.symbol}
          </Typography>
        </Grid>
      </Grid>

      {/* Input products table */}
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: mainColor }}>
              <TableCell sx={{ color: contrastText, width: '5%' }}>S/N</TableCell>
              <TableCell sx={{ color: contrastText }}>Input Products</TableCell>
              <TableCell sx={{ color: contrastText, textAlign: 'right' }}>Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billOfMaterial.items?.map((item, index) => (
              <React.Fragment key={item.id}>
                <TableRow sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell align="right">
                    {item.quantity?.toLocaleString()} {item.measurement_unit.symbol}
                  </TableCell>
                </TableRow>

                {item.alternatives?.length > 0 && (
                  <>
                    <TableRow sx={{ backgroundColor: mainColor }}>
                      <TableCell />
                      <TableCell colSpan={2} sx={{ color: contrastText, textAlign: 'center' }}>
                        Alternative Input Products
                      </TableCell>
                    </TableRow>

                    {item.alternatives.map((alt, altIndex) => (
                      <TableRow
                        key={altIndex}
                      >
                        <TableCell />
                        <TableCell sx={{ backgroundColor: altIndex % 2 === 0 ? '#FFFFFF' : lightColor }}>{alt.product.name}</TableCell>
                        <TableCell align="right" sx={{ backgroundColor: altIndex % 2 === 0 ? '#FFFFFF' : lightColor }}>
                          {alt.quantity?.toLocaleString()} {item.measurement_unit.symbol}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Add space after the alternatives */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ py: 1 }} />
                    </TableRow>
                  </>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Created by */}
      <Box mt={2}>
        <Typography variant="body2" color={mainColor}>
          Created By
        </Typography>
        <Typography variant="body2">{billOfMaterial.creator.name}</Typography>
      </Box>
    </Box>
  );
}

export default BillOfMaterialOnScreen;
