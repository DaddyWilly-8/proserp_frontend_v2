import { Divider, Grid, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface RequisitionSummaryProps {
  vatableAmount: number;
  totalAmount: number;
  isPurchase: boolean;
}

function RequisitionSummary({ vatableAmount, totalAmount, isPurchase }: RequisitionSummaryProps) {
  const dictionary = useDictionary();
  return (
    <Grid container columnSpacing={1}>
      <Grid size={{xs: 12}}>
        <Typography align='center' variant='h3'>{dictionary.forms.requisitions.summary.title}</Typography>
        <Divider/>
      </Grid>
      <Grid size={{xs: 5}}>
        <Typography align='left' variant='body2'>{dictionary.forms.requisitions.summary.total}</Typography>
      </Grid>
      <Grid size={{xs: 7}}>
        <Typography align='right' variant='h5'>
          {totalAmount?.toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
        </Typography>
      </Grid>
      {isPurchase &&
        <>
          <Grid size={{xs: 5}}>
            <Typography align='left' variant='body2'>
              {dictionary.forms.requisitions.summary.vat}
            </Typography>
          </Grid>
          <Grid size={{xs: 7}} display={'flex'} alignItems={'center'} justifyContent={'end'}>
            <Typography align='right' variant='h5'>
              {vatableAmount?.toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
            </Typography>
          </Grid>
        </>
      }
      <Grid size={{xs: 5}}>
        <Typography align='left' variant='body2' noWrap>{dictionary.forms.requisitions.summary.grandTotal}</Typography>
      </Grid>
      <Grid size={{xs: 7}} display={'flex'} alignItems={'end'} justifyContent={'end'}>
        <Typography align='right' variant='h5'>
          {(totalAmount + vatableAmount).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
        </Typography>
      </Grid>
    </Grid>
  );
}

export default RequisitionSummary;