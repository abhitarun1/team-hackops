import { create as createHttpClient, IPFSHTTPClient } from 'ipfs-http-client';
import CryptoJS from 'crypto-js';

export interface IPFSConfig {
  httpUrl?: string;
  gatewayUrl?: string;
}

export interface EncryptedDocument {
  encryptedData: string;
  hash: string;
  algorithm: string;
}

/**
 * IPFS Client with encryption for secure document storage
 */
export class IPFSClient {
  private httpClient: IPFSHTTPClient | null = null;
  private config: IPFSConfig;
  private gatewayUrl: string;

  constructor(config: IPFSConfig = {}) {
    this.config = config;
    this.gatewayUrl = config.gatewayUrl || 'https://ipfs.io/ipfs/';
  }

  /**
   * Initialize IPFS HTTP client
   */
  async initialize(): Promise<void> {
    if (!this.httpClient) {
      this.httpClient = createHttpClient({
        url: this.config.httpUrl || 'https://ipfs.infura.io:5001/api/v0'
      });
    }
  }

  /**
   * Encrypt data before uploading to IPFS
   * @param data Data to encrypt
   * @param key Encryption key (derived from user's master key)
   * @returns Encrypted document with metadata
   */
  encryptDocument(data: string, key: string): EncryptedDocument {
    const encrypted = CryptoJS.AES.encrypt(data, key).toString();
    const hash = CryptoJS.SHA256(data).toString();
    
    return {
      encryptedData: encrypted,
      hash: hash,
      algorithm: 'AES-256'
    };
  }

  /**
   * Decrypt data retrieved from IPFS
   * @param encryptedDocument Encrypted document
   * @param key Decryption key
   * @returns Decrypted data
   */
  decryptDocument(encryptedDocument: EncryptedDocument, key: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedDocument.encryptedData, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Upload encrypted document to IPFS
   * @param encryptedDocument Encrypted document
   * @returns IPFS CID (Content Identifier)
   */
  async uploadDocument(encryptedDocument: EncryptedDocument): Promise<string> {
    if (!this.httpClient) {
      await this.initialize();
    }

    const data = JSON.stringify(encryptedDocument);
    const buffer = Buffer.from(data);

    const result = await this.httpClient!.add(buffer);
    return result.cid.toString();
  }

  /**
   * Download and decrypt document from IPFS
   * @param cid IPFS Content Identifier
   * @param key Decryption key
   * @returns Decrypted document data
   */
  async downloadDocument(cid: string, key: string): Promise<string> {
    if (!this.httpClient) {
      await this.initialize();
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of this.httpClient!.cat(cid)) {
      chunks.push(chunk);
    }
    const data = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }

    const jsonString = Buffer.from(data).toString('utf-8');
    const encryptedDocument: EncryptedDocument = JSON.parse(jsonString);
    
    return this.decryptDocument(encryptedDocument, key);
  }

  /**
   * Get IPFS gateway URL for a CID
   * @param cid IPFS Content Identifier
   * @returns Gateway URL
   */
  getGatewayUrl(cid: string): string {
    return `${this.gatewayUrl}${cid}`;
  }

  /**
   * Pin a document to IPFS (ensure persistence)
   * @param cid IPFS Content Identifier
   */
  async pinDocument(cid: string): Promise<void> {
    if (!this.httpClient) {
      await this.initialize();
    }

    await this.httpClient!.pin.add(cid);
  }

  /**
   * Unpin a document from IPFS
   * @param cid IPFS Content Identifier
   */
  async unpinDocument(cid: string): Promise<void> {
    if (!this.httpClient) {
      await this.initialize();
    }

    await this.httpClient!.pin.rm(cid);
  }

  /**
   * Cleanup
   */
  async stop(): Promise<void> {
    this.httpClient = null;
  }
}

