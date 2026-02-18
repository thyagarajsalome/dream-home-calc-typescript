import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  icon, 
  className = '', 
  disabled, 
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-yellow-600 shadow-float",
    secondary: "bg-secondary text-white hover:bg-gray-800",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "bg-white border-2 border-secondary text-secondary hover:bg-secondary hover:text-white"
  };
  
  const sizes = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading ? (
        <i className="fas fa-spinner fa-spin mr-2"></i>
      ) : icon ? (
        <i className={`${icon} mr-2`}></i>
      ) : null}
      {children}
    </button>
  );
};