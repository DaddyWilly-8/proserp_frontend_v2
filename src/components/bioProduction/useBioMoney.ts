import { useQuery } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import currencyServices from '@/components/masters/Currencies/currency-services';
import { Currency } from '@/components/masters/Currencies/CurrencyType';

/**
 * Formats an amount in the organization's base currency, with its symbol in front, so a figure on a card
 * reads as money rather than as a plain number. Falls back to the currency code when the symbol is unknown.
 * Reads the currency list itself (shared with the rest of the app by query key) so it needs no provider around the page.
 */
export const useBioMoney = () => {
  const { authOrganization } = useJumboAuth();
  const { data: result } = useQuery({ queryKey: ['currencies'], queryFn: currencyServices.getList, staleTime: 5 * 60 * 1000 });
  const currencies: Currency[] = result?.data ?? [];
  const base = currencies.find((currency) => !!currency.is_base);
  const code = authOrganization?.organization?.base_currency?.code ?? base?.code ?? '';
  const symbol = currencies.find((currency) => currency.code === code)?.symbol || code;

  return (value: number | string | null | undefined) =>
    value == null ? '—' : `${symbol ? `${symbol} ` : ''}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
