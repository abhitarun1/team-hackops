# User Guide

## Getting Started

### Web Wallet

Before launching the web wallet, ensure a local blockchain node is running and contracts are deployed:
```bash
cd packages/contracts
npx hardhat node             # terminal #1 (keep running)
# in terminal #2
npm run deploy:localhost
```

Then start the web application:

1. **Install Dependencies**
   ```bash
   cd apps/web
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Your wallet address will be displayed

## Creating a DID

### Web Wallet

1. Navigate to "DID Management"
2. Configure DID Registry contract address
3. Click "Create DID"
4. Approve the transaction in MetaMask
5. Your DID will be created and displayed

## Issuing Credentials

### Web Wallet

1. Navigate to "Issue Credential"
2. Configure Credential Status Registry address
3. Fill in credential information:
   - Credential Type (e.g., "UniversityDegree")
   - Holder DID (optional)
   - Credential Subject Data (JSON)
   - Expiration (optional)
4. Click "Issue Credential"
5. Approve transaction in MetaMask
6. Credential will be issued and stored

### Example Credential Subject Data

```json
{
  "name": "John Doe",
  "degree": "Bachelor of Science",
  "university": "Example University",
  "graduationDate": "2023-05-15"
}
```

## Viewing Credentials

### Web Wallet

1. Navigate to "Credentials"
2. View list of all your credentials
3. Click on a credential to see details
4. View full JSON if needed

## Verifying Credentials

### Web Wallet

1. Navigate to "Verify Credential"
2. Configure registry addresses
3. Paste credential or presentation JSON
4. Click "Verify Credential"
5. View verification result

### Example Credential JSON

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1"
  ],
  "id": "credential:123",
  "type": ["VerifiableCredential", "UniversityDegree"],
  "issuer": "did:ethr:0x...",
  "issuanceDate": "2023-01-01T00:00:00Z",
  "credentialSubject": {
    "id": "did:ethr:0x...",
    "name": "John Doe",
    "degree": "Bachelor of Science"
  },
  "proof": {
    "type": "EcdsaSecp256k1Signature2019",
    "created": "2023-01-01T00:00:00Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:ethr:0x...#keys-1",
    "jws": "..."
  }
}
```

## Selective Disclosure

Selective disclosure allows you to share only specific attributes from a credential.

### Web Wallet

1. When verifying, use selective disclosure presentation
2. Only required attributes are revealed
3. Hidden attributes remain private
4. Proof ensures integrity

## Backup and Recovery

### Web Wallet

1. Navigate to "Settings"
2. Click "Create Backup"
3. Download backup file
4. Store backup securely

### Restore Backup

1. Navigate to "Settings"
2. Click "Choose File" under "Restore Backup"
3. Select backup file
4. Data will be restored

## Security Best Practices

1. **Backup Your Keys**
   - Always create backups of your wallet
   - Store backups in secure locations
   - Never share your private key

2. **Verify Credentials**
   - Always verify credentials before accepting
   - Check issuer DID validity
   - Verify credential status on blockchain

3. **Selective Disclosure**
   - Only share necessary attributes
   - Use selective disclosure when possible
   - Protect your privacy

4. **Keep Software Updated**
   - Update wallet software regularly
   - Check for security updates
   - Use latest versions

## Troubleshooting

### Wallet Connection Issues

- Ensure MetaMask is installed
- Check network connection
- Try refreshing the page

### Transaction Failures

- Check gas prices
- Ensure sufficient balance
- Verify contract addresses

### Credential Verification Failures

- Check credential format
- Verify issuer DID exists
- Check credential status
- Ensure credential not expired

## Support

For issues or questions:
- Check documentation
- Review error messages
- Verify configuration
- Check blockchain network status

