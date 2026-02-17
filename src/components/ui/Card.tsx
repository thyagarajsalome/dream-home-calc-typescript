import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "", title }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-float border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}>
      {title && (
        <div className="bg-gradient-to-r from-secondary to-gray-800 px-6 py-4">
          <h3 className="text-white font-heading text-lg font-semibold tracking-wide">{title}</h3>
        </div>
      )}
      <div className="p-6 md:p-8">
        {children}
      </div>
    </div>
  );
};