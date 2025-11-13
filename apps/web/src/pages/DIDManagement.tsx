import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { DIDCore } from '@identity-vault/did-core';

const DIDRegistryABI = [
  "function createDID(string memory did, string[] memory context, string[] memory publicKeys, string[] memory services)",
  "function resolveDID(string memory did) view returns (tuple(string id, string[] context, string[] controller, string[] publicKey, string[] service, uint256 created, uint256 updated, bool exists))",
  "function didExists(string memory did) view returns (bool)",
  "function updateDID(string memory did, string[] memory context, string[] memory publicKeys, string[] memory services)",
];

const DIDManagement: React.FC = () => {
  const { isConnected, address, did, createDID, provider } = useWallet();
  const [didDocument, setDidDocument] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registryAddress, setRegistryAddress] = useState('');
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showDocument, setShowDocument] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('did_registry_address');
    if (saved) {
      setRegistryAddress(saved);
    }
  }, []);

  const handleCreateDID = async () => {
    if (!isConnected || !address || !provider) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wallet = new ethers.Wallet(localStorage.getItem('identity_vault_private_key') || '', provider);
      const didRegistry = new ethers.Contract(registryAddress || '0x0000000000000000000000000000000000000000', DIDRegistryABI, wallet);

      const newDID = await createDID();
      const didDoc = DIDCore.createDIDDocument(address, {
        kty: 'EC',
        crv: 'secp256k1',
        x: '...',
        y: '...'
      });

      const context = didDoc['@context'];
      const publicKeys = didDoc.publicKey?.map(pk => JSON.stringify(pk)) || [];
      const services = didDoc.service?.map(s => JSON.stringify(s)) || [];

      const tx = await didRegistry.createDID(newDID, context, publicKeys, services);
      await tx.wait();

      setDidDocument(didDoc);
      setShowDocument(true);
      setTimeout(() => {
        const element = document.getElementById('did-document');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to create DID');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDID = async () => {
    if (!did || !provider || !registryAddress) {
      setError('DID or registry address not set');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const didRegistry = new ethers.Contract(registryAddress, DIDRegistryABI, provider);
      const resolved = await didRegistry.resolveDID(did);
      
      const doc = {
        id: resolved.id,
        context: resolved.context,
        controller: resolved.controller,
        publicKey: resolved.publicKey,
        service: resolved.service,
        created: new Date(Number(resolved.created) * 1000).toISOString(),
        updated: new Date(Number(resolved.updated) * 1000).toISOString(),
      };
      setDidDocument(doc);
      setShowDocument(true);
      setTimeout(() => {
        const element = document.getElementById('did-document');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve DID');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-0 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated background security grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-grid-pulse"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative z-10">
        {/* Header with animation */}
        <div className={`mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg transform hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                DID Management
              </h1>
              <p className="mt-2 text-gray-300 text-lg">Secure Decentralized Identity Control Center</p>
            </div>
          </div>
        </div>

        {/* Security Status Banner */}
        {!isConnected && (
          <div className={`mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 rounded-2xl p-4 backdrop-blur-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-400/20 rounded-lg">
                <svg className="w-6 h-6 text-yellow-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-yellow-200 font-semibold">Security Alert</p>
                <p className="text-yellow-300/80 text-sm">Please connect your wallet to enable secure DID operations</p>
              </div>
            </div>
          </div>
        )}

        {/* Security Status - Connected */}
        {isConnected && (
          <div className={`mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-2xl p-4 backdrop-blur-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-400/20 rounded-lg">
                  <svg className="w-6 h-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-200 font-semibold">Wallet Secured</p>
                  <p className="text-green-300/80 text-sm">Your identity is protected and ready for DID operations</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Registry Configuration Card */}
        <div className={`mb-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-cyan-500/30 p-6 relative overflow-hidden group hover:border-cyan-400/50 transition-all duration-500">
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Registry Configuration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2 uppercase tracking-wide">
                    DID Registry Contract Address
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 transition-opacity duration-300 ${focusedField === 'registry' ? 'opacity-50 blur-sm' : ''}`}></div>
                    <input
                      type="text"
                      value={registryAddress}
                      onChange={(e) => {
                        setRegistryAddress(e.target.value);
                        localStorage.setItem('did_registry_address', e.target.value);
                      }}
                      onFocus={() => setFocusedField('registry')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all duration-300 relative z-10 font-mono"
                      placeholder="0x..."
                    />
                    <div className={`absolute inset-0 rounded-xl border-2 border-cyan-400 opacity-0 transition-opacity duration-300 pointer-events-none ${focusedField === 'registry' ? 'opacity-50 animate-pulse' : ''}`}></div>
                  </div>
                  <p className="mt-2 text-xs text-cyan-300/70">Enter the smart contract address for the DID registry</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DID Management Card */}
        <div className={`mb-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '400ms' }}>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-500/30 p-6 relative overflow-hidden group hover:border-blue-400/50 transition-all duration-500">
            {/* Animated background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Your Decentralized Identity</h2>
              </div>

              {did ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-4 border border-blue-400/30">
                    <label className="block text-sm font-semibold text-blue-300 mb-2 uppercase tracking-wide">
                      DID Identifier
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-4 py-3 bg-black/30 backdrop-blur-sm border-2 border-blue-400/30 rounded-xl text-cyan-300 font-mono text-sm break-all">
                        {did}
                      </div>
                      <button
                        onClick={() => copyToClipboard(did)}
                        className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl hover:from-blue-600 hover:to-indigo-700 transform hover:scale-110 transition-all duration-300 shadow-lg"
                        title="Copy DID"
                      >
                        {copied ? (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleResolveDID}
                      disabled={loading}
                      className="flex-1 min-w-[200px] px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-2xl relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10 flex items-center justify-center">
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Resolving...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Resolve DID
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-6 inline-block p-4 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-400/30">
                    <svg className="w-16 h-16 text-blue-300 mx-auto animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-gray-300 mb-6 text-lg">You don't have a DID yet. Create one to get started with secure identity management.</p>
                  <button
                    onClick={handleCreateDID}
                    disabled={loading || !isConnected}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl hover:shadow-cyan-500/50 relative overflow-hidden group text-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Secure DID...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create Secure DID
                        </>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-400/50 rounded-2xl p-4 backdrop-blur-sm animate-shake transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-400/20 rounded-lg">
                <svg className="w-6 h-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-red-200 font-semibold">Security Alert</p>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* DID Document Display */}
        {didDocument && (
          <div 
            id="did-document"
            className={`bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-6 relative overflow-hidden transition-all duration-1000 ${showDocument ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10 opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">DID Document</h2>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(didDocument, null, 2))}
                  className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 transform hover:scale-110 transition-all duration-300"
                  title="Copy Document"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              
              <div className="bg-black/30 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-4 overflow-auto max-h-96">
                <pre className="text-cyan-300 text-sm font-mono">
                  {JSON.stringify(didDocument, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DIDManagement;
