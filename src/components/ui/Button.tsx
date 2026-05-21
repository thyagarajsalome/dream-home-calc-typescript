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
    primary: "bg-primary text-white dark:text-zinc-950 hover:bg-primary-hover shadow-float",
    secondary: "bg-secondary dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "bg-white dark:bg-zinc-900 border-2 border-secondary dark:border-zinc-700 text-secondary dark:text-zinc-100 hover:bg-secondary dark:hover:bg-zinc-800 hover:text-white dark:hover:text-white"
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