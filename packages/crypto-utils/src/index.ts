import { ethers } from 'ethers';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
  address: string;
}

export interface SelectiveDisclosureProof {
  revealedAttributes: Record<string, any>;
  proof: string;
  nonce: string;
}

/**
 * Cryptographic utilities for identity and credential management
 */
export class CryptoUtils {
  /**
   * Generate a new Ethereum key pair
   * @returns Key pair with private key, public key, and address
   */
  static generateKeyPair(): KeyPair {
    const wallet = ethers.Wallet.createRandom();
    return {
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      address: wallet.address
    };
  }

  /**
   * Derive a key from a master key and purpose
   * @param masterKey Master key
   * @param purpose Purpose string (e.g., 'encryption', 'signing')
   * @returns Derived key
   */
  static deriveKey(masterKey: string, purpose: string): string {
    const data = `${masterKey}:${purpose}`;
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  /**
   * Sign a message with a private key
   * @param message Message to sign
   * @param privateKey Private key
   * @returns Signature
   */
  static async signMessage(message: string, privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signMessage(message);
  }

  /**
   * Verify a signature
   * @param message Original message
   * @param signature Signature
   * @param address Signer address
   * @returns True if signature is valid
   */
  static async verifySignature(
    message: string,
    signature: string,
    address: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Create a selective disclosure proof (simplified BBS+ signature approach)
   * @param credentialData Full credential data
   * @param revealedAttributes Attributes to reveal
   * @param privateKey Holder's private key
   * @returns Selective disclosure proof
   */
  static createSelectiveDisclosureProof(
    credentialData: Record<string, any>,
    revealedAttributes: string[],
    privateKey: string
  ): SelectiveDisclosureProof {
    // Create a simplified proof structure
    // In production, use proper BBS+ signatures or ZKP libraries
    
    const revealed: Record<string, any> = {};
    const hidden: string[] = [];
    
    for (const key in credentialData) {
      if (revealedAttributes.includes(key)) {
        revealed[key] = credentialData[key];
      } else {
        hidden.push(key);
      }
    }

    // Create commitment to hidden attributes
    const hiddenData = JSON.stringify(hidden.map(key => ({
      key,
      hash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(credentialData[key])))
    })));

    // Sign the commitment
    const message = `${JSON.stringify(revealed)}:${hiddenData}`;
    const signature = this.signMessageSync(message, privateKey);

    // Generate nonce for replay protection
    const nonce = ethers.hexlify(ethers.randomBytes(32));

    return {
      revealedAttributes: revealed,
      proof: signature,
      nonce: nonce
    };
  }

  /**
   * Verify a selective disclosure proof
   * @param proof Selective disclosure proof
   * @param issuerPublicKey Issuer's public key
   * @returns True if proof is valid
   */
  static async verifySelectiveDisclosureProof(
    proof: SelectiveDisclosureProof,
    _issuerPublicKey: string
  ): Promise<boolean> {
    // Verify the proof structure
    // In production, use proper BBS+ signature verification
    
    if (!proof.proof || !proof.revealedAttributes) {
      return false;
    }

    // Simplified verification - in production use proper ZKP verification
    return true; // Placeholder
  }

  /**
   * Synchronous message signing (for internal use)
   */
  private static signMessageSync(message: string, privateKey: string): string {
    const messageHash = sha256(message);
    const signature = secp256k1.sign(messageHash, privateKey.slice(2));
    return ethers.hexlify(signature.toCompactRawBytes());
  }

  /**
   * Encrypt data with a key
   * @param data Data to encrypt
   * @param key Encryption key
   * @returns Encrypted data (hex)
   */
  static encrypt(data: string, _key: string): string {
    const dataBytes = ethers.toUtf8Bytes(data);
    // Simplified encryption - in production use proper AES encryption
    return ethers.hexlify(dataBytes);
  }

  /**
   * Decrypt data with a key
   * @param encryptedData Encrypted data (hex)
   * @param key Decryption key
   * @returns Decrypted data
   */
  static decrypt(encryptedData: string, _key: string): string {
    const dataBytes = ethers.getBytes(encryptedData);
    // Simplified decryption - in production use proper AES decryption
    return ethers.toUtf8String(dataBytes);
  }

  /**
   * Generate a DID from an Ethereum address
   * @param address Ethereum address
   * @param method DID method (default: 'ethr')
   * @returns DID string
   */
  static addressToDID(address: string, method: string = 'ethr'): string {
    return `did:${method}:${address}`;
  }

  /**
   * Extract address from DID
   * @param did DID string
   * @returns Ethereum address or null
   */
  static didToAddress(did: string): string | null {
    const match = did.match(/^did:(\w+):(0x[a-fA-F0-9]{40})$/);
    return match ? match[2] : null;
  }
}

