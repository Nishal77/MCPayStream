import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Save, Download, Upload, Trash2 } from 'lucide-react';
import { formatSOL, formatUSD } from '../../shared/formatters';

const Settings = () => {
  const { isDark, setTheme } = useTheme();
  const { wallet, updateWalletSettings, clearWallet } = useWallet();
  
  const [settings, setSettings] = useState({
    name: wallet?.name || '',
    description: wallet?.description || '',
    autoConfirm: wallet?.settings?.autoConfirm ?? true,
    minAmount: wallet?.settings?.minAmount || 0.001,
    maxAmount: wallet?.settings?.maxAmount || 1000,
    currency: wallet?.settings?.currency || 'SOL',
    webhookEnabled: wallet?.webhook?.enabled || false,
    webhookUrl: wallet?.webhook?.url || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateWalletSettings({
        name: settings.name,
        description: settings.description,
        settings: {
          autoConfirm: settings.autoConfirm,
          minAmount: settings.minAmount,
          maxAmount: settings.maxAmount,
          currency: settings.currency,
        },
        webhook: {
          enabled: settings.webhookEnabled,
          url: settings.webhookUrl,
        },
      });
      
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportTransactions = () => {
    if (!wallet) return;
    
    // Create CSV content
    const csvContent = [
      ['Date', 'From', 'To', 'Amount (SOL)', 'Amount (USD)', 'Status', 'Signature'],
      ...(wallet.transactions || []).map(tx => [
        new Date(tx.blockTime).toLocaleDateString(),
        tx.fromAddress,
        tx.toAddress,
        tx.amount,
        tx.amountUSD,
        tx.status,
        tx.signature,
      ])
    ].map(row => row.join(',')).join('\n');
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${wallet.address.slice(0, 8)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClearWallet = () => {
    if (confirm('Are you sure you want to clear the current wallet? This will remove all data from the dashboard.')) {
      clearWallet();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a
                href="/"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </a>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.includes('successfully') 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={saveMessage.includes('successfully') 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-red-800 dark:text-red-200'
            }>
              {saveMessage}
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Appearance
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-4 py-2 rounded-lg border transition-colors duration-200 ${
                      !isDark
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-2 rounded-lg border transition-colors duration-200 ${
                      isDark
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    System
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Settings */}
          {wallet && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wallet Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Wallet Name
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => handleSettingChange('name', e.target.value)}
                    className="input-primary"
                    placeholder="My Wallet"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={settings.description}
                    onChange={(e) => handleSettingChange('description', e.target.value)}
                    className="input-primary"
                    placeholder="Optional description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Amount
                  </label>
                  <input
                    type="number"
                    value={settings.minAmount}
                    onChange={(e) => handleSettingChange('minAmount', parseFloat(e.target.value))}
                    className="input-primary"
                    step="0.001"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Amount
                  </label>
                  <input
                    type="number"
                    value={settings.maxAmount}
                    onChange={(e) => handleSettingChange('maxAmount', parseFloat(e.target.value))}
                    className="input-primary"
                    step="0.1"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSettingChange('currency', e.target.value)}
                    className="input-primary"
                  >
                    <option value="SOL">SOL</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoConfirm"
                    checked={settings.autoConfirm}
                    onChange={(e) => handleSettingChange('autoConfirm', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoConfirm" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Auto-confirm transactions
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Webhook Settings */}
          {wallet && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Webhook Notifications
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="webhookEnabled"
                    checked={settings.webhookEnabled}
                    onChange={(e) => handleSettingChange('webhookEnabled', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="webhookEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Enable webhook notifications
                  </label>
                </div>
                
                {settings.webhookEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={settings.webhookUrl}
                      onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
                      className="input-primary"
                      placeholder="https://your-webhook-url.com/notify"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Management */}
          {wallet && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Data Management
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Export Transactions
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Download all transactions as CSV
                    </p>
                  </div>
                  <button
                    onClick={handleExportTransactions}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      Clear Wallet Data
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Remove all data from dashboard
                    </p>
                  </div>
                  <button
                    onClick={handleClearWallet}
                    className="btn-secondary flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {wallet && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
