'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import bomsServices from './boms-services';
import BomsActionTail from './BomActionTail';
import BomsListItem from './BomsListItem';
import { BOM } from './BomType';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductsProvider from '@/components/productAndServices/products/ProductsProvider';

  const Boms = () => {
    const params = useParams<{ id?: string; keyword?: string }>();
    const listRef = useRef<any>(null);
    const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
    const [mounted, setMounted] = useState(false);

    const [queryOptions, setQueryOptions] = useState({
      queryKey: 'boms',
      queryParams: { id: params.id, keyword: '' },
      countKey: 'total',
      dataKey: 'data',
    });

    useEffect(() => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: { ...state.queryParams, id: params.id },
      }));
    }, [params]);

    const renderBOM = useCallback((bom: BOM) => <BomsListItem bom={bom} />, []);

    const handleOnChange = useCallback((keyword: string) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          keyword,
        },
      }));
    }, []);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!organizationHasSubscribed(MODULES.MANUFACTURING_AND_PROCESSING)) {
      return <UnsubscribedAccess modules="Manufacturing & Processing" />;
    }

    if (
      !checkOrganizationPermission([
        PERMISSIONS.BOM_CREATE,
        PERMISSIONS.BOM_READ,
        PERMISSIONS.BOM_EDIT
      ])
    ) {
      return <UnauthorizedAccess />;
    }

    return (
      <ProductsProvider>
        <ProductsSelectProvider>
      <React.Fragment>
        <Typography variant="h4" mb={2}>
          BOMs
        </Typography>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={bomsServices.getList}
          primaryKey="id"
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 8, 10, 15, 20]}
          renderItem={renderBOM}
          componentElement="div"
          wrapperSx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
          toolbar={
            <JumboListToolbar
              hideItemsPerPage={true}
              actionTail={
                <Stack direction="row">
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                  <BomsActionTail />
                </Stack>
              }
            />
          }
        />
      </React.Fragment>
      </ProductsSelectProvider>
      </ProductsProvider>
    );
  };

  export default Boms;
