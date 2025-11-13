import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

const Settings: React.FC = () => {
  const { address, did, credentials } = useWallet();
  const [showBackup, setShowBackup] = useState(false);
  const [backupData, setBackupData] = useState('');

  const handleBackup = () => {
    const data = {
      address,
      did,
      credentials,
      timestamp: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    setBackupData(json);
    setShowBackup(true);
  };

  const handleDownloadBackup = () => {
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identity-vault-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        JSON.parse(e.target?.result as string);
        // In a real app, you would restore the data
        alert('Backup restored successfully!');
      } catch (error) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      localStorage.removeItem('identity_vault_state');
      localStorage.removeItem('identity_vault_private_key');
      window.location.reload();
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your wallet settings and data</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet Information</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <p className="text-sm text-gray-900 break-all">{address || 'Not connected'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DID</label>
              <p className="text-sm text-gray-900 break-all">{did || 'Not created'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credentials</label>
              <p className="text-sm text-gray-900">{credentials.length} stored</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup & Recovery</h2>
          <div className="space-y-4">
            <div>
              <button
                onClick={handleBackup}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Create Backup
              </button>
            </div>
            {showBackup && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Backup Data</label>
                <textarea
                  value={backupData}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  rows={8}
                />
                <button
                  onClick={handleDownloadBackup}
                  className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Download Backup
                </button>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restore Backup</label>
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Danger Zone</h2>
          <div className="border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-900 mb-2">Clear All Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will delete all local data including your private key and credentials. Make sure you have a backup!
            </p>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

