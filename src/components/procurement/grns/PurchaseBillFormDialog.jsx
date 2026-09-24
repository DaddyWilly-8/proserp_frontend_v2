'use client';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import {
  AccountBalanceWalletOutlined,
  AddOutlined,
  DeleteOutline,
  InfoOutlined,
  LocalShippingOutlined,
  ReceiptLongOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import purchaseBillServices from './purchaseBill-services';
import purchaseServices from '../purchases/purchase-services';

const validationSchema = yup.object({
  transaction_date: yup.string().required('Bill date is required'),
  due_date: yup.string().nullable(),
  internal_reference: yup.string().max(20, 'Max 20 characters').nullable(),
  supplier_reference: yup.string().max(20, 'Max 20 characters').nullable(),
  vat_percentage: yup
    .number()
    .transform((value, original) => (original === '' ? undefined : value))
    .min(0, 'Must be at least 0')
    .max(100, 'Must not exceed 100')
    .nullable(),
  adjustments: yup.array().of(
    yup.object({
      complement_ledger_id: yup
        .number()
        .required('Ledger is required')
        .typeError('Ledger is required'),
      type: yup.string().required(),
      description: yup.string().required('Description is required'),
      amount: yup
        .number()
        .required('Amount is required')
        .positive('Amount must be greater than 0')
        .typeError('Amount is required'),
    })
  ),
  items: yup.array().of(
    yup.object({
      amount: yup
        .number()
        .required('Amount is required')
        .positive('Amount must be greater than 0')
        .typeError('Amount is required')
        .test(
          'max-remaining',
          'Amount exceeds the remaining balance for this item',
          function (value) {
            const remaining = Number(this.parent?.remaining_amount ?? 0);
            return value == null || value <= remaining;
          }
        ),
    })
  ),
  additional_costs: yup.array().of(
    yup.object({
      amount: yup
        .number()
        .required('Amount is required')
        .positive('Amount must be greater than 0')
        .typeError('Amount is required')
        .test(
          'max-remaining',
          'Amount exceeds the remaining balance for this cost',
          function (value) {
            const remaining = Number(this.parent?.remaining_amount ?? 0);
            return value == null || value <= remaining;
          }
        ),
    })
  ),
});

const SectionHeader = ({ icon, title, hint }) => (
  <Stack direction='row' spacing={0.75} alignItems='center'>
    {icon}
    <Typography variant='subtitle2' color='text.secondary'>
      {title}
    </Typography>
    {hint && (
      <Tooltip title={hint}>
        <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
      </Tooltip>
    )}
  </Stack>
);

/**
 * Creates (or, with `existingBill`, edits) a Purchase Bill either against a
 * GRN (inventory items) or directly against a Purchase Order (non-inventory
 * items, e.g. services, which never go through a GRN). Pass exactly one of
 * `grn` / `order` in both cases — for editing, that's the bill's own
 * `source` (same {id, orderNo|grnNo} shape used elsewhere), plus
 * `existingBill` (the full details from purchaseBillServices.details()).
 */
const PurchaseBillFormDialog = ({ grn, order, existingBill, setOpenDialog }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const [transactionDate] = useState(
    existingBill ? dayjs(existingBill.transaction_date) : dayjs()
  );

  const source = grn || order;
  const documentNo = grn ? grn.grnNo : order.orderNo;
  const orgVatPercentage = authOrganization?.organization?.settings?.vat_percentage || 0;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      internal_reference: existingBill?.internal_reference || '',
      supplier_reference: existingBill?.supplier_reference || '',
      narration: existingBill?.narration || '',
      transaction_date: transactionDate.toISOString(),
      due_date: existingBill?.due_date || null,
      vat_percentage: existingBill ? existingBill.vat_percentage || '' : orgVatPercentage || '',
      adjustments: existingBill?.adjustments?.map((adj) => ({
        complement_ledger_id: adj.complement_ledger?.id ?? adj.complement_ledger_id,
        type: adj.type,
        description: adj.description,
        amount: adj.amount,
        percentage: '',
        purchase_order_item_ids: adj.purchase_order_items?.map((i) => i.id) || [],
      })) || [],
      items: [],
      additional_costs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'adjustments',
  });

  const { fields: billItemFields, replace: replaceBillItems } = useFieldArray({
    control,
    name: 'items',
  });

  const { fields: billAdditionalCostFields, replace: replaceBillAdditionalCosts } = useFieldArray({
    control,
    name: 'additional_costs',
  });

  // Nothing is posted for a non-inventory item at order time anymore — its
  // expense/ledger classification and how much of it to bill are both
  // decided right here, at billing. Only relevant for direct-order bills
  // (grn is null); GRN-based bills cover Inventory items, whose ledger (10)
  // is fixed and posted at receipt, unrelated to this itemized flow.
  const { data: orderDetails } = useQuery({
    queryKey: ['purchaseBillOrderItems', order?.id],
    queryFn: () => purchaseServices.getEditComplements(order.id),
    enabled: !!order,
  });

  // Editing: this bill's own amounts still count as "billed" on the order
  // (see PurchaseOrderItem::supplier_invoice_items() — cleared only once
  // the edit is actually submitted), understating each item's/cost's
  // remaining_amount here by exactly what this bill already covers. Add it
  // back so editing isn't artificially capped below what's already on it.
  const existingItemAmounts = useMemo(() => {
    const map = {};
    (existingBill?.items || []).forEach((i) => {
      if (i.purchase_order_item_id) map[i.purchase_order_item_id] = Number(i.amount) || 0;
    });
    return map;
  }, [existingBill]);
  const existingCostAmounts = useMemo(() => {
    const map = {};
    (existingBill?.items || []).forEach((i) => {
      if (i.purchase_order_additional_cost_id) map[i.purchase_order_additional_cost_id] = Number(i.amount) || 0;
    });
    return map;
  }, [existingBill]);

  // Items with nothing left to bill (already fully billed) are excluded.
  const nonInventoryItems = useMemo(
    () =>
      (orderDetails?.purchase_order_items || [])
        .filter((item) => item.product?.type !== 'Inventory')
        .map((item) => ({
          ...item,
          remaining_amount: Number(item.remaining_amount) + (existingItemAmounts[item.id] || 0),
        }))
        .filter((item) => item.remaining_amount > 0),
    [orderDetails, existingItemAmounts]
  );

  useEffect(() => {
    if (nonInventoryItems.length > 0) {
      replaceBillItems(
        nonInventoryItems.map((item) => ({
          purchase_order_item_id: item.id,
          product_name: item.product?.item_name || item.product?.name,
          remaining_amount: Number(item.remaining_amount),
          amount: existingItemAmounts[item.id] ?? Number(item.remaining_amount),
          debit_ledger_id: null,
          vat_exempted: Boolean(item.vat_exempted),
        }))
      );
    }
  }, [nonInventoryItems]);

  // Additional costs (freight, PVOC, transportation, etc.) — billable
  // directly against the order only while it has no GRN yet; once a GRN
  // exists, a matching cost is billed through the GRN instead, so it's
  // excluded here to avoid offering something the backend will reject.
  const billableAdditionalCosts = useMemo(
    () =>
      orderDetails?.has_grn
        ? []
        : (orderDetails?.additional_costs || [])
            .map((cost) => ({
              ...cost,
              remaining_amount: Number(cost.remaining_amount) + (existingCostAmounts[cost.id] || 0),
            }))
            .filter((cost) => cost.remaining_amount > 0),
    [orderDetails, existingCostAmounts]
  );

  useEffect(() => {
    if (billableAdditionalCosts.length > 0) {
      replaceBillAdditionalCosts(
        billableAdditionalCosts.map((cost) => ({
          purchase_order_additional_cost_id: cost.id,
          ledger_name: cost.ledger?.name,
          remaining_amount: Number(cost.remaining_amount),
          amount: existingCostAmounts[cost.id] ?? Number(cost.remaining_amount),
          vat_exempted: Boolean(cost.vat_exempted),
        }))
      );
    }
  }, [billableAdditionalCosts]);

  // Amount is entered via CommaSeparatedField's onValueChange -> Controller's
  // onChange, which updates form state correctly, but plain watch() calls in
  // the render body don't reliably re-render on nested field-array changes
  // driven through Controller — useWatch is react-hook-form's documented,
  // reliable API for a reactively-recomputed value like netPayable.
  const vatPercentage = Number(useWatch({ control, name: 'vat_percentage' })) || 0;
  const adjustments = useWatch({ control, name: 'adjustments' });
  const items = useWatch({ control, name: 'items' });
  const additionalCosts = useWatch({ control, name: 'additional_costs' });

  // GRN bills still bill the GRN's whole unbilled_amount in one lump; a
  // direct-order bill's amount is the sum of whatever's entered per item/
  // additional cost above, which can be less than each one's full
  // remaining balance.
  const baseAmount = grn
    ? source?.unbilled_amount || 0
    : (items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0) +
      (additionalCosts || []).reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);

  // Portion of baseAmount that shouldn't attract VAT — e.g. CESS, entered
  // as a vat_exempted additional cost (see PurchaseOrderAdditionalCost::
  // vat_exempted on the backend, which is what actually decides this at
  // bill time — mirrored here only so the live preview matches it).
  const vatExemptAmount = grn
    ? source?.vat_exempt_amount || 0
    : (items || []).reduce((sum, item) => sum + (item.vat_exempted ? Number(item.amount) || 0 : 0), 0) +
      (additionalCosts || []).reduce((sum, cost) => sum + (cost.vat_exempted ? Number(cost.amount) || 0 : 0), 0);

  const netPayable = useMemo(() => {
    const vatAmount = ((baseAmount - vatExemptAmount) * vatPercentage) / 100;
    const adjustmentsTotal = (adjustments || []).reduce((sum, adj) => {
      const amount = Number(adj.amount) || 0;
      return sum + (adj.type === 'deduction' ? -amount : amount);
    }, 0);
    return baseAmount + vatAmount + adjustmentsTotal;
  }, [baseAmount, vatExemptAmount, vatPercentage, adjustments]);

  const { mutate: createBill, isPending } = useMutation({
    mutationFn: (payload) =>
      existingBill
        ? purchaseBillServices.update({ id: existingBill.id, ...payload })
        : grn
          ? purchaseBillServices.create({ grnId: grn.id, ...payload })
          : purchaseBillServices.createForOrder({ orderId: order.id, ...payload }),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] });
      if (existingBill) {
        queryClient.invalidateQueries({ queryKey: ['purchase-bill-details', existingBill.id] });
      }
      setOpenDialog(false);
    },
    onError: (error) => {
      // The generic "Please check the information you submitted" message
      // Laravel's Validator returns is useless on its own — surface the
      // actual per-field messages when present (client-side validation
      // should catch these first, but this is the fallback for whatever
      // it doesn't, e.g. a stale/duplicate-bill race).
      const validationErrors = error?.response?.data?.validation_errors;
      const detail = validationErrors
        ? Object.values(validationErrors).flat().join(' ')
        : null;
      enqueueSnackbar(
        detail || error?.response?.data?.message || `Failed to ${existingBill ? 'update' : 'create'} Purchase Bill`,
        { variant: 'error' }
      );
    },
  });

  // Recalculates an adjustment's Amount from its Percentage field whenever
  // either the percentage itself changes, or its "Applies To" selection
  // changes (add/remove an item shifts the % base between the whole bill
  // and the selected items' subtotal). Pass whichever one just changed;
  // the other is read from current form state.
  const recalcAdjustmentAmount = (index, changedPercentage, changedItemIds) => {
    const rawPercentage =
      changedPercentage !== undefined
        ? changedPercentage
        : getValues(`adjustments.${index}.percentage`);
    if (rawPercentage === '' || rawPercentage == null) return;

    const pct = Number(rawPercentage);
    if (Number.isNaN(pct)) return;

    const selectedItemIds =
      changedItemIds !== undefined
        ? changedItemIds
        : getValues(`adjustments.${index}.purchase_order_item_ids`) || [];

    const pctBase =
      selectedItemIds.length > 0
        ? billItemFields
            .filter((item) => selectedItemIds.includes(item.purchase_order_item_id))
            .reduce((sum, item) => sum + Number(item.amount || 0), 0)
        : baseAmount;

    setValue(`adjustments.${index}.amount`, Math.round(((pctBase * pct) / 100) * 100) / 100, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = (formData) => {
    createBill({
      ...formData,
      vat_percentage: formData.vat_percentage || undefined,
      adjustments: (formData.adjustments || []).map((adj) => ({
        complement_ledger_id: adj.complement_ledger_id,
        type: adj.type,
        description: adj.description,
        amount: adj.amount,
        purchase_order_item_ids:
          adj.purchase_order_item_ids?.length > 0 ? adj.purchase_order_item_ids : undefined,
      })),
      items: (formData.items || [])
        .filter((item) => Number(item.amount) > 0)
        .map((item) => ({
          purchase_order_item_id: item.purchase_order_item_id,
          amount: item.amount,
          debit_ledger_id: item.debit_ledger_id || undefined,
        })),
      additional_costs: (formData.additional_costs || [])
        .filter((cost) => Number(cost.amount) > 0)
        .map((cost) => ({
          purchase_order_additional_cost_id: cost.purchase_order_additional_cost_id,
          amount: cost.amount,
        })),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogTitle sx={{ textAlign: 'center' }}>
        {existingBill ? `Edit ${existingBill.invoiceNo} for ${documentNo}` : `Purchase Bill for ${documentNo}`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {/* Bill Details */}
          <Stack spacing={1.5}>
            <SectionHeader icon={<ReceiptLongOutlined fontSize='small' color='action' />} title='Bill Details' />
            <Grid container columnSpacing={1.5} rowSpacing={1.5}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Controller
                  name='transaction_date'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label='Bill Date'
                      value={dayjs(field.value)}
                      onChange={(newValue) =>
                        field.onChange(newValue ? newValue.toISOString() : null)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          error: !!errors.transaction_date,
                          helperText: errors.transaction_date?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Controller
                  name='due_date'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label='Due Date'
                      value={field.value ? dayjs(field.value) : null}
                      minDate={dayjs(getValues('transaction_date'))}
                      onChange={(newValue) =>
                        field.onChange(newValue ? newValue.toISOString() : null)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          error: !!errors.due_date,
                          helperText: errors.due_date?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label='Internal Ref.'
                  size='small'
                  error={!!errors.internal_reference}
                  helperText={errors.internal_reference?.message}
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  {...register('internal_reference')}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label='Supplier Ref.'
                  size='small'
                  error={!!errors.supplier_reference}
                  helperText={errors.supplier_reference?.message}
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  {...register('supplier_reference')}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={4}
                  label='Narration'
                  size='small'
                  {...register('narration')}
                />
              </Grid>
            </Grid>
          </Stack>

          <Divider />

          {/* Amount Summary — for a GRN bill this is the fixed goods value;
              for a direct-order bill it's the live sum of whatever's
              entered in Items to Bill below. */}
          <Box
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              px: 1.5,
              py: 1,
            }}
          >
            <Grid container columnSpacing={1.5} rowSpacing={1} alignItems='center'>
              <Grid size={{ xs: 12, sm: 7 }}>
                <Stack direction='row' spacing={0.5} alignItems='center'>
                  <Typography variant='body2' color='text.secondary'>
                    {grn ? 'Goods/Services Amount' : 'Items Total'}
                  </Typography>
                  <Tooltip title='Moves out of Unbilled Goods'>
                    <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </Tooltip>
                </Stack>
                <Typography variant='h6'>
                  {baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='VAT %'
                  size='small'
                  error={!!errors.vat_percentage}
                  helperText={
                    errors.vat_percentage?.message ||
                    (vatExemptAmount > 0
                      ? `From org settings — applied on the amount above, excluding ${vatExemptAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} that's VAT-exempt`
                      : 'From org settings — applied on the amount above')
                  }
                  {...register('vat_percentage')}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Items to Bill — direct-order bills only */}
          {billItemFields.length > 0 && (
            <>
              <Divider />
              <Stack spacing={1.5}>
                <SectionHeader
                  icon={<AccountBalanceWalletOutlined fontSize='small' color='action' />}
                  title='Items to Bill'
                  hint="Amount defaults to each item's full remaining balance — reduce it to bill only part of an item. Debit ledger defaults to the item's category expense ledger if left blank."
                />
                <Stack spacing={1}>
                  {billItemFields.map((field, index) => (
                    <Box
                      key={field.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1.5,
                      }}
                    >
                      <Grid container columnSpacing={2} rowSpacing={1} alignItems='center'>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant='body2' noWrap title={field.product_name}>
                            {field.product_name}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Remaining:{' '}
                            {Number(field.remaining_amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Controller
                            name={`items.${index}.amount`}
                            control={control}
                            render={({ field: amountField }) => (
                              <TextField
                                fullWidth
                                size='small'
                                label='Amount to Bill'
                                value={amountField.value ?? ''}
                                error={!!errors.items?.[index]?.amount}
                                helperText={errors.items?.[index]?.amount?.message}
                                InputProps={{ inputComponent: CommaSeparatedField }}
                                onChange={(e) =>
                                  amountField.onChange(
                                    e.target.value ? sanitizedNumber(e.target.value) : ''
                                  )
                                }
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Controller
                            name={`items.${index}.debit_ledger_id`}
                            control={control}
                            render={({ field: ledgerField }) => (
                              <LedgerSelect
                                label='Debit Ledger'
                                allowedGroups={['Direct Expenses', 'Indirect Expenses', 'Current Assets', 'Current Liabilities']}
                                onChange={(ledger) => ledgerField.onChange(ledger?.id ?? null)}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </>
          )}

          {/* Additional Costs to Bill — direct-order bills only, and only
              while the order has no GRN yet (see billableAdditionalCosts) */}
          {billAdditionalCostFields.length > 0 && (
            <>
              <Divider />
              <Stack spacing={1.5}>
                <SectionHeader
                  icon={<LocalShippingOutlined fontSize='small' color='action' />}
                  title='Additional Costs to Bill'
                  hint="Freight, PVOC, transportation, etc. entered on the order. Amount defaults to the full remaining balance — reduce it to bill only part of it now."
                />
                <Stack spacing={1}>
                  {billAdditionalCostFields.map((field, index) => (
                    <Box
                      key={field.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1.5,
                      }}
                    >
                      <Grid container columnSpacing={2} rowSpacing={1} alignItems='center'>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Stack direction='row' spacing={0.5} alignItems='center'>
                            <Typography variant='body2' noWrap title={field.ledger_name}>
                              {field.ledger_name}
                            </Typography>
                            {field.vat_exempted && (
                              <Tooltip title="This cost is excluded from VAT when the bill's VAT % is applied">
                                <Typography variant='caption' color='text.secondary'>
                                  (VAT Exempt)
                                </Typography>
                              </Tooltip>
                            )}
                          </Stack>
                          <Typography variant='caption' color='text.secondary'>
                            Remaining:{' '}
                            {Number(field.remaining_amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            name={`additional_costs.${index}.amount`}
                            control={control}
                            render={({ field: amountField }) => (
                              <TextField
                                fullWidth
                                size='small'
                                label='Amount to Bill'
                                value={amountField.value ?? ''}
                                error={!!errors.additional_costs?.[index]?.amount}
                                helperText={errors.additional_costs?.[index]?.amount?.message}
                                InputProps={{ inputComponent: CommaSeparatedField }}
                                onChange={(e) =>
                                  amountField.onChange(
                                    e.target.value ? sanitizedNumber(e.target.value) : ''
                                  )
                                }
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </>
          )}

          <Divider />

          {/* Adjustments */}
          <Stack spacing={1.5}>
            <SectionHeader
              icon={<RuleOutlined fontSize='small' color='action' />}
              title='Adjustments'
              hint='Withholding tax, retentions, penalties, discounts, etc.'
            />
            <Stack spacing={1.5}>
              {fields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <Grid container columnSpacing={1.5} rowSpacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name={`adjustments.${index}.complement_ledger_id`}
                        control={control}
                        render={({ field: ledgerField }) => (
                          <LedgerSelect
                            label='Ledger'
                            frontError={errors.adjustments?.[index]?.complement_ledger_id}
                            onChange={(ledger) =>
                              ledgerField.onChange(ledger?.id ?? null)
                            }
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Controller
                        name={`adjustments.${index}.type`}
                        control={control}
                        defaultValue='deduction'
                        render={({ field: typeField }) => (
                          <TextField
                            select
                            fullWidth
                            size='small'
                            label='Type'
                            {...typeField}
                          >
                            <MenuItem value='addition'>Addition</MenuItem>
                            <MenuItem value='deduction'>Subtraction</MenuItem>
                          </TextField>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Controller
                        name={`adjustments.${index}.percentage`}
                        control={control}
                        render={({ field: pctField }) => (
                          <TextField
                            fullWidth
                            type='number'
                            size='small'
                            label='%'
                            value={pctField.value ?? ''}
                            slotProps={{
                              input: {
                                endAdornment: (
                                  <InputAdornment position='end'>%</InputAdornment>
                                ),
                              },
                            }}
                            onChange={(e) => {
                              pctField.onChange(e.target.value);
                              recalcAdjustmentAmount(index, e.target.value);
                            }}
                          />
                        )}
                      />
                    </Grid>
                    {billItemFields.length > 0 && (
                      <Grid size={12}>
                        <Controller
                          name={`adjustments.${index}.purchase_order_item_ids`}
                          control={control}
                          defaultValue={[]}
                          render={({ field: itemsField }) => (
                            <Autocomplete
                              multiple
                              size='small'
                              options={billItemFields.map((item) => item.purchase_order_item_id)}
                              value={itemsField.value || []}
                              getOptionLabel={(itemId) =>
                                billItemFields.find((item) => item.purchase_order_item_id === itemId)
                                  ?.product_name || ''
                              }
                              onChange={(e, newValue) => {
                                itemsField.onChange(newValue);
                                recalcAdjustmentAmount(index, undefined, newValue);
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label='Applies To (optional — whole bill if blank)'
                                />
                              )}
                            />
                          )}
                        />
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        fullWidth
                        size='small'
                        label='Description'
                        error={!!errors.adjustments?.[index]?.description}
                        helperText={errors.adjustments?.[index]?.description?.message}
                        {...register(`adjustments.${index}.description`)}
                      />
                    </Grid>
                    <Grid size={{ xs: 10, sm: 4 }}>
                      <Controller
                        name={`adjustments.${index}.amount`}
                        control={control}
                        render={({ field: amountField }) => (
                          <TextField
                            fullWidth
                            size='small'
                            label='Amount'
                            value={amountField.value ?? ''}
                            error={!!errors.adjustments?.[index]?.amount}
                            helperText={errors.adjustments?.[index]?.amount?.message}
                            InputProps={{
                              inputComponent: CommaSeparatedField,
                            }}
                            onChange={(e) => {
                              amountField.onChange(
                                e.target.value ? sanitizedNumber(e.target.value) : ''
                              );
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid
                      size={{ xs: 2, sm: 1 }}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Tooltip title='Remove Adjustment'>
                        <IconButton onClick={() => remove(index)} color='error' size='small'>
                          <DeleteOutline fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Box>
                <Button
                  size='small'
                  startIcon={<AddOutlined />}
                  onClick={() =>
                    append({
                      type: 'deduction',
                      complement_ledger_id: null,
                      amount: '',
                      description: '',
                      percentage: '',
                      purchase_order_item_ids: [],
                    })
                  }
                >
                  Add Adjustment
                </Button>
              </Box>
            </Stack>
          </Stack>

          {/* Net Payable */}
          <Box
            sx={{
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'primary.main',
              borderRadius: 1,
              px: 2,
              py: 1.25,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
            }}
          >
            <Typography variant='body2' color='text.secondary'>Net Payable to Supplier</Typography>
            <Typography variant='h6' fontWeight='bold' color='primary.main'>
              {netPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)} size='small'>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          loading={isPending}
        >
          {existingBill ? 'Update Bill' : 'Create Bill'}
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default PurchaseBillFormDialog;
