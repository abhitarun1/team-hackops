import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { VerifiableCredential } from '@identity-vault/did-core';

const Credentials: React.FC = () => {
  const { credentials, removeCredential } = useWallet();
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);

  const handleDelete = (credentialId: string) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      removeCredential(credentialId);
      if (selectedCredential?.id === credentialId) {
        setSelectedCredential(null);
      }
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Credentials</h1>
        <p className="mt-2 text-gray-600">View and manage your verifiable credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Credentials ({credentials.length})
            </h2>
            {credentials.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No credentials yet</p>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedCredential?.id === cred.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCredential(cred)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {Array.isArray(cred.type) ? cred.type[1] || cred.type[0] : cred.type}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Issued: {new Date(cred.issuanceDate).toLocaleDateString()}
                        </p>
                        {cred.expirationDate && (
                          <p className="text-sm text-gray-500">
                            Expires: {new Date(cred.expirationDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cred.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Credential Details</h2>
            {selectedCredential ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <p className="text-sm text-gray-900 break-all">{selectedCredential.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-sm text-gray-900">
                    {Array.isArray(selectedCredential.type)
                      ? selectedCredential.type.join(', ')
                      : selectedCredential.type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
                  <p className="text-sm text-gray-900 break-all">
                    {typeof selectedCredential.issuer === 'string'
                      ? selectedCredential.issuer
                      : selectedCredential.issuer.id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuance Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedCredential.issuanceDate).toLocaleString()}
                  </p>
                </div>
                {selectedCredential.expirationDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedCredential.expirationDate).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credential Subject</label>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedCredential.credentialSubject, null, 2)}
                  </pre>
                </div>
                {selectedCredential.proof && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proof</label>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedCredential.proof, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full JSON</label>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(selectedCredential, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Select a credential to view details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credentials;

