import React from 'react';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const gradientVariants = {
  primary: 'bg-gradient-to-r from-[#0032FF] to-[#8A2BE2] hover:from-[#0028CC] hover:to-[#7A24CC] shadow-lg shadow-blue-500/25',
  secondary: 'bg-gradient-to-r from-[#FF6F00] to-[#FF6F61] hover:from-[#E55A00] hover:to-[#E55A4F] shadow-lg shadow-orange-500/25',
  success: 'bg-gradient-to-r from-[#1ABC3C] to-[#A6E05A] hover:from-[#16A132] hover:to-[#94CC4A] shadow-lg shadow-green-500/25',
  warning: 'bg-gradient-to-r from-[#F8C94E] to-[#FFD700] hover:from-[#E5B540] hover:to-[#E5C200] shadow-lg shadow-yellow-500/25',
  danger: 'bg-gradient-to-r from-[#FF6F61] to-[#FF4444] hover:from-[#E55A4F] hover:to-[#E53333] shadow-lg shadow-red-500/25'
};

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

export function GradientButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: GradientButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        gradientVariants[variant],
        sizeVariants[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}