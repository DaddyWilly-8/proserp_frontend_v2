import { PersonOutline } from '@mui/icons-material';
import { Chip, Tooltip } from '@mui/material';

interface MyRequisitionsToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

function MyRequisitionsToggle({ value, onChange }: MyRequisitionsToggleProps) {
  return (
    <Tooltip
      title={
        value
          ? 'Showing only requisitions you requested — click to show all'
          : 'Show only requisitions you requested'
      }
    >
      <Chip
        size='small'
        icon={<PersonOutline fontSize='small' />}
        label='My Requisitions'
        color={value ? 'primary' : 'default'}
        variant={value ? 'filled' : 'outlined'}
        onClick={() => onChange(!value)}
        sx={{ cursor: 'pointer' }}
      />
    </Tooltip>
  );
}

export default MyRequisitionsToggle;
