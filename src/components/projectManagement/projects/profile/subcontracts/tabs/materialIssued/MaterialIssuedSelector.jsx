import { FormControlLabel, Switch } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function MaterialIssuedSelector({ aggregated, onChange }) {
  const dictionary = useDictionary();
  const handleToggle = (event) => {
    onChange(event.target.checked);
  };

  return (
    <FormControlLabel
      control={
        <Switch
          checked={aggregated}
          onChange={handleToggle}
          color="primary"
        />
      }
      label={dictionary.projectManagement.materialIssued.aggregated}
    />
  );
}

export default MaterialIssuedSelector;
