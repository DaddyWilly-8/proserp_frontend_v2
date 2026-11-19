'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import ProjectDocumentFilters, {
  DocumentFilters,
  documentFiltersToQueryParams,
  EMPTY_DOCUMENT_FILTERS,
} from '@/components/projectManagement/ProjectDocumentFilters';
import { Certificate } from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/CertificateType';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import { Card, Grid, Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import ApprovedSubcontractCertificatesListItem from './ApprovedSubcontractCertificatesListItem';

// Org-wide list of every certificate regardless of status (draft, in_review, returned,
// approved, invoiced) - status is shown per-row via status_label, so there's no need to filter
// any of them out by default.
const ApprovedSubcontractCertificates: React.FC = () => {
  const dictionary = useDictionary();
  const searchParams = useSearchParams();
  const listRef = React.useRef<any>(null);

  const [queryOptions, setQueryOptions] = React.useState({
    // Same queryKey the scoped CertificatesTab/CertificateItemAction use for
    // invalidation, so invoicing/deleting a certificate from this list (or
    // from a subcontract's certificates tab) refreshes both.
    queryKey: 'Certificates',
    queryParams: {
      keyword: '',
      status: undefined as string | undefined,
      cost_center_ids: undefined as string | undefined,
      from: undefined as string | undefined,
      to: undefined as string | undefined,
    },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        keyword: getSanitizedSearchKeyword(
          'Subcontract Certificates',
          searchParams
        ),
      },
    }));
  }, [searchParams]);

  const renderCertificate = React.useCallback(
    (certificate: Certificate) => (
      <ApprovedSubcontractCertificatesListItem certificate={certificate} />
    ),
    []
  );

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: { ...prev.queryParams, keyword },
    }));
  }, []);

  const [filters, setFilters] = React.useState<DocumentFilters>(
    EMPTY_DOCUMENT_FILTERS
  );

  const handleFiltersChange = React.useCallback((next: DocumentFilters) => {
    setFilters(next);
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        ...documentFiltersToQueryParams(next),
      },
    }));
  }, []);

  return (
    <>
      <Typography variant='h4' mb={2}>
        {dictionary.projectManagement.approvedCertificates.title}
      </Typography>

      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={projectsServices.getApprovedSubcontractCertificates}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={20}
        itemsPerPageOptions={[10, 20, 30, 50]}
        renderItem={renderCertificate}
        componentElement='div'
        wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            action={
              <Grid
                container
                columnSpacing={1}
                rowSpacing={1}
                justifyContent='end'
              >
                <ProjectDocumentFilters
                  value={filters}
                  onChange={handleFiltersChange}
                />
              </Grid>
            }
            actionTail={
              <JumboSearch
                onChange={handleOnChange}
                value={queryOptions.queryParams.keyword}
              />
            }
          />
        }
      />
    </>
  );
};

export default ApprovedSubcontractCertificates;
