# API Documentation

## IdentityAPI Class

The `IdentityAPI` class provides methods for third-party verifiers to interact with the identity system.

### Constructor

```typescript
new IdentityAPI(
  provider: ethers.Provider,
  didRegistryAddress: string,
  credentialRegistryAddress: string,
  didRegistryABI: any[],
  credentialRegistryABI: any[]
)
```

### Methods

#### resolveDID(did: string): Promise<DIDResolutionResult>

Resolves a DID to its document.

**Parameters:**
- `did` (string): The DID identifier to resolve

**Returns:**
```typescript
{
  did: string;
  document: any;
  exists: boolean;
}
```

**Example:**
```typescript
const result = await api.resolveDID('did:ethr:0x123...');
if (result.exists) {
  console.log(result.document);
}
```

#### verifyCredential(credential: VerifiableCredential): Promise<VerificationResult>

Verifies a Verifiable Credential.

**Parameters:**
- `credential` (VerifiableCredential): The credential to verify

**Returns:**
```typescript
{
  valid: boolean;
  credentialId?: string;
  issuer?: string;
  errors?: string[];
  warnings?: string[];
}
```

**Example:**
```typescript
const result = await api.verifyCredential(credential);
if (result.valid) {
  console.log('Credential is valid');
} else {
  console.error(result.errors);
}
```

#### verifyPresentation(presentation: VerifiablePresentation): Promise<VerificationResult>

Verifies a Verifiable Presentation.

**Parameters:**
- `presentation` (VerifiablePresentation): The presentation to verify

**Returns:**
```typescript
{
  valid: boolean;
  holder?: string;
  errors?: string[];
  warnings?: string[];
}
```

**Example:**
```typescript
const result = await api.verifyPresentation(presentation);
if (result.valid) {
  console.log('Presentation is valid');
}
```

#### checkCredentialStatus(credentialId: string): Promise<StatusInfo>

Checks the status of a credential on the blockchain.

**Parameters:**
- `credentialId` (string): The credential ID to check

**Returns:**
```typescript
{
  status: number;  // 0=Active, 1=Revoked, 2=Suspended, 3=Expired
  isValid: boolean;
  expiresAt: number;
}
```

**Example:**
```typescript
const status = await api.checkCredentialStatus('cred:123:abc');
if (status.isValid) {
  console.log('Credential is active');
}
```

#### batchVerifyCredentials(credentials: VerifiableCredential[]): Promise<VerificationResult[]>

Batch verifies multiple credentials.

**Parameters:**
- `credentials` (VerifiableCredential[]): Array of credentials to verify

**Returns:**
- Array of verification results

**Example:**
```typescript
const results = await api.batchVerifyCredentials([cred1, cred2, cred3]);
results.forEach((result, index) => {
  console.log(`Credential ${index}: ${result.valid ? 'Valid' : 'Invalid'}`);
});
```

## Smart Contract APIs

### DIDRegistry Contract

#### createDID(did, context, publicKeys, services)

Creates a new DID on the blockchain.

**Parameters:**
- `did` (string): DID identifier
- `context` (string[]): JSON-LD contexts
- `publicKeys` (string[]): Public keys in JWK format
- `services` (string[]): Service endpoints

#### resolveDID(did)

Resolves a DID to its document.

**Parameters:**
- `did` (string): DID identifier

**Returns:**
- DID document struct

#### updateDID(did, context, publicKeys, services)

Updates an existing DID document.

**Parameters:**
- `did` (string): DID identifier
- `context` (string[]): Updated contexts
- `publicKeys` (string[]): Updated public keys
- `services` (string[]): Updated services

#### addController(did, controller)

Adds a controller to a DID.

**Parameters:**
- `did` (string): DID identifier
- `controller` (address): Controller address

#### removeController(did, controller)

Removes a controller from a DID.

**Parameters:**
- `did` (string): DID identifier
- `controller` (address): Controller address

### CredentialStatusRegistry Contract

#### issueCredential(credentialId, expiresAt)

Registers a new credential on the blockchain.

**Parameters:**
- `credentialId` (string): Unique credential identifier
- `expiresAt` (uint256): Expiration timestamp (0 = no expiration)

#### checkStatus(credentialId)

Checks the status of a credential.

**Parameters:**
- `credentialId` (string): Credential identifier

**Returns:**
- `status` (uint8): Status enum value
- `isValid` (bool): Whether credential is valid
- `expiresAt` (uint256): Expiration timestamp

#### revokeCredential(credentialId, reason)

Revokes a credential.

**Parameters:**
- `credentialId` (string): Credential identifier
- `reason` (string): Reason for revocation

#### suspendCredential(credentialId, reason)

Suspends a credential.

**Parameters:**
- `credentialId` (string): Credential identifier
- `reason` (string): Reason for suspension

#### reactivateCredential(credentialId)

Reactivates a suspended credential.

**Parameters:**
- `credentialId` (string): Credential identifier

## IPFS Client API

### IPFSClient Class

#### initialize(): Promise<void>

Initializes the IPFS node or HTTP client.

#### encryptDocument(data: string, key: string): EncryptedDocument

Encrypts data before uploading to IPFS.

**Parameters:**
- `data` (string): Data to encrypt
- `key` (string): Encryption key

**Returns:**
```typescript
{
  encryptedData: string;
  hash: string;
  algorithm: string;
}
```

#### uploadDocument(encryptedDocument: EncryptedDocument): Promise<string>

Uploads encrypted document to IPFS.

**Returns:**
- IPFS CID (Content Identifier)

#### downloadDocument(cid: string, key: string): Promise<string>

Downloads and decrypts document from IPFS.

**Parameters:**
- `cid` (string): IPFS Content Identifier
- `key` (string): Decryption key

**Returns:**
- Decrypted document data

## Error Handling

All API methods throw errors that should be caught and handled appropriately:

```typescript
try {
  const result = await api.verifyCredential(credential);
} catch (error) {
  console.error('Verification failed:', error.message);
}
```

Common error scenarios:
- Network errors
- Invalid credential format
- DID not found
- Credential revoked
- Expired credentials

