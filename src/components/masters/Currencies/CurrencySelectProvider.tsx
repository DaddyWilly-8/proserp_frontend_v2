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

// Used in 46+ files as a currency-picker data source for forms/dialogs - the
// base page content underneath never needs this list itself, so blocking on
// it here held every one of those pages behind a single API call.
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