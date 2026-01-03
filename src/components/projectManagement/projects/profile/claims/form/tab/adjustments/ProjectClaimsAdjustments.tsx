import {
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import OperationSelector from '@/components/sharedComponents/OperationSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

interface Adjustment {
  type?: string;
  type_name?: string;
  description?: string;
  amount?: number;
  complement_ledger_id?: number;
  complement_ledger?: {
    id: number;
  };
}

interface ProjectClaimsAdjustmentsProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: (dirty: boolean) => void;
  index?: number;
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
  adjustment?: Adjustment;
  adjustments: Adjustment[];
  setAdjustments: React.Dispatch<React.SetStateAction<Adjustment[]>>;
}

interface FormValues {
  type: string;
  type_name?: string;
  description: string;
  amount: number;
  complement_ledger_id: number | null;
}

const ProjectClaimsAdjustments: React.FC<ProjectClaimsAdjustmentsProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  index = -1,
  setShowForm,
  adjustment,
  adjustments,
  setAdjustments,
}) => {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const normalizeType = (type?: string): string => {
    if (!type) return '-';
    return type === 'addition' || type === '+' ? '+' : '-';
  };

  const validationSchema = yup.object({
    type: yup.string().required('Type is required'),
    description: yup.string().required('Description is required'),
    amount: yup
      .number()
      .required('Amount is required')
      .positive('Amount is required'),
    complement_ledger_id: yup
      .number()
      .required('Complement Ledger is required'),
  });

  const {
    setValue,
    handleSubmit,
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      amount: adjustment?.amount,
      description: adjustment?.description ?? '',
      complement_ledger_id:
        adjustment?.complement_ledger_id ||
        adjustment?.complement_ledger?.id ||
        null,
      type: normalizeType(adjustment?.type),
      type_name: adjustment?.type_name,
    },
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  const updateItems = async (item: FormValues) => {
    setIsAdding(true);

    if (index > -1) {
      const updatedAdjustments = [...adjustments];
      updatedAdjustments[index] = item;
      setAdjustments(updatedAdjustments);
    } else {
      setAdjustments((prev) => [...prev, item]);
      if (submitItemForm) submitMainForm();
      setSubmitItemForm(false);
    }

    setClearFormKey((prev) => prev + 1);
    reset();
    setIsAdding(false);
    setShowForm?.(false);
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <Grid container spacing={1} mt={0.5} width="100%">
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 0.3 }}>
          <OperationSelector
            label="Type"
            frontError={errors?.type}
            defaultValue={normalizeType(adjustment?.type)}
            onChange={(newValue: any) => {
              setValue('type_name', newValue?.label);
              setValue('type', newValue?.value ?? '', {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 0.3 }}>
          <LedgerSelect
            multiple={false}
            label="Complement Ledger"
            defaultValue={ungroupedLedgerOptions?.find(
              (ledger: any) => ledger.id === watch('complement_ledger_id')
            )}
            allowedGroups={['Expenses', 'Fixed Assets', 'Liabilities']}
            frontError={errors?.complement_ledger_id}
            onChange={(newValue: any) => {
              setValue('complement_ledger_id', newValue?.id ?? null, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size="small"
            fullWidth
            label="Amount"
            error={!!errors?.amount}
            helperText={errors?.amount?.message}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
            }}
            onChange={(e) =>
              setValue(
                'amount',
                e.target.value ? sanitizedNumber(e.target.value) : 0,
                { shouldValidate: true, shouldDirty: true }
              )
            }
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size="small"
            fullWidth
            multiline
            rows={2}
            label="Description"
            error={!!errors?.description}
            helperText={errors?.description?.message}
            onChange={(e) =>
              setValue('description', e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
        </Div>
      </Grid>

      <Grid size={12} textAlign="end">
        <LoadingButton
          variant="contained"
          size="small"
          onClick={handleSubmit(updateItems)}
          sx={{ mb: 0.5 }}
        >
          {adjustment ? (
            <>
              <CheckOutlined fontSize="small" /> Done
            </>
          ) : (
            <>
              <AddOutlined fontSize="small" /> Add
            </>
          )}
        </LoadingButton>

        {adjustment && (
          <Tooltip title="Close Edit">
            <IconButton size="small" onClick={() => setShowForm?.(false)}>
              <DisabledByDefault fontSize="small" color="success" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
};

export default ProjectClaimsAdjustments;
