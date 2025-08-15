import { TrendingUp, TrendingDown } from 'lucide-react';

const WalletCard = ({ title, value, subtitle, icon, trend, trendValue }) => {
  const getIcon = () => {
    switch (icon) {
      case 'solana':
        return (
          <div className="w-8 h-8 bg-solana-100 dark:bg-solana-900/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-solana-600 dark:text-solana-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        );
      case 'price':
        return (
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        );
      case 'received':
        return (
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        );
      case 'transactions':
        return (
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative overflow-hidden bg-white/5 rounded-xl border border-white/10 p-4">
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            {getIcon()}
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend === 'up' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-white/60 uppercase tracking-wide">
            {title}
          </h3>
          <p className="text-2xl font-bold text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-white/70">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
