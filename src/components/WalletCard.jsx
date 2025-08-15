import React from 'react';

const WalletCard = ({ title, value, change, icon: Icon }) => {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white/10 rounded-lg">
          <Icon className="w-6 h-6 text-white/70" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/60 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change && (
            <p className="text-xs text-green-400 font-medium">{change}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
