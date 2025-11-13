# Setup Instructions

## Prerequisites

Before starting, you need to install the following:

### 1. Install Node.js and npm

**For Windows:**

1. **Download Node.js:**
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS (Long Term Support)** version (recommended)
   - Choose the Windows Installer (.msi) for your system (64-bit or 32-bit)

2. **Install Node.js:**
   - Run the downloaded installer
   - Follow the installation wizard
   - Make sure to check "Add to PATH" option (usually checked by default)
   - Click "Install" and wait for installation to complete

3. **Verify Installation:**
   Open PowerShell or Command Prompt and run:
   ```powershell
   node --version
   npm --version
   ```
   You should see version numbers (e.g., `v18.17.0` and `9.6.7`)

4. **If npm is still not recognized:**
   - Restart your terminal/PowerShell window
   - Restart your computer if needed
   - Check if Node.js is in your PATH:
     - Open System Properties → Environment Variables
     - Check if `C:\Program Files\nodejs\` is in your PATH

**Alternative: Using Chocolatey (if you have it):**
```powershell
choco install nodejs-lts
```

**Alternative: Using winget (Windows Package Manager):**
```powershell
winget install OpenJS.NodeJS.LTS
```

### 2. Install Git (if not already installed)

- Download from [https://git-scm.com/download/win](https://git-scm.com/download/win)
- Or use: `winget install Git.Git`

### 3. Install MetaMask (for Web Wallet)

- Install MetaMask browser extension from [https://metamask.io/](https://metamask.io/)
- Available for Chrome, Firefox, Edge, and Brave

## Quick Start

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Smart contracts
cd packages/contracts && npm install && cd ../..

# Web app
cd apps/web && npm install && cd ../..
```

### 2. Configure Environment Variables

#### Smart Contracts

Create `packages/contracts/.env`:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
POLYGON_RPC_URL=https://polygon-rpc.com
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

#### Web App

Create `apps/web/.env`:

```env
VITE_DID_REGISTRY_ADDRESS=0x...
VITE_CREDENTIAL_REGISTRY_ADDRESS=0x...
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### 3. Deploy Smart Contracts

```bash
cd packages/contracts

# Start local Hardhat node (terminal #1)
npx hardhat node

# In another terminal, deploy contracts to the local node
npm run deploy:localhost

# Save the deployed addresses for use in frontend
```

### 4. Update Contract Addresses

After deployment, update the contract addresses in:
- `apps/web/.env`
- Or configure them in the web app UI

### 5. Start Development Server

```bash
cd apps/web
npm start
```

Visit `http://localhost:3000`

## Development Workflow

### Smart Contracts

1. Make changes to contracts
2. Compile: `npm run compile`
3. Test: `npm test`
4. Deploy: `npm run deploy`

### Frontend

1. Make changes to code
2. Hot reload will update automatically
3. Test in browser

## Testing

### Smart Contracts

```bash
cd packages/contracts
npm test
```

### Web App

```bash
cd apps/web
npm test
```

## Building for Production

### Smart Contracts

Contracts are already compiled. For verification:

```bash
cd packages/contracts
npm run verify
```

### Web App

```bash
cd apps/web
npm run build
```

Output in `apps/web/dist/`

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change port in `vite.config.ts` or `package.json`

2. **Contract deployment fails**
   - Check network configuration
   - Verify private key and RPC URL
   - Ensure sufficient balance

3. **IPFS connection issues**
   - Check IPFS gateway URL
   - Verify network connectivity
   - Try different gateway

4. **Wallet connection issues**
   - Ensure MetaMask is installed
   - Check network configuration
   - Refresh page

## Next Steps

1. Read [User Guide](./docs/user-guide.md)
2. Review [Architecture](./docs/architecture.md)
3. Check [API Documentation](./docs/api.md)
4. Review [Security Guide](./docs/security.md)

