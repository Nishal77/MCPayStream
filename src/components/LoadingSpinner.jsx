const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-solana-200 dark:border-solana-800 rounded-full animate-pulse`}></div>
        
        {/* Spinning ring */}
        <div className={`${sizeClasses[size]} border-4 border-transparent border-t-solana-500 border-r-primary-500 rounded-full absolute top-0 left-0 animate-spin`}></div>
        
        {/* Inner dot */}
        <div className={`${sizeClasses[size === 'xl' ? 'lg' : 'md']} bg-gradient-to-br from-solana-400 to-primary-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse`}></div>
      </div>
      
      {text && (
        <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
