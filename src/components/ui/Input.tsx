import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = "", ...props }) => {
  return (
    <div className="relative mb-6 group">
      {/* Icon Wrapper */}
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10 text-gray-400 group-focus-within:text-primary transition-colors">
          <i className={`${icon} text-lg`}></i>
        </div>
      )}
      
      <input
        {...props}
        placeholder=" " // Required for peer-placeholder-shown to work
        className={`
          peer w-full py-3.5 pr-4
          ${icon ? 'pl-12' : 'pl-4'} /* Dynamic Padding */
          border-2 border-gray-200 rounded-xl outline-none 
          text-gray-700 bg-white
          focus:border-primary focus:ring-4 focus:ring-primary/10 
          transition-all duration-200
          ${className}
        `}
      />
      
      {/* Floating Label */}
      <label className={`
        absolute z-20 cursor-text
        text-xs font-bold text-gray-500 bg-white px-2 rounded-md
        transition-all duration-200
        
        /* Floating State (Default) */
        -top-2.5 left-3 text-primary
        
        /* Placeholder Shown State (Resting) */
        peer-placeholder-shown:top-3.5 
        peer-placeholder-shown:text-base 
        peer-placeholder-shown:text-gray-400
        ${icon ? 'peer-placeholder-shown:left-12' : 'peer-placeholder-shown:left-4'}
        
        /* Focus State */
        peer-focus:-top-2.5 
        peer-focus:left-3 
        peer-focus:text-xs 
        peer-focus:text-primary
      `}>
        {label}
      </label>
    </div>
  );
};