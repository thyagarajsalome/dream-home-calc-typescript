import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, ...props }) => {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        {icon && <i className={icon}></i>}
      </div>
      <input
        {...props}
        className={`peer w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-primary transition-colors bg-gray-50 focus:bg-white placeholder-transparent ${props.className}`}
        placeholder={label}
      />
      <label className="absolute left-10 -top-2.5 bg-white px-2 text-xs font-semibold text-gray-500 transition-all 
        peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:left-10
        peer-focus:-top-2.5 peer-focus:text-primary peer-focus:text-xs">
        {label}
      </label>
    </div>
  );
};