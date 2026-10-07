import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, ReactNode } from 'react';
import productServices from './productServices';
import { Product } from '@/components/productAndServices/products/ProductType';

// Define the context shape
interface ProductSelectContextType {
  productOptions: Product[];
  isLoadingProductOptions?: boolean;
}

// Create context with typed interface
const ProductSelectContext = createContext<ProductSelectContextType>({
  productOptions: [],
});

// Hook to use the context
export const useProductsSelect = () => useContext(ProductSelectContext);

interface ProductsSelectProviderProps {
  children: ReactNode;
}

// Used in 58+ files as a product-picker data source for forms/dialogs - the
// base page content underneath never needs this list itself, so blocking on
// it here held every one of those pages behind a single API call.
function ProductsSelectProvider({ children }: ProductsSelectProviderProps) {
  const { data: productOptions = [], isLoading } = useQuery<Product[]>({
    queryKey: ['product_select_options'],
    queryFn: productServices.getProductSelectOptions,
    refetchOnWindowFocus: true,
  });

  return (
    <ProductSelectContext.Provider value={{ productOptions, isLoadingProductOptions: isLoading }}>
      {children}
    </ProductSelectContext.Provider>
  );
}

export default ProductsSelectProvider;