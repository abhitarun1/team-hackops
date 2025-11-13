# Development Guide

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- MetaMask (for testing)
- Hardhat (for smart contracts)

### Initial Setup

```bash
# Install root dependencies
npm install

# Install workspace packages
npm run install:contracts
npm run install:web
```

## Development Workflow

### Smart Contracts

```bash
cd packages/contracts

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to local network
npx hardhat node
npm run deploy:localhost
```

### Web App

```bash
cd apps/web

# Start development server
npm start

# Build for production
npm run build
```

## Testing

### Smart Contract Tests

```bash
cd packages/contracts
npm test
```

### Unit Tests

Each package can have its own test suite:

```bash
cd packages/[package-name]
npm test
```

## Code Structure

### Monorepo Structure

```
.
├── apps/
│   └── web/              # React web app
├── packages/
│   ├── contracts/        # Solidity contracts
│   ├── ipfs-client/      # IPFS integration
│   ├── did-core/         # DID/VC utilities
│   ├── crypto-utils/     # Crypto functions
│   └── api/              # API layer
└── docs/                 # Documentation
```

### Adding New Features

1. Create feature branch
2. Implement in appropriate package
3. Add tests
4. Update documentation
5. Submit pull request

## Smart Contract Development

### Adding New Contracts

1. Create contract in `packages/contracts/contracts/`
2. Add tests in `packages/contracts/test/`
3. Update deployment script
4. Update ABI exports

### Contract Standards

- Follow OpenZeppelin patterns
- Use access control modifiers
- Validate all inputs
- Emit events for important actions
- Gas optimization

## Frontend Development

### Web App Structure

```
apps/web/src/
├── components/      # Reusable components
├── contexts/         # React contexts
├── pages/           # Page components
├── hooks/           # Custom hooks
└── utils/           # Utility functions
```

## Package Development

### Creating New Package

1. Create directory in `packages/`
2. Add `package.json`
3. Add TypeScript config
4. Implement functionality
5. Add tests
6. Export from package

### Package Dependencies

- Use workspace protocol for internal packages
- Keep dependencies minimal
- Use TypeScript for type safety
- Export types properly

## Deployment

### Smart Contracts

1. Configure network in `hardhat.config.js`
2. Set environment variables
3. Run deployment script
4. Verify contracts on block explorer
5. Update contract addresses

### Web App

1. Build production bundle
2. Deploy to hosting service
3. Configure environment variables
4. Update contract addresses

## Code Style

### TypeScript

- Use strict mode
- Define types explicitly
- Avoid `any` when possible
- Use interfaces for objects

### React

- Functional components
- Hooks for state management
- TypeScript for props
- Component composition

### Solidity

- Follow style guide
- Use NatSpec comments
- Clear variable names
- Consistent formatting

## Debugging

### Smart Contracts

- Use Hardhat console
- Check transaction logs
- Verify on block explorer
- Use test networks

### Frontend

- React DevTools
- Browser DevTools
- Network inspection
- Console logging

## Contributing

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Update documentation
6. Submit PR

### Commit Messages

- Use clear, descriptive messages
- Reference issues when applicable
- Follow conventional commits

## Resources

- [W3C DID Specification](https://www.w3.org/TR/did-core/)
- [W3C VC Specification](https://www.w3.org/TR/vc-data-model/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [React Documentation](https://react.dev)

