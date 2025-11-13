import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { DIDCore } from '@identity-vault/did-core';
import { ethers } from 'ethers';

const CredentialStatusRegistryABI = [
  "function issueCredential(string memory credentialId, uint256 expiresAt)",
];

const CredentialIssuance: React.FC = () => {
  const { isConnected, did, privateKey, addCredential, provider } = useWallet();
  const [formData, setFormData] = useState({
    credentialType: '',
    holderDID: '',
    subjectData: '{}',
    expirationDays: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registryAddress, setRegistryAddress] = useState('');

  React.useEffect(() => {
    const saved = localStorage.getItem('credential_registry_address');
    if (saved) {
      setRegistryAddress(saved);
    }
  }, []);

  const handleIssue = async () => {
    if (!isConnected || !did || !privateKey) {
      setError('Please connect your wallet and create a DID first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse subject data
      const subjectData = JSON.parse(formData.subjectData);
      const credentialSubject = {
        id: formData.holderDID || undefined,
        ...subjectData,
      };

      // Calculate expiration date
      const expirationDate = formData.expirationDays
        ? new Date(Date.now() + parseInt(formData.expirationDays) * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      // Create credential
      const credential = DIDCore.createVerifiableCredential(
        did,
        credentialSubject,
        formData.credentialType,
        expirationDate
      );

      // Sign credential
      const signedCredential = await DIDCore.signCredential(credential, privateKey);

      // Register on blockchain
      if (registryAddress && provider) {
        try {
          const wallet = new ethers.Wallet(privateKey, provider);
          const credentialRegistry = new ethers.Contract(
            registryAddress,
            CredentialStatusRegistryABI,
            wallet
          );

          const expiresAt = expirationDate
            ? Math.floor(new Date(expirationDate).getTime() / 1000)
            : 0;

          const tx = await credentialRegistry.issueCredential(signedCredential.id, expiresAt);
          await tx.wait();
        } catch (err) {
          console.warn('Failed to register on blockchain:', err);
        }
      }

      // Add credential status
      signedCredential.credentialStatus = {
        id: `status:${signedCredential.id}`,
        type: 'CredentialStatusList2017',
      };

      addCredential(signedCredential);
      setSuccess('Credential issued successfully!');
      setFormData({
        credentialType: '',
        holderDID: '',
        subjectData: '{}',
        expirationDays: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to issue credential');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Issue Credential</h1>
        <p className="mt-2 text-gray-600">Issue a new verifiable credential</p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Please connect your wallet to issue credentials</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Registry Configuration</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credential Status Registry Contract Address
          </label>
          <input
            type="text"
            value={registryAddress}
            onChange={(e) => {
              setRegistryAddress(e.target.value);
              localStorage.setItem('credential_registry_address', e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0x..."
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Credential Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credential Type *
            </label>
            <input
              type="text"
              value={formData.credentialType}
              onChange={(e) => setFormData({ ...formData, credentialType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., UniversityDegree, DrivingLicense"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holder DID (optional)
            </label>
            <input
              type="text"
              value={formData.holderDID}
              onChange={(e) => setFormData({ ...formData, holderDID: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="did:ethr:0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credential Subject Data (JSON) *
            </label>
            <textarea
              value={formData.subjectData}
              onChange={(e) => setFormData({ ...formData, subjectData: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              rows={6}
              placeholder='{"name": "John Doe", "degree": "Bachelor of Science", ...}'
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter JSON object with credential subject attributes
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration (days, optional)
            </label>
            <input
              type="number"
              value={formData.expirationDays}
              onChange={(e) => setFormData({ ...formData, expirationDays: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="365"
              min="1"
            />
          </div>

          <button
            onClick={handleIssue}
            disabled={loading || !isConnected || !formData.credentialType}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Issuing...' : 'Issue Credential'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}
    </div>
  );
};

export default CredentialIssuance;

