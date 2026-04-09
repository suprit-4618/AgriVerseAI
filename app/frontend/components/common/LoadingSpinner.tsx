
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g. text-blue-500
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-green-600', text }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-t-2 border-b-2',
    lg: 'w-12 h-12 border-t-4 border-b-4'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${color} border-solid border-gray-200`}
        style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }}
      ></div>
      {text && <p className={`mt-2 text-sm ${color}`}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
