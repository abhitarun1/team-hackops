import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { isConnected, address, did, credentials } = useWallet();

  if (!isConnected) {
    return (
      <div className="px-4 py-8 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Welcome to Identity Vault
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to get started with decentralized identity management
          </p>
          <Link
            to="/did"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your decentralized identity and credentials</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Your DID</dt>
                  <dd className="text-lg font-medium text-gray-900 break-all">{did || 'Not created'}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Credentials</dt>
                  <dd className="text-lg font-medium text-gray-900">{credentials.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Wallet Address</dt>
                  <dd className="text-lg font-medium text-gray-900 break-all">{address}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/did"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Manage DID</h3>
            <p className="text-sm text-gray-600">Create and manage your decentralized identifier</p>
          </Link>
          <Link
            to="/credentials/issue"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Issue Credential</h3>
            <p className="text-sm text-gray-600">Issue a new verifiable credential</p>
          </Link>
          <Link
            to="/credentials/verify"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Credential</h3>
            <p className="text-sm text-gray-600">Verify a credential's validity</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

