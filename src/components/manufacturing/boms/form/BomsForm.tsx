import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import BomsFormRow from './BomsFormRow';
import { AddOutlined, HighlightOff } from '@mui/icons-material';
import { Product } from '@/components/productAndServices/products/ProductType';
import bomsServices, { BomsFormValues } from '../boms-services';
import BomsFormItem from './BomsFormItem';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';

interface BomsFormProps {
  open: boolean;
  toggleOpen: (open: boolean) => void;
  bom?: any;
  onSuccess?: () => void;
}

function BomsForm({ open, toggleOpen, bom = null, onSuccess }: BomsFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>(bom?.items || []);
  const [outputProduct, setOutputProduct] = useState<Product | null>(bom?.output_product || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);

  const schema = yup.object().shape({
    output_product_id: yup
      .number()
      .required('Output product is required'),
    output_quantity: yup
      .number()
      .typeError('Output quantity must be a number')
      .positive('Output quantity must be greater than zero')
      .required('Output quantity is required'),
    items: yup
      .array()
      .min(1, 'At least one item is required')
      .of(
        yup.object().shape({
          product_id: yup.number().required('Product is required'),
          quantity: yup.number().required().positive(),
          measurement_unit_id: yup.number().required(),
          conversion_factor: yup.number().required().positive()
        })
      )
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
    trigger,
  } = useForm<BomsFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      output_product_id: bom?.output_product?.id || null,
      output_quantity: bom?.output_quantity || '',
      items: bom?.items || [],
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    setValue('items', items, { shouldValidate: false });
  }, [items, setValue]);

  useEffect(() => {
    if (isSubmitted) {
      trigger('items');
    }
  }, [items, isSubmitted, trigger]);

  const addBomMutation = useMutation({
    mutationFn: bomsServices.add,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const updateBomMutation = useMutation({
    mutationFn: ({ id, bom }: { id: number, bom: BomsFormValues }) => bomsServices.update(id, bom),
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to update BOM', { variant: 'error' });
    }
  });

  const onSubmit = (data: BomsFormValues) => {
    if (items.length === 0) {
      enqueueSnackbar('Please add at least one item', { variant: 'error' });
      return;
    }

    const payload = {
      output_product_id: outputProduct?.id,
      output_quantity: data.output_quantity,
      items: items.map(item => ({
        product_id: item.product?.id || item.product_id,
        quantity: item.quantity,
        measurement_unit_id: item.measurement_unit_id,
        conversion_factor: item.conversion_factor || 1
      }))
    };

    setIsSubmitting(true);
    if (bom) {
      updateBomMutation.mutate({ id: bom.id, bom: payload }, {
        onSettled: () => setIsSubmitting(false),
      });
    } else {
      addBomMutation.mutate(payload, {
        onSettled: () => setIsSubmitting(false),
      });
    }
  };

  return (
    <Dialog open={open} onClose={() => toggleOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h4" textAlign="center" mb={2}>
          {!bom ? 'New Bill of Material' : `Edit ${bom.id}`}
        </Typography>
      </DialogTitle>

      <DialogContent>
         <Grid container spacing={2} mb={3} sx={{ pt: 2 }}> 
           <Grid  size={{xs:12, md:8}}>
            <ProductSelect
              label="Output Product"
              value={outputProduct}
              onChange={(product: Product | null) => {
                setOutputProduct(product);
                setValue('output_product_id', product?.id);
              }}
              error={!!errors.output_product_id}
              helperText={errors.output_product_id?.message}
            />
          </Grid>

          <Grid  size={{xs:12, md:4}}>
            <TextField
              label="Quantity"
              fullWidth
              size="small"
              type="number"
              {...register('output_quantity')}
              error={!!errors.output_quantity}
              helperText={errors.output_quantity?.message}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                step: 'any'
              }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <BomsFormItem
              setItems={setItems}
              items={items}
              key={clearFormKey}
              setClearFormKey={setClearFormKey}
              setSubmitItemForm={setSubmitItemForm}
              submitItemForm={submitItemForm}
              submitMainForm={handleSubmit(onSubmit)}
            />
          </Grid>

          <Grid size={12}>
            {errors.items?.message && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.items.message}
              </Alert>
            )}

            {items.map((item, index) => (
              <BomsFormRow
                key={index}
                index={index}
                item={item as any}
                items={items as any}
                setItems={setItems as any}
              />
            ))}
          </Grid>
        </Grid>

        {isSubmitting && <LinearProgress />}
      </DialogContent>

      <DialogActions>
        <Button
          size="small"
          onClick={() => toggleOpen(false)}
          disabled={isSubmitting}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {bom ? 'Update' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BomsForm;