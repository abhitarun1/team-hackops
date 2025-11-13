import React, { useState } from 'react';
import { IdentityAPI, VerificationResult } from '@identity-vault/api';
import { VerifiableCredential, VerifiablePresentation } from '@identity-vault/did-core';
import { ethers } from 'ethers';

const CredentialVerification: React.FC = () => {
  const [credentialJson, setCredentialJson] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didRegistryAddress, setDidRegistryAddress] = useState('');
  const [credentialRegistryAddress, setCredentialRegistryAddress] = useState('');

  React.useEffect(() => {
    const savedDid = localStorage.getItem('did_registry_address');
    const savedCred = localStorage.getItem('credential_registry_address');
    if (savedDid) setDidRegistryAddress(savedDid);
    if (savedCred) setCredentialRegistryAddress(savedCred);
  }, []);

  const handleVerify = async () => {
    if (!credentialJson.trim()) {
      setError('Please enter a credential JSON');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const credential: VerifiableCredential | VerifiablePresentation = JSON.parse(credentialJson);

      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);

      // Simplified ABI for API
      const didRegistryABI: any[] = [];
      const credentialRegistryABI: any[] = [];

      const api = new IdentityAPI(
        provider,
        didRegistryAddress || '0x0000000000000000000000000000000000000000',
        credentialRegistryAddress || '0x0000000000000000000000000000000000000000',
        didRegistryABI,
        credentialRegistryABI
      );

      let result: VerificationResult;

      if ('verifiableCredential' in credential) {
        // It's a Verifiable Presentation
        result = await api.verifyPresentation(credential as VerifiablePresentation);
      } else {
        // It's a Verifiable Credential
        result = await api.verifyCredential(credential as VerifiableCredential);
      }

      setVerificationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to verify credential');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Verify Credential</h1>
        <p className="mt-2 text-gray-600">Verify the validity of a verifiable credential or presentation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Registry Configuration</h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DID Registry Address
              </label>
              <input
                type="text"
                value={didRegistryAddress}
                onChange={(e) => {
                  setDidRegistryAddress(e.target.value);
                  localStorage.setItem('did_registry_address', e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0x..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credential Registry Address
              </label>
              <input
                type="text"
                value={credentialRegistryAddress}
                onChange={(e) => {
                  setCredentialRegistryAddress(e.target.value);
                  localStorage.setItem('credential_registry_address', e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0x..."
              />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Credential JSON</h2>
          <textarea
            value={credentialJson}
            onChange={(e) => setCredentialJson(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            rows={12}
            placeholder='Paste Verifiable Credential or Presentation JSON here...'
          />
          <button
            onClick={handleVerify}
            disabled={loading || !credentialJson.trim()}
            className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Credential'}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Result</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          {verificationResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                verificationResult.valid
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {verificationResult.valid ? (
                    <svg className="w-6 h-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className={`font-semibold ${
                    verificationResult.valid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verificationResult.valid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              </div>

              {verificationResult.credentialId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID</label>
                  <p className="text-sm text-gray-900 break-all">{verificationResult.credentialId}</p>
                </div>
              )}

              {verificationResult.issuer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
                  <p className="text-sm text-gray-900 break-all">{verificationResult.issuer}</p>
                </div>
              )}

              {verificationResult.holder && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Holder</label>
                  <p className="text-sm text-gray-900 break-all">{verificationResult.holder}</p>
                </div>
              )}

              {verificationResult.errors && verificationResult.errors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Errors</label>
                  <ul className="list-disc list-inside text-sm text-red-800">
                    {verificationResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {verificationResult.warnings && verificationResult.warnings.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-yellow-700 mb-1">Warnings</label>
                  <ul className="list-disc list-inside text-sm text-yellow-800">
                    {verificationResult.warnings.map((warn, idx) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Enter a credential JSON and click Verify</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CredentialVerification;

