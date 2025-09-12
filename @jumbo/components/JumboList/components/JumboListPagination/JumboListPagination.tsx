import React from 'react';
import { 
  Stack, 
  TablePagination, 
  Tooltip,
  IconButton 
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as PreviousPageIcon,
  NavigateNext as NextPageIcon
} from '@mui/icons-material';
import useJumboList, { JumboListContextType } from '../../hooks/useJumboList';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface JumboListPaginationProps {
    hidePagination?: boolean;
    hideItemsPerPage?: boolean;
    itemsPerPageOptions?: number[];
}

const JumboListPagination: React.FC<JumboListPaginationProps> = ({
    hidePagination = false,
    hideItemsPerPage = false,
    itemsPerPageOptions: customItemsPerPageOptions,
}) => {
    const {
        activePage,
        itemsPerPage,
        totalCount,
        isLoading,
        setActivePage,
        setItemsPerPage,
        itemsPerPageOptions: defaultItemsPerPageOptions,
        data,
    } = useJumboList() as JumboListContextType;
    const dictionary = useDictionary();

    const itemsPerPageOptions = customItemsPerPageOptions || defaultItemsPerPageOptions;

    // Default pagination translations structure
    const paginationTranslations = dictionary.rqList?.pagination || {
        first: 'Go to first page',
        last: 'Go to last page',
        previous: 'Previous page',
        next: 'Next page',
        rowsPerPage: 'Rows per page:'
    };

    // Create a proper ActionsComponent function
    const CustomPaginationActions = (props: any) => {
        const { onPageChange, page, count, rowsPerPage } = props;
        const currentPage = page;

        const handleFirstPageClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            onPageChange(event, 0);
        };

        const handlePreviousPageClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            onPageChange(event, currentPage - 1);
        };

        const handleNextPageClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            onPageChange(event, currentPage + 1);
        };

        const handleLastPageClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
        };

        return (
            <Stack direction="row" spacing={0.5}>
                {/* First Page Button */}
                <Tooltip title={paginationTranslations.first} arrow>
                    <span>
                        <IconButton 
                            onClick={handleFirstPageClick}
                            disabled={currentPage === 0}
                        >
                            <FirstPageIcon />
                        </IconButton>
                    </span>
                </Tooltip>

                {/* Previous Page Button */}
                <Tooltip title={paginationTranslations.previous} arrow>
                    <span>
                        <IconButton 
                            onClick={handlePreviousPageClick}
                            disabled={currentPage === 0}
                        >
                            <PreviousPageIcon />
                        </IconButton>
                    </span>
                </Tooltip>

                {/* Next Page Button */}
                <Tooltip title={paginationTranslations.next} arrow>
                    <span>
                        <IconButton 
                            onClick={handleNextPageClick}
                            disabled={currentPage >= Math.ceil(count / rowsPerPage) - 1}
                        >
                            <NextPageIcon />
                        </IconButton>
                    </span>
                </Tooltip>

                {/* Last Page Button */}
                <Tooltip title={paginationTranslations.last} arrow>
                    <span>
                        <IconButton 
                            onClick={handleLastPageClick}
                            disabled={currentPage >= Math.ceil(count / rowsPerPage) - 1}
                        >
                            <LastPageIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Stack>
        );
    };

    const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setActivePage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newItemsPerPage = parseInt(event.target.value, 10);
        setItemsPerPage(newItemsPerPage);
        setActivePage(0);
    };

    if (hidePagination && (data?.length <= 0 && isLoading)) {
        return null;
    }

    return (
        <Stack width="100%">
            {!hidePagination && (
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={activePage}
                    labelRowsPerPage={'Rows'}
                    onPageChange={handlePageChange}
                    rowsPerPage={itemsPerPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={hideItemsPerPage ? [] : itemsPerPageOptions}
                    labelDisplayedRows={({ from, to, count }) => 
                        `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                    }
                    ActionsComponent={CustomPaginationActions}
                    sx={{
                        '& .MuiTablePagination-toolbar': {
                            padding: 1,
                            minHeight: 'auto'
                        },
                        '& .MuiTablePagination-selectLabel': {
                            margin: 0
                        },
                        '& .MuiTablePagination-displayedRows': {
                            margin: 0
                        }
                    }}
                />
            )}
        </Stack>
    );
};

export default JumboListPagination;