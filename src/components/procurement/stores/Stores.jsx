'use client'

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react'
import storeServices from './store-services';
import StoreActionTail from './StoreActionTail';
import StoreListItem from './StoreListItem';
import { useParams } from 'next/navigation';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const Stores = () => {
    const params = useParams();
    const listRef = React.useRef();
    const [mounted, setMounted] = useState(false);
    const dictionary = useDictionary();

    const [queryOptions, setQueryOptions] = React.useState({
        queryKey: "stores",
        queryParams: {id: params.id, keyword : ''},
        countKey: "total",
        dataKey: "data",
    });

    React.useEffect(() => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {...state.queryParams, id: params.id}
        }))
    }, [params]);

    const renderStore = React.useCallback((store) => {
        return (<StoreListItem store={store} />)
    });

    const handleOnChange = React.useCallback((keyword) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                keyword: keyword,
            }
        }))
    }, []);

    const {checkOrganizationPermission,organizationHasSubscribed} = useJumboAuth();

    useEffect(() => {
        setMounted(true);
      }, []);
    
    if (!mounted) return null; // ⛔ Prevent mismatch during hydration

    if(!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)){
        return <UnsubscribedAccess modules={'Procurement & Supply'}/>
    }


    if(!checkOrganizationPermission(PERMISSIONS.STORES_READ)){
        return <UnauthorizedAccess/>;
    }
    
return (
    <React.Fragment>
        <Typography variant={'h4'} mb={2}>{dictionary.stores.form.labels.listHeader}</Typography>
        <JumboRqList
            ref={listRef}
            wrapperComponent={Card}
            service={storeServices.getList}
            primaryKey={"id"}
            queryOptions={queryOptions}
            itemsPerPage={8}
            itemsPerPageOptions={[8,10, 15, 20]}
            renderItem={renderStore}
            componentElement={"div"}
            bulkActions={null}
            wrapperSx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
            }}
            toolbar={
                <JumboListToolbar
                    hideItemsPerPage={true}
                    actionTail={
                    <Stack direction={'row'}>
                        <JumboSearch
                            onChange={handleOnChange}
                            value={queryOptions.queryParams.keyword}
                        />
                        <StoreActionTail /> 
                    </Stack>
                }
                >
                </JumboListToolbar>
            }
        />
    </React.Fragment>
);
}

export default Stores