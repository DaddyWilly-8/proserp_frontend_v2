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
import { BOMAlternative } from '../BomType';

// Define TypeScript interfaces for the props
interface MeasurementUnit {
  symbol: string;
}

interface Product {
  name: string;
}

interface Alternative {
  product: Product;
  quantity: number;
}

interface Item {
  id: string;
  product: Product;
  quantity: number;
  measurement_unit: MeasurementUnit;
  alternatives: BOMAlternative[];
}

interface Creator {
  name: string;
}

interface OrganizationSettings {
  main_color?: string;
  light_color?: string;
  contrast_text?: string;
}

interface Organization {
  settings?: OrganizationSettings;
}

interface BOM {
  bomNo: string;
  product: Product;
  quantity: number;
  measurement_unit: MeasurementUnit;
  items?: Item[];
  creator: Creator;
}

interface BomOnScreenProps {
  bom: BOM;
  organization: Organization;
}

const BomOnScreen: React.FC<BomOnScreenProps> = ({ bom, organization }) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  return (
    <Box p={2}>
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Grid size={{ xs: 12, md: 6 }} textAlign={{ xs: 'left', sm: 'right' }}>
          <Typography variant="h6" fontWeight="bold" color={mainColor}>
            Bill Of Material
          </Typography>
          <Typography variant="subtitle1">{bom.bomNo}</Typography>
        </Grid>
      </Grid>

      {/* Output product info */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="subtitle2" color={mainColor}>
            Output Product
          </Typography>
          <Typography variant="body1">{bom.product.name}</Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" color={mainColor}>
            Quantity
          </Typography>
          <Typography variant="body1">
            {bom.quantity} {bom.measurement_unit.symbol}
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
            {bom.items?.map((item, index) => (
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
        <Typography variant="body2">{bom.creator.name}</Typography>
      </Box>
    </Box>
  );
};

export default BomOnScreen;