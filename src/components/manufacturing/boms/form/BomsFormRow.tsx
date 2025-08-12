import { 
  Grid, 
  IconButton, 
  Typography,
  Divider,
  Tooltip,
  TextField,
  Button,
  Box,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { EditOutlined, DeleteOutlined, CheckOutlined } from '@mui/icons-material';
import React, { useState } from 'react';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { Product } from '@/components/productAndServices/products/ProductType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';

interface BomsFormRowItem {
  product?: Product | null;
  product_id?: number;
  quantity: number;
  measurement_unit_id?: number | null;
  unit_symbol?: string | null;
  conversion_factor?: number | null;
}

interface BomsFormRowProps {
  item: BomsFormRowItem;
  index: number;
  items: BomsFormRowItem[];
  setItems: React.Dispatch<React.SetStateAction<BomsFormRowItem[]>>;
}

const BomsFormRow: React.FC<BomsFormRowProps> = ({ 
  item, 
  index, 
  items, 
  setItems 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleRemove = () => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleUpdate = (updatedItem: BomsFormRowItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <BomsFormItemEditor
        item={item}
        onUpdate={handleUpdate}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <>
      <Box sx={{ py: 1, '&:hover': { backgroundColor: 'action.hover' } }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={1}>
            <Typography variant="body2">{index + 1}.</Typography>
          </Grid>
          
          <Grid size={5}>
            <Typography>{item.product?.name || 'Unknown Product'}</Typography>
          </Grid>
          
          <Grid size={3}>
            <Typography>
              {item.quantity} {item.unit_symbol || ''}
            </Typography>
          </Grid>
          
          <Grid size={3} textAlign="right">
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => setIsEditing(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Delete">
              <IconButton size="small" onClick={handleRemove} color="error">
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>
      <Divider />
    </>
  );
};

// Helper component for inline editing
const BomsFormItemEditor: React.FC<{ 
  item: BomsFormRowItem; 
  onUpdate: (item: BomsFormRowItem) => void; 
  onCancel: () => void;
}> = ({ item, onUpdate, onCancel }) => {
  // Initialize all fields with the current item values
  const [product, setProduct] = useState<Product | null>(item.product ?? null);
  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(
    item.measurement_unit_id ?? 
    item.product?.primary_unit?.id ?? 
    null
  );
  
  // Get combined units (primary + secondary)
  const combinedUnits: MeasurementUnit[] = [
    ...(product?.secondary_units || []),
    ...(product?.primary_unit ? [product.primary_unit] : []),
  ];

  const handleDone = () => {
    const selectedUnitData = combinedUnits.find(u => u.id === selectedUnit);
    onUpdate({ 
      ...item, 
      product,
      quantity,
      measurement_unit_id: selectedUnit ?? undefined,
      unit_symbol: selectedUnitData?.unit_symbol ?? item.unit_symbol,
      conversion_factor: selectedUnitData?.conversion_factor ?? item.conversion_factor ?? 1
    });
  };

  return (
    <Box sx={{ mb: 2, pt: 1, pl: 1, borderLeft: '2px solid', borderColor: 'primary.main' }}>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid size={{xs: 12, md: 5}}>
          <ProductSelect
            label="Product"
            value={product}
            defaultValue={item.product} // Ensure product is pre-selected
            onChange={(newProduct: Product | null) => {
              setProduct(newProduct);
              if (newProduct) {
                // Try to maintain the same unit if available in new product
                const availableUnits = [
                  ...(newProduct.secondary_units || []),
                  ...(newProduct.primary_unit ? [newProduct.primary_unit] : [])
                ];
                
                const unitToSelect = availableUnits.some(u => u.id === selectedUnit) 
                  ? selectedUnit 
                  : newProduct.primary_unit?.id ?? null;
                
                setSelectedUnit(unitToSelect);
              } else {
                setSelectedUnit(null);
              }
            }}
          />
        </Grid>
        
        <Grid size={{xs: 12, md: 5}}>
          <TextField
            label="Quantity"
            fullWidth
            size="small"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            InputProps={{
              inputComponent: CommaSeparatedField,
              endAdornment: product && (
                <FormControl variant="standard" sx={{ minWidth: 80, ml: 1 }}>
                  <Select
                    value={selectedUnit ?? ''}
                    onChange={(e) => setSelectedUnit(e.target.value as number)}
                    size="small"
                    displayEmpty
                  >
                    {combinedUnits.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.unit_symbol}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )
            }}
            sx={{
              '& .MuiInputBase-root': {
                paddingRight: product ? 0 : '14px'
              }
            }}
          />
        </Grid>
        
        <Grid size={{xs: 12, md: 2}} textAlign="center">
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleDone}
            startIcon={<CheckOutlined />}
            fullWidth
          >
            Done
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BomsFormRow;