import React from 'react';
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import { SxProps, Theme } from "@mui/material/styles";
import { Div } from '@jumbo/shared';
import { useDebouncedCallback } from 'use-debounce';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface JumboSearchProps {
  onChange: (value: string) => void;
  value?: string;
  sx?: SxProps<Theme>;
}

const JumboSearch: React.FC<JumboSearchProps> = React.memo(({ onChange, value = '', sx }) => {
  const dictionary = useDictionary();
  const [searchKeywords, setSearchKeywords] = React.useState<string>(value);

  const handleChange = useDebouncedCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchKeywords(event.target.value);
    },
    1000
  );

  React.useEffect(() => {
    onChange(searchKeywords);
  }, [searchKeywords, onChange]);

  React.useEffect(() => {
    return () => {
      handleChange.cancel();
    };
  }, [handleChange]);

  return (
    <Div sx={{ position: 'relative', width: '100%', ...sx }}>
      <Div
        sx={{
          padding: (theme: Theme) => theme.spacing(0, 2),
          height: '100%',
          position: 'absolute',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          color: (theme: Theme) => theme.palette.text.secondary,
        }}
      >
        <SearchIcon />
      </Div>
      <InputBase
        sx={{
          color: (theme: Theme) => theme.palette.text.primary,
          display: 'flex',
          borderRadius: 24,
          backgroundColor: (theme: Theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
          '& .MuiInputBase-input': {
            padding: (theme: Theme) => theme.spacing(1, 1, 1, 0),
            paddingLeft: (theme: Theme) => `calc(1em + ${theme.spacing(4)})`,
            transition: (theme: Theme) => theme.transitions.create('width'),
            width: '100%',
            height: 24,
          },
        }}
        placeholder={dictionary.rqList.jumboSearch}
        inputProps={{ 'aria-label': 'search' }}
        autoFocus
        onChange={handleChange}
        defaultValue={value}
      />
    </Div>
  );
});

export default JumboSearch;
