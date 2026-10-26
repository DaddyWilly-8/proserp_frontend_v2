'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import stakeholderServices from '@/components/masters/stakeholders/stakeholder-services';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import PurchaseOrderPaymentAndReceive from '@/components/procurement/purchases/purchaseOrderForm/PurchaseOrderPaymentAndReceive';
import PurchaseOrderSummary from '@/components/procurement/purchases/purchaseOrderForm/PurchaseOrderSummary';
import { Product } from '@/components/productAndServices/products/ProductType';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Tab,
  Tabs,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useMemo, useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { FormProvider, useForm } from 'react-hook-form';
import * as yup from 'yup';
import RFQPurchaseOrderTopInformation from './RFQPurchaseOrderTopInformation';
import RFQPurchaseOrderItemForm from './RFQPurchaseOrderItemForm';

interface Order {
  id?: number;
  rfq_id?: number;
  stakeholder_id?: number;
  stakeholder?: Stakeholder;
  order_date?: string;
  currency_id?: number;
  exchange_rate?: number;
  reference?: string;
  store?: { id: number };
  date_required?: string;
  remarks?: string;
  terms_of_payment?: string;
  instant_pay?: boolean;
  instant_receive?: boolean;
  credit_ledger?: { id: number };
  cost_centers?: CostCenter[];
  items?: Array<{
    rfq_response_item_id: number;
    product_id: number;
    measurement_unit_id: number;
    quantity: number;
    rate: number;
    vat_percentage: number;
    product?: Product;
    measurement_unit?: MeasurementUnit;
  }>;
}

interface FormValues {
  id?: number | null;
  rfq_id?: number;
  order_date: string;
  currency_id: number;
  exchange_rate: number;
  vat_registered: boolean;
  reference: string;
  stakeholder_id: number | null;
  store_id: number | null;
  date_required?: string;
  remarks?: string;
  terms_of_payment?: string;
  instant_pay: boolean;
  instant_receive: boolean;
  credit_ledger_id: number | null;
  cost_centers: any[];
  items: Array<{
    rfq_response_item_id: number;
    product_id: number;
    quantity: number;
    rate: number;
    measurement_unit_id: number;
    vat_percentage: number;
  }>;
  stakeholder_ledger_id?: number | null;
}

interface RFQPurchaseOrderFormProps {
  toggleOpen: (open: boolean) => void;
  order?: Order;
  rfqDetails?: any;
  rfqId?: number;
  totalOrders?: number;
  currentOrderIndex?: number;
}

const RFQPurchaseOrderForm: React.FC<RFQPurchaseOrderFormProps> = ({
  toggleOpen,
  order,
  rfqDetails,
  rfqId,
  totalOrders = 1
}) => {
  const dictionary = useDictionary();
  const { authOrganization, checkOrganizationPermission }= useJumboAuth();
  const [totalAmount, setTotalAmount]= useState(0);
  const [vatableAmount, setVatableAmount]= useState(0);
  const [order_date]= useState(
    order?.order_date ? dayjs(order.order_date) : dayjs()
  );
  const { enqueueSnackbar }= useSnackbar();
  const queryClient= useQueryClient();
  const [displayStoreSelector, setDisplayStoreSelector]= useState(false);
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay]= useState(false);
  const [addedStakeholder, setAddedStakeholder]= useState<any>(null);
  const [activeTab, setActiveTab]= useState(0);
  const [items, setItems]= useState<any[]>(order?.items || []);
  const canInstantPay = checkOrganizationPermission(
    PERMISSIONS.PURCHASES_INSTANT_PAY
  );
  const canInstantReceive = checkOrganizationPermission(
    PERMISSIONS.PURCHASES_INSTANT_RECEIVE
  );

  // Get currency from RFQ response
  const getResponseCurrency = () => {
    if (!rfqDetails?.responses) return { id: 1, exchangeRate: 1 };
    const response = rfqDetails.responses.find(
      (r: any) => Number(r.stakeholder?.id) === Number(order?.stakeholder_id)
    );
    return {
      id: response?.currency?.id || 1,
      exchangeRate: response?.currency?.exchangeRate || response?.exchange_rate || 1,
    };
  };

  const currency = getResponseCurrency();

  const validationSchema = yup.object({
    order_date: yup.string().required(dictionary.forms.rfqs.purchaseOrder.validation.orderDate),
    currency_id: yup
      .number()
      .positive(dictionary.forms.rfqs.purchaseOrder.validation.currency)
      .required(dictionary.forms.rfqs.purchaseOrder.validation.currency)
      .typeError(dictionary.forms.rfqs.purchaseOrder.validation.currency),
    cost_centers: yup
      .array()
      .min(1, dictionary.forms.rfqs.purchaseOrder.validation.costCenterMin)
      .required(dictionary.forms.rfqs.purchaseOrder.validation.costCenter)
      .typeError(dictionary.forms.rfqs.purchaseOrder.validation.costCenterMin),
    exchange_rate: yup
      .number()
      .positive(dictionary.forms.rfqs.purchaseOrder.validation.exchangeRate)
      .required(dictionary.forms.rfqs.purchaseOrder.validation.exchangeRate)
      .typeError(dictionary.forms.rfqs.purchaseOrder.validation.exchangeRate),
    stakeholder_id: yup.number().positive().nullable(),
    instant_pay: yup.boolean(),
    instant_receive: yup.boolean(),
    credit_ledger_id: yup
      .number()
      .nullable()
      .when('instant_pay', {
        is: true,
        then: (schema) =>
          schema
            .positive('Credit Account(From) is required')
            .required(dictionary.forms.rfqs.purchaseOrder.validation.creditAccount),
        otherwise: (schema) => schema.nullable(),
      }),
    store_id: yup.number().when(['instant_receive', 'displayStoreSelector'], {
      is: (instant_receive: boolean, displayStoreSelector: boolean) =>
        instant_receive && displayStoreSelector,
      then: (schema) =>
        schema
          .positive(dictionary.forms.rfqs.purchaseOrder.validation.receivingStore)
          .required(dictionary.forms.rfqs.purchaseOrder.validation.receivingStore),
      otherwise: (schema) => schema.nullable(),
    }),
    stakeholder_ledger_id: yup
      .number()
      .nullable()
      .when(['instant_pay', 'stakeholder_id', 'instant_receive'], {
        is: (
          instant_pay: boolean,
          stakeholder_id: number,
          instant_receive: boolean
        ) => instant_pay && !!stakeholder_id && !instant_receive,
        then: (schema) =>
          schema
            .positive(dictionary.forms.rfqs.purchaseOrder.validation.supplierNoAccount)
            .required(dictionary.forms.rfqs.purchaseOrder.validation.supplierNoAccount),
        otherwise: (schema) => schema.nullable(),
      }),
  });

  const getBool = (val: any, fallback: boolean) => {
    if (typeof val === 'boolean') return val;
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'object') return fallback;
    if (typeof val === 'string') return val === 'true';
    return !!val;
  };

  const formMethods = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: order?.id || null,
      rfq_id: rfqId || order?.rfq_id,
      order_date: order_date.toISOString(),
      currency_id: order?.currency_id || currency.id || 1,
      exchange_rate: order?.exchange_rate || currency.exchangeRate || 1,
      vat_registered: !!authOrganization?.organization.settings?.vat_registered,
      reference: order?.reference || '',
      stakeholder_id: order?.stakeholder_id || order?.stakeholder?.id || null,
      store_id:
        order?.instant_receive && canInstantReceive && order?.store
          ? order.store.id
          : null,
      date_required: order?.date_required,
      remarks: order?.remarks,
      terms_of_payment: order?.terms_of_payment,
      instant_pay: getBool(order?.instant_pay, canInstantPay) && canInstantPay,
      instant_receive:
        getBool(order?.instant_receive, false) && canInstantReceive,
      credit_ledger_id:
        order?.instant_pay && canInstantPay && order?.credit_ledger
          ? order.credit_ledger.id
          : null,
      cost_centers: order?.cost_centers || [],
      items: items,
    },
  });

  const {
    setValue,
    getValues,
    handleSubmit,
    watch,
    register,
    formState: { errors },
  } = formMethods;

  // Calculate order totals
  const orderTotalAmount = () => {
    let total = 0;
    let vatableTotal = 0;

    items.forEach((item: any) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const vatPercentage = Number(item.vat_percentage) || 0;
      const itemTotal = quantity * rate;
      total += itemTotal;
      vatableTotal += itemTotal * (vatPercentage * 0.01);
    });

    setTotalAmount(total);
    setVatableAmount(vatableTotal);
  };

  useEffect(() => {
    orderTotalAmount();
  }, [items]);

  useEffect(() => {
    if (!canInstantPay && getValues('instant_pay')) {
      setValue('instant_pay', false, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('credit_ledger_id', null, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('stakeholder_ledger_id', null, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    if (!canInstantReceive && getValues('instant_receive')) {
      setValue('instant_receive', false, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('store_id', null, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [canInstantPay, canInstantReceive, getValues, setValue]);

  const stakeholder_id = watch('stakeholder_id');
  const { data: stakeholderPayableLedgers } = useQuery({
    queryKey: ['stakeholderPayableLedgers', { stakeholderId: stakeholder_id }],
    queryFn: async () => {
      if (!stakeholder_id) return [];
      const ledgers = await stakeholderServices.getLedgers({
        stakeholder_id,
        type: 'all',
      });
      if (ledgers.length > 0) {
        setValue('stakeholder_ledger_id', ledgers[0].id);
      } else {
        setValue('stakeholder_ledger_id', null);
      }
      return ledgers;
    },
    enabled: !!stakeholder_id,
  });

  const addPurchaseOrder = useMutation({
    mutationFn: purchaseServices.add,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || dictionary.forms.rfqs.purchaseOrder.messages.createFailed;
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const updatePurchaseOrder = useMutation({
    mutationFn: purchaseServices.update,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || dictionary.forms.rfqs.purchaseOrder.messages.updateFailed;
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const saveMutation = useMemo(() => {
    return addPurchaseOrder.mutate;
  }, [order, updatePurchaseOrder, addPurchaseOrder]);

  const handleItemChange = (index: number, key: string, value: any) => {
    if (key === 'delete' && value === true) {
      setItems(items.filter((_: any, itemIndex: number) => itemIndex !== index));
    } else {
      const updatedItems = [...items];
      updatedItems[index][key] = value;
      setItems(updatedItems);
    }
  };

  const onSubmit = (data: FormValues) => {
    // Validate items
    if (items.length === 0) {
      enqueueSnackbar(dictionary.forms.rfqs.purchaseOrder.messages.atLeastOneItem, { variant: 'error' });
      return;
    }

    // Prepare items with rfq_response_item_id
    const submitData = {
      ...data,
      rfq_id: rfqId || order?.rfq_id,
      items: items.map((item) => ({
        rfq_response_item_id: item.rfq_response_item_id,
        product_id: item.product_id,
        measurement_unit_id: item.measurement_unit_id,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        vat_percentage: Number(item.vat_percentage || 0),
      })),
    };
    saveMutation(submitData);
  };

  return (
    <FormProvider {...formMethods}>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid textAlign={'center'} size={12} mb={1}>
            <Typography variant="h5">
              {dictionary.forms.rfqs.purchaseOrder.title}
            </Typography>
            {totalOrders > 1 && (
              <Typography variant="caption" color="text.secondary">
                {dictionary.forms.rfqs.purchaseOrder.multipleOrders}
              </Typography>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 8, lg: 9 }} mb={2}>
            <form autoComplete='off'>
              <RFQPurchaseOrderTopInformation
                setAddedStakeholder={setAddedStakeholder}
                addedStakeholder={addedStakeholder}
                setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay}
                stakeholderQuickAddDisplay={stakeholderQuickAddDisplay}
                order={order}
                order_date={order_date}
                rfqDetails={rfqDetails}
                setValue={setValue}
                watch={watch}
                register={register}
                errors={errors}
              />
            </form>
          </Grid>
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <PurchaseOrderSummary
              isApprovedPurchase={true}
              totalAmount={totalAmount}
              vatableAmount={vatableAmount}
              checked={false}
              setChecked={() => {}}
            />
          </Grid>

          <PurchaseOrderPaymentAndReceive
            instant_receive={watch('instant_receive')}
            instant_pay={watch('instant_pay')}
            displayStoreSelector={displayStoreSelector}
            setDisplayStoreSelector={setDisplayStoreSelector}
            order={order}
            items={items}
            errors={errors}
            setValue={setValue}
            watch={watch}
            register={register}
          />
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          sx={{ mb: 1 }}
        >
          <Tab label={dictionary.forms.rfqs.purchaseOrder.tabProducts} />
        </Tabs>

        {activeTab === 0 && (
          <>
            {errors?.items?.message && items.length < 1 && (
              <Alert severity='error' sx={{ mb: 2 }}>{errors.items.message}</Alert>
            )}
            {items.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {dictionary.forms.rfqs.purchaseOrder.noItems}
              </Alert>
            )}
            {items.map((item, index) => (
              <RFQPurchaseOrderItemForm
                key={item.rfq_response_item_id || index}
                index={index}
                item={item}
                handleItemChange={handleItemChange}
                totalItems={items.length}
                rfqDetails={rfqDetails}
              />
            ))}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          {dictionary.forms.rfqs.common.cancel}
        </Button>
        {items?.length > 0 && (
          <LoadingButton
            variant='contained'
            size='small'
            onClick={handleSubmit(onSubmit)}
            loading={addPurchaseOrder.isPending || updatePurchaseOrder.isPending}
          >
            {totalOrders > 1 ? dictionary.forms.rfqs.purchaseOrder.createAndNext : dictionary.forms.rfqs.common.submit}
          </LoadingButton>
        )}
      </DialogActions>
    </FormProvider>
  );
};

export default React.memo(RFQPurchaseOrderForm);