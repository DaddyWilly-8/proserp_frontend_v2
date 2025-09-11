import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import posServices from '../../../pos-services';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Div } from '@jumbo/shared';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';

interface Product {
  id: number;
  name: string;
  vat_exempted?: number;
}

interface MeasurementUnit {
  id: number;
  symbol: string;
}

interface Currency {
  id: number;
  code: string;
}

interface Stakeholder {
  id: number;
  name: string;
}

interface CostCenter {
  id: number;
  name: string;
}

interface InvoiceItem {
  id: number;
  product: Product;
  description: string;
  measurement_unit: MeasurementUnit;
  quantity: number;
  rate: number;
  vat_amount: number;
  vat_percentage: number;
}

interface InvoiceData {
  id?: number;
  invoiceNo: string;
  transaction_date: string;
  due_date: string | null;
  internal_reference: string;
  customer_reference: string;
  narration: string;
  terms_and_instructions: string;
  currency: Currency;
  stakeholder: Stakeholder;
  cost_centers: CostCenter[];
  items: InvoiceItem[];
  note_type?: string;
}

interface NoteTypeOption {
  name: string;
  value: string;
}

interface FormData {
  narration: string;
  transaction_date: string;
  note_type: string;
  currency_id: number;
  corresponding_to: string;
  corresponding_id?: number;
  stakeholder_id: number;
  cost_center_ids: number[];
  items: Array<{
    product_id: number | null;
    measurement_unit_id: number | null;
    quantity: number;
    rate: number;
    vat_percentage: number;
    description: string;
    complement_ledger_id: number;
  }>;
}

interface SalesInvoiceAdjustmentProps {
  invoiceData: InvoiceData;
  toggleOpen: (open: boolean) => void;
}

function SalesInvoiceAdjustment({ invoiceData, toggleOpen }: SalesInvoiceAdjustmentProps) {
  const [transaction_date] = useState<Dayjs>(invoiceData ? dayjs(invoiceData.transaction_date) : dayjs());
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const [totalAmount, setTotalAmount] = useState(0);
  const [vatableAmount, setVatableAmount] = useState(0);
  const [sale_items, setSale_items] = useState<InvoiceItem[]>(invoiceData ? invoiceData.items : []);
  const currencyCode = invoiceData.currency.code;

  const noteType: NoteTypeOption[] = [
    { name: 'Debit Note', value: 'debit' },
    { name: 'Credit Note', value: 'credit' },
  ];

  const invoiceAdjustment = useMutation({
    mutationFn: posServices.invoiceAdjustment,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['SaleInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const saveMutation = React.useMemo(() => invoiceAdjustment.mutate, [invoiceAdjustment.mutate]);

  const validationSchema = yup.object({
    transaction_date: yup.string().required('Invoice Date is required').typeError('Invoice Date is required'),
    note_type: yup.string().required('Note Type is required').typeError('Note Type is required'),
    items: yup.array().of(
      yup.object({
        complement_ledger_id: yup.number().required('Complement Ledger is required').min(1, 'Select a valid Complement Ledger'),
        measurement_unit_id: yup
          .number()
          .nullable()
          .when(['product_id', 'description'], {
            is: (product_id: number | null, description: string) => !product_id && !!description,
            then: (schema) =>
              schema.required('Measurement Unit is required').typeError('Measurement Unit is required'),
            otherwise: (schema) => schema.notRequired().nullable(),
          }),
        product_id: yup.number().nullable().notRequired(),
        description: yup.string().nullable().notRequired(),
      }).test(
        'product-or-description',
        'Either Product or Description must be provided',
        (value) => !!(value.product_id || value.description)
      )
    ),
  });

  const { setValue, register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      narration: invoiceData?.narration || '',
      transaction_date: transaction_date.toISOString(),
      note_type: invoiceData?.note_type || '',
      currency_id: invoiceData?.currency?.id || 1,
      corresponding_to: 'CustomerInvoice',
      corresponding_id: invoiceData?.id,
      stakeholder_id: invoiceData?.stakeholder?.id,
      cost_center_ids: invoiceData?.cost_centers?.map((cc) => cc.id) || [],
      items: sale_items.map((item) => ({
        product_id: item.product?.id || null,
        measurement_unit_id: item.measurement_unit?.id || null,
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        vat_percentage: item.vat_percentage || 0,
        description: item.description || '',
        complement_ledger_id: 0,
      })),
    },
  });

  const selectedNoteType = watch('note_type');
  const headerText =
    selectedNoteType === 'debit'
      ? `Debit Note to ${invoiceData.invoiceNo}`
      : selectedNoteType === 'credit'
      ? `Credit Note to ${invoiceData.invoiceNo}`
      : `Note For ${invoiceData.invoiceNo}`;

  const vat_registered = !!organization?.settings?.vat_registered;

  useEffect(() => {
    const total = sale_items.reduce((sum, item) => sum + (item.rate * item.quantity || 0), 0);
    const vatable = sale_items
      .filter((item) => item.product?.vat_exempted !== 1)
      .reduce((sum, item) => sum + (item.vat_amount || 0), 0);
    setTotalAmount(total);
    setVatableAmount(vatable);
  }, [sale_items]);

  const onSubmit = (data: FormData) => {
    const payload = {
      narration: data.narration,
      transaction_date: data.transaction_date,
      note_type: data.note_type,
      currency_id: invoiceData.currency.id,
      corresponding_to: 'CustomerInvoice',
      corresponding_id: invoiceData.id,
      stakeholder_id: invoiceData.stakeholder.id,
      cost_center_ids: invoiceData.cost_centers.map((cc) => cc.id),
      items: sale_items.map((item, index) => ({
        id: item.id,
        complement_ledger_id: data.items[index].complement_ledger_id,
        product_id: data.items[index].product_id,
        measurement_unit_id: data.items[index].product_id ? item.measurement_unit.id : data.items[index].measurement_unit_id,
        quantity: item.quantity,
        rate: item.rate,
        vat_percentage: item.vat_percentage,
        description: data.items[index].description,
      })),
    };
    saveMutation(payload);
  };

  return (
    <>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid size={{ xs: 12 }} mb={3} textAlign={'center'}>
            <Typography variant="h3">{headerText}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 9 }} mb={2}>
            <form autoComplete="off">
              <Grid container columnSpacing={1} rowSpacing={2}>
                <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <DateTimePicker
                      label="Note Date"
                      minDate={dayjs(organization?.recording_start_date)}
                      defaultValue={transaction_date}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          InputProps: {
                            readOnly: true,
                          },
                          error: !!errors?.transaction_date,
                          helperText: errors?.transaction_date?.message,
                        },
                      }}
                      onChange={(newValue: Dayjs | null) => {
                        setValue('transaction_date', newValue ? newValue.toISOString() : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <Autocomplete
                      id="checkboxes-noteType"
                      options={noteType}
                      isOptionEqualToValue={(option: NoteTypeOption, value: NoteTypeOption) => option.value === value.value}
                      getOptionLabel={(option: NoteTypeOption) => option.name}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Note Type"
                          size='small'
                          fullWidth
                          error={!!errors.note_type}
                          helperText={errors.note_type?.message}
                        />
                      )}
                      onChange={(e, newValue: NoteTypeOption | null) => {
                        setValue('note_type', newValue ? newValue.value : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      defaultValue={noteType.find((option) => option.value === invoiceData?.note_type)}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <CurrencySelector defaultValue={invoiceData ? invoiceData.currency.id : 1} disabled={true} />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <CostCenterSelector
                      multiple={true}
                      allowSameType={false}
                      defaultValue={invoiceData && invoiceData.cost_centers as any}
                      disabled={true}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <StakeholderSelector
                      label="Client"
                      frontError={errors?.stakeholder_id as any}
                      defaultValue={invoiceData?.stakeholder.id}
                      disabled={true}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <TextField
                      size="small"
                      label="Narration"
                      fullWidth
                      multiline={true}
                      minRows={2}
                      {...register('narration')}
                    />
                  </Div>
                </Grid>
              </Grid>
            </form>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Grid container columnSpacing={1}>
              <Grid size={{ xs: 12 }}>
                <Typography align="center" variant="h3">
                  Summary
                </Typography>
                <Divider />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography align="left" variant="body2">
                  Total:
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography align="right" variant="h5">
                  {totalAmount.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
                </Typography>
              </Grid>
              {vat_registered && (
                <>
                  <Grid size={{ xs: 6 }}>
                    <Typography align="left" variant="body2">
                      VAT Amount:
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography align="right" variant="h5">
                      {vatableAmount.toLocaleString('en-US', { style: 'currency', currency: currencyCode }) || 0}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography align="left" variant="body2">
                      Grand Total:
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography align="right" variant="h5">
                      {(totalAmount + vatableAmount).toLocaleString('en-US', {
                        style: 'currency',
                        currency: currencyCode,
                      })}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent>
        {sale_items?.map((item, index) => {
          const hasProduct = !!watch(`items.${index}.product_id`);
          return (
            <Grid
              container
              spacing={1}
              key={index}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>
              <Grid size={{ xs: 0.5 }}>
                <Div sx={{ mt: 1.7, mb: 1.7 }}>{index + 1}.</Div>
              </Grid>
              <Grid size={{ xs: 11.5, md: 5.75, lg: 5.75 }}>
                <Div sx={{ mt: 0.3 }}>
                  <Autocomplete
                    id={`product-select-${index}`}
                    options={invoiceData.items.map((it) => it.product)}
                    getOptionLabel={(option: Product) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Product"
                        size="small"
                        fullWidth
                        error={!!errors?.items?.[index]?.product_id}
                        helperText={errors?.items?.[index]?.product_id?.message}
                      />
                    )}
                    onChange={(e, newValue: Product | null) => {
                      setValue(`items.${index}.product_id` as const, newValue ? newValue.id : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      if (!newValue) {
                        setValue(`items.${index}.measurement_unit_id` as const, null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                    defaultValue={item.product}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: !hasProduct ? 4.25 : 5.75, lg: !hasProduct ? 4.25 : 5.75 }} textAlign="center">
                <Div sx={{ mt: 0.3 }}>
                  <LedgerSelect
                    frontError={errors?.items?.[index]?.complement_ledger_id}
                    onChange={(newValue: any) => {
                      setValue(`items.${index}.complement_ledger_id` as const, newValue ? newValue.id : 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    label="Complement ledger"
                  />
                </Div>
              </Grid>
              {!hasProduct && (
                <Grid size={{ xs: 12, md: 1.5, lg: 1.5 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <MeasurementSelector
                      label="Unit"
                      frontError={errors?.items?.[index]?.measurement_unit_id as any}
                      onChange={(newValue: any) => {
                        setValue(`items.${index}.measurement_unit_id`, newValue ? newValue.id : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
              )}
              <Grid size={{ xs: 2, md: 2, lg: 2 }} textAlign="end">
                <Div sx={{ mt: 1.7, mb: 1.7 }}>
                  <Tooltip title="Quantity">
                    <Typography>{`${item.measurement_unit.symbol || item.measurement_unit} ${item.quantity}`}</Typography>
                  </Tooltip>
                </Div>
              </Grid>
              <Grid size={{ xs: 4, md: 2.1, lg: 2.1 }} textAlign="end">
                <Div sx={{ mt: 1.7, mb: 1.7 }}>
                  <Tooltip title="Rate">
                    <Typography>{item.rate?.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}</Typography>
                  </Tooltip>
                </Div>
              </Grid>
              <Grid size={{ xs: 4, md: 2.15, lg: 2.15 }} textAlign="end">
                <Div sx={{ mt: 1.7, mb: 1.7 }}>
                  <Tooltip title="Amount">
                    <Typography>
                      {(item.rate * item.quantity).toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
                    </Typography>
                  </Tooltip>
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 5.75, lg: 5.75 }}>
                <Div sx={{ mt: 0.3 }}>
                  <TextField
                    size="small"
                    label="Description"
                    fullWidth
                    error={!!errors?.items?.[index]?.description}
                    helperText={errors?.items?.[index]?.description?.message}
                    {...register(`items.${index}.description`)}
                    onChange={(e: any) => {
                      setValue(`items.${index}.description`, e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              {errors?.items?.[index]?.message && (
                <Grid size={{ xs: 12 }} textAlign={'center'}>
                  <Typography variant="h5" color="error">
                    {errors.items[index].message}
                  </Typography>
                </Grid>
              )}
            </Grid>
          );
        })}
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={invoiceAdjustment.isPending}
          size="small"
          type="submit"
          variant="contained"
          onClick={handleSubmit(onSubmit)}
        >
          Invoice
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default SalesInvoiceAdjustment;