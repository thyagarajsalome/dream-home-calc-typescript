import React, { forwardRef } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = "", title }, ref) => {
    return (
      <div 
        ref={ref} 
        className={`bg-white rounded-2xl shadow-float border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}
      >
        {title && (
          <div className="bg-secondary px-6 py-4">
            <h3 className="text-white font-heading text-lg font-semibold tracking-wide">{title}</h3>
          </div>
        )}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    );
  }
);

// It's good practice to set a displayName when using forwardRef, 
// otherwise it shows up as "ForwardRef" in React DevTools
Card.displayName = 'Card';