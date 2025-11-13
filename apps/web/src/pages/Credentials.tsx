import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { VerifiableCredential } from '@identity-vault/did-core';

const Credentials: React.FC = () => {
  const { credentials, removeCredential } = useWallet();
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDelete = (credentialId: string) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      removeCredential(credentialId);
      if (selectedCredential?.id === credentialId) {
        setSelectedCredential(null);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCredentialType = (cred: VerifiableCredential) => {
    if (Array.isArray(cred.type)) {
      return cred.type[1] || cred.type[0] || 'Credential';
    }
    return cred.type || 'Credential';
  };

  const getStatusInfo = (cred: VerifiableCredential) => {
    if (cred.expirationDate) {
      const expDate = new Date(cred.expirationDate);
      const now = new Date();
      if (expDate < now) {
        return {
          status: 'Expired',
          color: 'red',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      }
      const daysUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry < 30) {
        return {
          status: 'Expiring Soon',
          color: 'yellow',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        };
      }
    }
    return {
      status: 'Active',
      color: 'green',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    };
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Security-themed background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className={`mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Credential Vault
              </h1>
              <p className="text-gray-600 text-lg">Secure management of your verifiable credentials</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Credentials</p>
                <p className="text-3xl font-bold text-gray-900">{credentials.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-gray-900">
                  {credentials.filter(c => {
                    if (!c.expirationDate) return true;
                    return new Date(c.expirationDate) > new Date();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Expiring Soon</p>
                <p className="text-3xl font-bold text-gray-900">
                  {credentials.filter(c => {
                    if (!c.expirationDate) return false;
                    const expDate = new Date(c.expirationDate);
                    const now = new Date();
                    const daysUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                    return daysUntilExpiry < 30 && daysUntilExpiry > 0;
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credentials List */}
          <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`} style={{ transitionDelay: '400ms' }}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>My Credentials</span>
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {credentials.length}
                </span>
              </div>

              {credentials.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mb-6 inline-block p-6 bg-gray-100 rounded-2xl">
                    <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-medium mb-2">No credentials yet</p>
                  <p className="text-gray-400 text-sm">Issue credentials to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                  {credentials.map((cred, index) => {
                    const statusInfo = getStatusInfo(cred);
                    return (
                      <div
                        key={cred.id}
                        onMouseEnter={() => setHoveredCard(cred.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          selectedCredential?.id === cred.id
                            ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                            : hoveredCard === cred.id
                            ? 'border-blue-300 bg-gray-50 shadow-md scale-[1.01]'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCredential(cred)}
                        style={{ 
                          transitionDelay: `${index * 50}ms`,
                        }}
                      >
                        {/* Status Badge */}
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                          statusInfo.color === 'green' ? 'bg-green-100 text-green-700' :
                          statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {statusInfo.icon}
                          <span>{statusInfo.status}</span>
                        </div>

                        <div className="pr-24">
                          <h3 className="font-bold text-gray-900 text-lg mb-2">
                            {getCredentialType(cred)}
                          </h3>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Issued: {new Date(cred.issuanceDate).toLocaleDateString()}</span>
                            </div>
                            {cred.expirationDate && (
                              <div className="flex items-center space-x-2 text-gray-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Expires: {new Date(cred.expirationDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cred.id);
                          }}
                          className="absolute bottom-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete Credential"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Credential Details Panel */}
          <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ transitionDelay: '600ms' }}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Credential Details</span>
                </h2>
                {selectedCredential && (
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Verified</span>
                  </div>
                )}
              </div>

              {selectedCredential ? (
                <div className="space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                  {/* ID Section */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Credential ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-900 break-all flex-1 font-mono bg-white p-3 rounded-lg border border-gray-200">
                        {selectedCredential.id}
                      </p>
                      <button
                        onClick={() => copyToClipboard(selectedCredential.id || '')}
                        className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-shrink-0"
                        title="Copy ID"
                      >
                        {copied ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Type Section */}
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Type
                    </label>
                    <p className="text-base text-gray-900 font-medium">
                      {Array.isArray(selectedCredential.type)
                        ? selectedCredential.type.join(', ')
                        : selectedCredential.type}
                    </p>
                  </div>

                  {/* Issuer Section */}
                  <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Issuer
                    </label>
                    <p className="text-base text-gray-900 break-all font-mono">
                      {typeof selectedCredential.issuer === 'string'
                        ? selectedCredential.issuer
                        : selectedCredential.issuer.id}
                    </p>
                  </div>

                  {/* Dates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Issuance Date
                      </label>
                      <p className="text-base text-gray-900">
                        {new Date(selectedCredential.issuanceDate).toLocaleString()}
                      </p>
                    </div>
                    {selectedCredential.expirationDate && (
                      <div className={`rounded-xl p-5 border ${
                        new Date(selectedCredential.expirationDate) < new Date()
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                          Expiration Date
                        </label>
                        <p className="text-base text-gray-900">
                          {new Date(selectedCredential.expirationDate).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Credential Subject */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      Credential Subject
                    </label>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 overflow-auto max-h-48">
                      <pre className="text-xs text-gray-700 font-mono">
                        {JSON.stringify(selectedCredential.credentialSubject, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Proof Section */}
                  {selectedCredential.proof && (
                    <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        Cryptographic Proof
                      </label>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 overflow-auto max-h-48">
                        <pre className="text-xs text-gray-700 font-mono">
                          {JSON.stringify(selectedCredential.proof, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Full JSON */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      Full JSON Document
                    </label>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 overflow-auto max-h-64">
                      <pre className="text-xs text-gray-700 font-mono">
                        {JSON.stringify(selectedCredential, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="mb-6 inline-block p-6 bg-gray-100 rounded-2xl">
                    <svg className="w-20 h-20 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-medium mb-2">No credential selected</p>
                  <p className="text-gray-400 text-sm">Select a credential from the list to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credentials;
