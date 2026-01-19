import { TextField, type TextFieldProps } from '@mui/material';
import { type FC } from 'react';

export const CustomTextField: FC<TextFieldProps> = ({ 
  variant = 'outlined',
  fullWidth = true,
  ...props 
}) => {
  return (
    <TextField 
      variant={variant} 
      fullWidth={fullWidth} 
      {...props} 
    />
  );
};