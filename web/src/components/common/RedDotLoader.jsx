import React from 'react';
import './RedDotLoader.css';

const RedDotLoader = ({ 
  size = 'medium', 
  fullScreen = false,
  className = '' 
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      dot: 'w-2 h-2',
      gap: 'gap-1.5'
    },
    medium: {
      dot: 'w-3 h-3',
      gap: 'gap-2'
    },
    large: {
      dot: 'w-4 h-4',
      gap: 'gap-2.5'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  const containerClasses = fullScreen
    ? 'red-dot-loader-container red-dot-loader-fullscreen'
    : 'red-dot-loader-container';

  return (
    <div className={`${containerClasses} ${className}`} role="status" aria-label="Loading">
      <div className={`red-dot-loader-dots ${config.gap}`}>
        <div className={`red-dot-loader-dot ${config.dot} bg-[#8B1A1A] rounded-full`} />
        <div className={`red-dot-loader-dot ${config.dot} bg-[#8B1A1A] rounded-full`} style={{ animationDelay: '0.2s' }} />
        <div className={`red-dot-loader-dot ${config.dot} bg-[#8B1A1A] rounded-full`} style={{ animationDelay: '0.4s' }} />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default RedDotLoader;

