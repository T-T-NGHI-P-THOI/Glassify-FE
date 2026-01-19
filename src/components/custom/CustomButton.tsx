import { Button, type ButtonProps } from '@mui/material';
import { type FC } from 'react';

interface CustomButtonProps extends ButtonProps {
  // Thêm props riêng nếu cần
}

export const CustomButton: FC<CustomButtonProps> = ({ 
  children, 
  variant = 'contained',
  color = 'primary',
  ...props 
}) => {
  return (
    <Button variant={variant} color={color} {...props}>
      {children}
    </Button>
  );
};