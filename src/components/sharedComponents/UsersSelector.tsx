import React, { useEffect, useState, useCallback } from 'react';
import { Autocomplete, Checkbox, Chip, LinearProgress, TextField } from '@mui/material';
import CheckBoxOutlineBlank from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBox from '@mui/icons-material/CheckBox';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import organizationServices from '../Organizations/organizationServices';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
  [key: string]: any;
}

interface ApiResponse {
  current_page: number;
  data: User[];
  first_page_url: string;
  from: number;
  // Add other pagination properties as needed
}

interface UsersSelectorProps {
  onChange: (value: User | User[] | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: User | User[] | null;
  frontError?: {
    message?: string;
  } | null;
}

const UsersSelector: React.FC<UsersSelectorProps> = ({
  onChange,
  multiple = false,
  label = 'Users',
  defaultValue = null,
  frontError = null,
}) => {
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  
  // Use react-query for data fetching with proper typing
  const { data: response = { data: [] }, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['users', organization?.id],
    queryFn: () => organizationServices.getUsers({ organizationId: organization?.id }),
    enabled: !!organization?.id,
    select: (data) => data || { data: [] }, // Ensure we always have a data property
  });

  const users = response.data || []; // Extract the users array from the response

  const [selectedUsers, setSelectedUsers] = useState<User | User[] | null>(() => {
    if (!defaultValue) return multiple ? [] : null;
    
    return multiple 
      ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue])
      : (Array.isArray(defaultValue) ? defaultValue[0] : defaultValue);
  });

  // Update selected users when defaultValue or users change
  useEffect(() => {
    if (!defaultValue || users.length === 0) return;

    if (multiple) {
      const defaultIds = Array.isArray(defaultValue) 
        ? defaultValue.map(user => user.id)
        : [defaultValue.id];
      setSelectedUsers(users.filter((user: User) => defaultIds.includes(user.id)));
    } else {
      const targetId = Array.isArray(defaultValue) ? defaultValue[0]?.id : defaultValue?.id;
      setSelectedUsers(users.find((user: User) => user.id === targetId) || null);
    }
  }, [defaultValue, users, multiple]);

  const handleChange = useCallback((_: any, newValue: User | User[] | null) => {
    onChange(newValue);
    setSelectedUsers(newValue);
  }, [onChange]);

  if (isLoading) {
    return <LinearProgress />;
  }

  if (error) {
    return <div>Error loading users: {(error as Error).message}</div>;
  }

  return (
    <Autocomplete
      multiple={multiple}
      size="small"
      isOptionEqualToValue={(option: User, value: User) => option.id === value.id}
      options={users}
      disableCloseOnSelect={multiple}
      value={selectedUsers}
      getOptionLabel={(option: User) => option.name}
      renderInput={(params) => (
        <TextField
          {...params}
          error={!!frontError || !!error}
          helperText={frontError?.message}
          fullWidth
          label={label}
          size="small"
          placeholder={label}
        />
      )}
      renderTags={(tagValue: User[], getTagProps) => 
        tagValue.map((option: User, index: number) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={option.name}
          />
        ))
      }
      {...(multiple && { 
        renderOption: (
          props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
          option: User,
          { selected }
        ) => {
          const { key, ...otherProps } = props;

          return (
            <li key={option.id} {...otherProps}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.name}
            </li>
          );
        }
      })}
      onChange={handleChange}
    />
  );
};

export default UsersSelector;