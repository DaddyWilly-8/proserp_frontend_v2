'use client'

import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { TextField, TextFieldProps } from '@mui/material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';

type NumberFieldProps = Omit<TextFieldProps, 'onChange' | 'value' | 'type'> & {
  value?: string | number | null;
  /** Called with the plain number as text ("1500.5"), without the thousands separators the box shows. */
  onChange: (plain: string) => void;
  /** Whole numbers only (a count of animals): no decimal point. */
  integer?: boolean;
};

/** A number box for money, quantities and counts: the platform's number field with thousands separators, keeping the plain number as its value. */
const NumberField = ({ value, onChange, integer, ...rest }: NumberFieldProps) => {
  const slots = (rest.slotProps ?? {}) as any;

  return (
    <TextField
      size='small'
      fullWidth
      {...rest}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value.replace(/,/g, ''))}
      slotProps={{
        ...slots,
        input: { ...(slots.input ?? {}), inputComponent: CommaSeparatedField as any },
        htmlInput: { ...(slots.htmlInput ?? {}), allowNegative: false, ...(integer ? { decimalScale: 0 } : {}) },
      }}
    />
  );
};

/** The same, wired to a react-hook-form field. */
export function FormNumber<T extends FieldValues>({ control, name, onValue, ...rest }: Omit<NumberFieldProps, 'value' | 'onChange'> & { control: Control<T>; name: Path<T>; onValue?: (plain: string) => void }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => <NumberField {...rest} value={field.value as any} onChange={(plain) => { field.onChange(plain); onValue?.(plain); }} />}
    />
  );
}

export default NumberField;
