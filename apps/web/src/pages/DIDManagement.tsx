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

  useEffect(() => {
    // Load registry address from env or localStorage
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
      alert('DID created successfully!');
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
      
      setDidDocument({
        id: resolved.id,
        context: resolved.context,
        controller: resolved.controller,
        publicKey: resolved.publicKey,
        service: resolved.service,
        created: new Date(Number(resolved.created) * 1000).toISOString(),
        updated: new Date(Number(resolved.updated) * 1000).toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to resolve DID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">DID Management</h1>
        <p className="mt-2 text-gray-600">Create and manage your Decentralized Identifier</p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Please connect your wallet to continue</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Registry Configuration</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DID Registry Contract Address
          </label>
          <input
            type="text"
            value={registryAddress}
            onChange={(e) => {
              setRegistryAddress(e.target.value);
              localStorage.setItem('did_registry_address', e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0x..."
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your DID</h2>
        {did ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DID Identifier</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md break-all">
                {did}
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleResolveDID}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Resolve DID'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">You don't have a DID yet. Create one to get started.</p>
            <button
              onClick={handleCreateDID}
              disabled={loading || !isConnected}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create DID'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {didDocument && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">DID Document</h2>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(didDocument, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DIDManagement;

