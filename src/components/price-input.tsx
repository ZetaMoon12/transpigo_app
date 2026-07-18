import type { ChangeEvent, ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/helpers';

interface PriceInputProps
  extends Omit<ComponentProps<typeof Input>, 'type' | 'inputMode' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  locale?: string;
}

/**
 * Input de precio que se formatea como moneda mientras se escribe (ej. "150000" → "$ 150.000").
 * El valor que recibe `onChange` siempre es el número crudo en texto, sin formato ni decimales
 * — los precios en COP no usan centavos en este dominio.
 */
export function PriceInput({
  value,
  onChange,
  currency = 'COP',
  locale = 'es-CO',
  ...props
}: PriceInputProps) {
  const displayValue = value ? formatCurrency(Number(value), currency, locale) : '';

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    onChange(digitsOnly);
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
}
