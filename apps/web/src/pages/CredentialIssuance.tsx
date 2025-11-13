import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { DIDCore } from '@identity-vault/did-core';
import { ethers } from 'ethers';
import { CryptoUtils } from '@identity-vault/crypto-utils';

const CredentialStatusRegistryABI = [
  "function issueCredential(string memory credentialId, uint256 expiresAt)",
];

interface UploadedFile {
  file: File;
  type: 'image' | 'pdf';
  preview?: string;
  ipfsCid?: string;
}

const CredentialIssuance: React.FC = () => {
  const { isConnected, did, privateKey, addCredential, provider, ipfsClient } = useWallet();
  const [formData, setFormData] = useState({
    credentialType: '',
    holderDID: '',
    subjectData: '{}',
    expirationDays: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';

      if (!isImage && !isPDF) {
        errors.push(`Unsupported file type for ${file.name}: ${file.type}. Please upload images or PDFs only.`);
        return;
      }

      if (file.size > maxFileSize) {
        errors.push(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
        return;
      }

      const uploadedFile: UploadedFile = {
        file,
        type: isImage ? 'image' : 'pdf',
      };

      // Create preview for images
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setUploadedFiles((prev) => [...prev, uploadedFile]);
        };
        reader.onerror = () => {
          errors.push(`Failed to read image ${file.name}`);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(uploadedFile);
      }
    });

    // Add PDFs immediately
    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }

    // Show errors if any
    if (errors.length > 0) {
      setError(errors.join(' '));
      setTimeout(() => setError(null), 5000);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFileToIPFS = async (file: File, privateKey: string): Promise<string> => {
    if (!ipfsClient) {
      throw new Error('IPFS client not initialized');
    }

    // Ensure IPFS client is initialized
    await ipfsClient.initialize();

    // Read file as array buffer and convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = Array.from(uint8Array)
      .map(byte => String.fromCharCode(byte))
      .join('');
    const fileData = btoa(binaryString);

    // Create encryption key from private key
    const encryptionKey = CryptoUtils.deriveKey(privateKey, 'file-encryption');

    // Encrypt and upload to IPFS
    const encryptedDocument = ipfsClient.encryptDocument(fileData, encryptionKey);
    const cid = await ipfsClient.uploadDocument(encryptedDocument);

    // Pin the document for persistence
    try {
      await ipfsClient.pinDocument(cid);
    } catch (err) {
      console.warn('Failed to pin document (may require IPFS node access):', err);
      // Continue even if pinning fails
    }

    return cid;
  };

  const handleIssue = async () => {
    if (!isConnected || !did || !privateKey) {
      setError('Please connect your wallet and create a DID first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload files to IPFS first
      const fileReferences: Record<string, any> = {};
      if (uploadedFiles.length > 0 && privateKey && ipfsClient) {
        setSuccess('Uploading files to IPFS...');

        const updatedFiles = [...uploadedFiles];
        for (let i = 0; i < updatedFiles.length; i++) {
          const uploadedFile = updatedFiles[i];
          try {
            const cid = await uploadFileToIPFS(uploadedFile.file, privateKey);
            updatedFiles[i] = { ...uploadedFile, ipfsCid: cid };
            
            // Store file reference
            const fileKey = uploadedFile.type === 'image' 
              ? `image_${i + 1}` 
              : `document_${i + 1}`;
            
            fileReferences[fileKey] = {
              name: uploadedFile.file.name,
              type: uploadedFile.file.type,
              size: uploadedFile.file.size,
              ipfsCid: cid,
              ipfsGateway: ipfsClient.getGatewayUrl(cid),
            };
          } catch (err: any) {
            console.error(`Failed to upload file ${uploadedFile.file.name}:`, err);
            setError(`Failed to upload ${uploadedFile.file.name}. Please try again.`);
            setLoading(false);
            return;
          }
        }
        setUploadedFiles(updatedFiles);
      }

      // Parse subject data
      const subjectData = JSON.parse(formData.subjectData);
      const credentialSubject = {
        id: formData.holderDID || undefined,
        ...subjectData,
        ...(Object.keys(fileReferences).length > 0 && { attachments: fileReferences }),
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
      setUploadedFiles([]);
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
              Upload Documents (Images & PDFs)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF up to 10MB each</p>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map((uploadedFile, index) => (
                    <div
                      key={index}
                      className="relative border border-gray-200 rounded-lg p-3 bg-gray-50"
                    >
                      {uploadedFile.type === 'image' && uploadedFile.preview && (
                        <img
                          src={uploadedFile.preview}
                          alt={uploadedFile.file.name}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      {uploadedFile.type === 'pdf' && (
                        <div className="w-full h-32 bg-red-100 rounded mb-2 flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <p className="text-xs text-gray-600 truncate" title={uploadedFile.file.name}>
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.file.size / 1024).toFixed(2)} KB
                      </p>
                      {uploadedFile.ipfsCid && (
                        <p className="text-xs text-green-600 truncate" title={uploadedFile.ipfsCid}>
                          IPFS: {uploadedFile.ipfsCid.slice(0, 10)}...
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                        title="Remove file"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

