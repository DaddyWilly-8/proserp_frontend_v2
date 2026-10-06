'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices';
import { HrDashboardData } from '@/components/humanResources/dashboard/HrDashboardType';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

const DETAIL_CARD_HEIGHT = 360;

const EmptyRow = ({ colSpan, text }: { colSpan: number; text: string }) => (
  <TableRow>
    <TableCell colSpan={colSpan} align='center' sx={{ py: 3 }}>
      <Typography variant='body2' color='text.secondary'>
        {text}
      </Typography>
    </TableCell>
  </TableRow>
);

const EmptyState = ({ text }: { text: string }) => (
  <Typography variant='body2' color='text.secondary' align='center' sx={{ py: 3 }}>
    {text}
  </Typography>
);

const MobileRowCard = ({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <Card
    variant='outlined'
    onClick={onClick}
    sx={{
      p: 1.5,
      mb: 1,
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 2 } : undefined,
      '&:last-of-type': { mb: 0 },
    }}
  >
    {children}
  </Card>
);

// Shares the `hrDashboard` query key with HrDashboard.tsx so react-query
// dedupes the fetch when both are mounted, rather than hitting the endpoint
// twice for the same payload.
const OnLeaveToday = () => {
  const router = useRouter();
  const lang = useLanguage();
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { data } = useQuery<HrDashboardData>({
    queryKey: ['hrDashboard'],
    queryFn: () => humanResourcesServices.getHrDashboard(),
  });

  const goToEmployee = (id: number) =>
    router.push(`/${lang}/humanResources/employees/${id}`);

  const onLeave = data?.employees_on_leave || [];

  return (
    <JumboCardQuick
      title='Employees On Leave Today'
      sx={{ height: DETAIL_CARD_HEIGHT, display: 'flex', flexDirection: 'column' }}
      wrapperSx={{ overflowY: 'auto', flex: 1 }}
    >
      {smallScreen ? (
        onLeave.length === 0 ? (
          <EmptyState text='No one is on leave today' />
        ) : (
          onLeave.map((row) => (
            <MobileRowCard
              key={row.employee_id}
              onClick={() => goToEmployee(row.employee_id)}
            >
              <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                <Box minWidth={0}>
                  <Typography variant='body2' fontWeight={600} noWrap>
                    {row.employee_name}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {row.employee_number}
                  </Typography>
                </Box>
                <Chip
                  size='small'
                  label={row.returns_in_days <= 1 ? 'Today' : `In ${row.returns_in_days}d`}
                />
              </Stack>
              <Typography variant='caption' color='text.secondary' display='block' mt={0.5}>
                {row.leave_type}
              </Typography>
            </MobileRowCard>
          ))
        )
      ) : (
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Leave Type</TableCell>
              <TableCell>Returns</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {onLeave.length === 0 ? (
              <EmptyRow colSpan={3} text='No one is on leave today' />
            ) : (
              onLeave.map((row) => (
                <TableRow
                  key={row.employee_id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => goToEmployee(row.employee_id)}
                >
                  <TableCell>
                    {row.employee_name}
                    <Typography variant='caption' color='text.secondary' display='block'>
                      {row.employee_number}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.leave_type}</TableCell>
                  <TableCell>
                    {row.returns_in_days <= 1 ? 'Today' : `In ${row.returns_in_days} days`}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </JumboCardQuick>
  );
};

export default OnLeaveToday;
