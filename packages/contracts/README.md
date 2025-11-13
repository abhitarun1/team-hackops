# Smart Contracts

This package contains the Solidity smart contracts for the Decentralized Identity Vault system.

## Contracts

### DIDRegistry.sol
W3C DID-compliant decentralized identifier registry that stores DID documents on the blockchain.

**Features:**
- Create, update, and deactivate DIDs
- Controller management
- DID resolution
- W3C DID specification compliance

### CredentialStatusRegistry.sol
Manages credential status (active, revoked, suspended, expired) on the blockchain.

**Features:**
- Credential issuance tracking
- Status updates (revoke, suspend, reactivate)
- Batch status checking
- Status history tracking

## Development

### Install Dependencies
```bash
npm install
```

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm test
```

### Deploy Contracts
```bash
# Local network
npm run deploy

# Testnet
npm run deploy:testnet
```

## Network Configuration

Configure networks in `hardhat.config.js` and set environment variables in `.env`:
- `PRIVATE_KEY`: Deployer private key
- `SEPOLIA_RPC_URL`: Sepolia testnet RPC endpoint
- `POLYGON_RPC_URL`: Polygon mainnet RPC endpoint
- `ETHERSCAN_API_KEY`: For contract verification
- `POLYGONSCAN_API_KEY`: For contract verification

## Security

- Contracts use OpenZeppelin best practices
- Comprehensive test coverage
- Access control modifiers
- Input validation

