import { Autocomplete, Checkbox, Chip, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useProductsSelect } from './ProductsSelectProvider';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

function ProductSelect(props) {
  const {
    frontError = null,
    label = 'Select Product',
    excludeIds = [],
    multiple = false, // Add a new prop for multiple selection
    startAdornment,
    requiredProducts,
    addedProduct=null,
  } = props;
  const { productOptions } = useProductsSelect();

  const [selectedItems, setSelectedItems] = useState(
    props?.defaultValue ? props.defaultValue : (multiple ? [] : null)
  );

  useEffect(() => {
    if(addedProduct !==null){
      setSelectedItems(addedProduct);
    }
  }, [addedProduct])

  const options = [
    ...productOptions.filter(productOption => 
        !excludeIds.includes(productOption.id) && productOption.id !== addedProduct?.id
    ),
    ...(addedProduct?.id ? [addedProduct] : [])
  ];

  const handleOnChange = (event, newValue) => {
    setSelectedItems(newValue);
    props.onChange(newValue);
  };

  // Filter options based on requiredProducts
  const filteredOptions = options?.filter(option => requiredProducts?.some(product => product.id === option.id));

    return (
    <Autocomplete
      multiple={multiple} // Specify whether multiple selections are allowed
      disabled={props?.disabled}
      options={!!requiredProducts ? filteredOptions : options}
      disableCloseOnSelect={multiple}
      readOnly={props?.readOnly}
      getOptionLabel={product => product.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          fullWidth
          label={label}
          error={!!frontError}
          helperText={frontError?.message}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {startAdornment && (
                  <div style={{ marginRight: 3 }}>{startAdornment}</div>
                )}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
          value={
            props?.multiple
              ? selectedItems?.map((item) => `${item.name} - (${item.type})`).join(", ")
              : selectedItems
          }
        />
      )}
      
      renderTags={(tagValue, getTagProps)=> {
        return tagValue.map((option, index)=>{
            const {key, ...restProps} = getTagProps({index});
            return <Chip {...restProps} key={option.id+"-"+key} label={option.name} />
         })
      }}

      // Conditionally render the renderOption property
      {...(multiple && { renderOption: (props, option, { selected }) => {
      const { key, ...restProps} = props
        return  (
        <li {...restProps} key={option.id+"-"+key}>
          <Checkbox
            icon={<CheckBoxOutlineBlank fontSize="small" />}
            checkedIcon={<CheckBox fontSize="small" />}
            style={{ marginRight: 8 }}
            checked={selected}
          />
          {option.name}
        </li>
        )
    }})}

      value={selectedItems}
      onChange={handleOnChange}
    />
  );
}

export default ProductSelect;