import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatSOL, formatUSD } from '../../shared/formatters';
import { CHART_CONFIG } from '../../shared/constants';

const EarningsChart = ({ walletAddress }) => {
  const [timeRange, setTimeRange] = useState('7D');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (walletAddress) {
      fetchChartData();
    }
  }, [walletAddress, timeRange]);

  const fetchChartData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch live data from API
      const response = await fetch(`http://localhost:5001/api/stats/earnings/${walletAddress}?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setChartData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch chart data');
      }
      
    } catch (err) {
      setError('Failed to load chart data');
      console.error('Error fetching chart data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatXAxis = (tickItem) => {
    if (timeRange === '24H') {
      return new Date(tickItem).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '7D') {
      return new Date(tickItem).toLocaleDateString([], { weekday: 'short' });
    } else if (timeRange === '30D') {
      return new Date(tickItem).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return new Date(tickItem).toLocaleDateString([], { month: 'short', year: '2-digit' });
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {new Date(label).toLocaleDateString()}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Earnings: <span className="font-medium text-solana-600 dark:text-solana-400">
                {formatSOL(payload[0].value)}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              USD: <span className="font-medium text-green-600 dark:text-green-400">
                {formatUSD(payload[1].value)}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Transactions: <span className="font-medium text-purple-600 dark:text-purple-400">
                {payload[2]?.value || 0}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loader loader-dark"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Time Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">
          Earnings Over Time
        </h3>
        <div className="flex space-x-2">
          {Object.entries(CHART_CONFIG.TIME_RANGES).map(([label, value]) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`px-3 py-1 text-sm font-medium rounded-lg ${
                timeRange === value
                  ? 'bg-white/10 text-white'
                  : 'text-white/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14f195" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#14f195" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="earningsUSDGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              stroke="#9ca3af"
              fontSize={12}
            />
            
            <YAxis 
              yAxisId="left"
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => formatSOL(value)}
            />
            
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => formatUSD(value)}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="earnings"
              stroke="#14f195"
              strokeWidth={2}
              fill="url(#earningsGradient)"
              name="Earnings (SOL)"
            />
            
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="earningsUSD"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#earningsUSDGradient)"
              name="Earnings (USD)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
          <p className="text-lg font-semibold text-solana-600 dark:text-solana-400">
            {formatSOL(chartData.reduce((sum, item) => sum + item.earnings, 0))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total USD</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatUSD(chartData.reduce((sum, item) => sum + item.earningsUSD, 0))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            {chartData.reduce((sum, item) => sum + item.transactions, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EarningsChart;
