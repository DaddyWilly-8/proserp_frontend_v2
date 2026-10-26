'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import DepartmentItemAction from './DepartmentItemAction';
import { Department } from './DepartmentsType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const DepartmentsListItem = ({ department }: { department: Department }) => {
  const dictionary = useDictionary();
  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 5 }}>
          <Tooltip title={dictionary.tooltips.departmentName}>
            <Typography
              variant='h5'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
            >
              {department.name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={dictionary.tooltips.departmentCode}>
            <Typography>{department.code}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={dictionary.tooltips.departmentDescription}>
            <Typography>{department.description}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 1, md: 0.5, lg: 1 }} textAlign={'end'}>
          <DepartmentItemAction department={department} />
        </Grid>
      </Grid>
    </>
  );
};

export default DepartmentsListItem;
