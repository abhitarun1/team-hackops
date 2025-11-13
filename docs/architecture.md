# Architecture Overview

## System Architecture

The Decentralized Identity Vault is built as a monorepo with the following structure:

```
.
├── apps/
│   └── web/              # React.js web wallet
├── packages/
│   ├── contracts/        # Solidity smart contracts
│   ├── ipfs-client/      # IPFS integration
│   ├── did-core/         # DID/VC core utilities
│   ├── crypto-utils/     # Cryptographic operations
│   └── api/              # API for verifiers
└── docs/                 # Documentation
```

## Component Architecture

### 1. Smart Contracts Layer

**DIDRegistry.sol**
- Stores DID documents on blockchain
- Manages DID controllers
- Enables DID resolution
- W3C DID specification compliant

**CredentialStatusRegistry.sol**
- Tracks credential status (active, revoked, suspended, expired)
- Enables credential revocation
- Provides status checking for verifiers
- Supports batch operations

### 2. Core Libraries

**@identity-vault/did-core**
- W3C DID document creation and management
- Verifiable Credential creation and signing
- Verifiable Presentation creation
- Selective disclosure support

**@identity-vault/crypto-utils**
- Key pair generation
- Message signing and verification
- Selective disclosure proofs
- Key derivation

**@identity-vault/ipfs-client**
- Encrypted document storage on IPFS
- Document encryption/decryption
- IPFS pinning management
- Gateway URL generation

**@identity-vault/api**
- DID resolution API
- Credential verification API
- Presentation verification API
- Batch verification support

### 3. Frontend Application

**Web Wallet (React.js)**
- Key management
- DID creation and management
- Credential issuance and storage
- Credential verification
- Selective disclosure

## Data Flow

### DID Creation Flow
1. User generates key pair (client-side)
2. DID is derived from Ethereum address
3. DID document is created
4. DID is registered on blockchain via DIDRegistry contract
5. DID document is stored locally

### Credential Issuance Flow
1. Issuer creates Verifiable Credential
2. Credential is signed with issuer's private key
3. Credential is registered on CredentialStatusRegistry
4. Credential data is encrypted and stored on IPFS
5. IPFS CID is stored in credential metadata
6. Credential is sent to holder

### Credential Verification Flow
1. Verifier receives Verifiable Credential or Presentation
2. DID is resolved from blockchain
3. Credential status is checked on blockchain
4. Proof is verified cryptographically
5. Verification result is returned

### Selective Disclosure Flow
1. Holder receives credential request with required attributes
2. Holder creates selective disclosure proof
3. Only required attributes are revealed
4. Proof ensures integrity of hidden attributes
5. Verifier verifies proof without seeing hidden data

## Security Architecture

### Key Management
- All keys generated client-side
- Private keys never leave the user’s browser
- Keys stored in encrypted local storage with backup/recovery options

### Encryption
- Documents encrypted before IPFS upload
- AES-256 encryption for document storage
- Client-side encryption/decryption only

### Blockchain Security
- Smart contracts use OpenZeppelin best practices
- Access control via modifiers
- Input validation on all functions
- Events for audit trail

## Interoperability

### Standards Compliance
- W3C DID Core Specification
- W3C Verifiable Credentials Data Model
- W3C Verifiable Presentations
- JSON-LD context support

### Cross-Platform Support
- Web wallet (React.js)
- API for third-party integration
- Open standards for maximum compatibility

## Scalability Considerations

### Blockchain Layer
- EVM-compatible (Ethereum, Polygon, etc.)
- Gas optimization in smart contracts
- Batch operations support

### Storage Layer
- IPFS for decentralized storage
- Encryption before upload
- Pinning for persistence
- Gateway fallbacks

### Frontend Layer
- Modular architecture
- Shared packages for code reuse
- Optimized bundle sizes
- Lazy loading where applicable

