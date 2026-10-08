'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import currencyServices from './currency-services';
import { useQuery } from '@tanstack/react-query';
import { Currency } from './CurrencyType';

interface CurrencyContextValue {
    currencies?: Currency[];
    isLoadingCurrencies?: boolean;
}

const CurrencySelectContext = createContext<CurrencyContextValue>({});

export const useCurrencySelect = () => useContext(CurrencySelectContext);

interface CurrencySelectProviderProps {
    children: ReactNode;
}

// Used at the top of ~45 pages/forms across the app - blocking render on
// `currencies` here held every one of those pages behind a single API call
// before showing anything. Consumers (Autocomplete/Select options) already
// default to an empty array until `currencies` resolves, so there's nothing
// here that actually needs to gate the whole page.
function CurrencySelectProvider({ children }: CurrencySelectProviderProps) {
    const { data: result, isLoading } = useQuery({
        queryKey: ['currencies'],
        queryFn: currencyServices.getList
    });

    const currencies = result?.data || [];

    return (
        <CurrencySelectContext.Provider value={{ currencies, isLoadingCurrencies: isLoading }}>
            {children}
        </CurrencySelectContext.Provider>
    );
}

export default CurrencySelectProvider;