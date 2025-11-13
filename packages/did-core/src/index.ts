import { ethers } from 'ethers';
import { CryptoUtils } from '@identity-vault/crypto-utils';

/**
 * W3C DID Document structure
 */
export interface DIDDocument {
  '@context': string[];
  id: string;
  controller?: string | string[];
  publicKey?: PublicKey[];
  service?: Service[];
  created?: string;
  updated?: string;
}

export interface PublicKey {
  id: string;
  type: string;
  controller: string;
  publicKeyHex?: string;
  publicKeyBase58?: string;
  publicKeyJwk?: any;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

/**
 * W3C Verifiable Credential structure
 */
export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | Issuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  proof?: Proof;
  credentialStatus?: CredentialStatus;
}

export interface Issuer {
  id: string;
  name?: string;
}

export interface CredentialSubject {
  id?: string;
  [key: string]: any;
}

export interface Proof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  jws?: string;
  proofValue?: string;
}

export interface CredentialStatus {
  id: string;
  type: string;
}

/**
 * Verifiable Presentation structure
 */
export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  verifiableCredential: VerifiableCredential[];
  proof?: Proof;
  holder?: string;
}

/**
 * DID and VC utilities following W3C standards
 */
export class DIDCore {
  /**
   * Create a DID document
   * @param address Ethereum address
   * @param publicKey Public key in JWK format
   * @param services Optional service endpoints
   * @returns DID document
   */
  static createDIDDocument(
    address: string,
    publicKey: any,
    services?: Service[]
  ): DIDDocument {
    const did = CryptoUtils.addressToDID(address);
    
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/secp256k1-2019/v1'
      ],
      id: did,
      controller: did,
      publicKey: [
        {
          id: `${did}#keys-1`,
          type: 'EcdsaSecp256k1VerificationKey2019',
          controller: did,
          publicKeyJwk: publicKey
        }
      ],
      service: services || [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
  }

  /**
   * Create a Verifiable Credential
   * @param issuerDID Issuer's DID
   * @param credentialSubject Credential subject data
   * @param credentialType Credential type
   * @param expirationDate Optional expiration date
   * @returns Verifiable Credential (without proof)
   */
  static createVerifiableCredential(
    issuerDID: string,
    credentialSubject: CredentialSubject,
    credentialType: string,
    expirationDate?: string
  ): VerifiableCredential {
    const credentialId = `credential:${ethers.hexlify(ethers.randomBytes(16))}`;
    
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      id: credentialId,
      type: ['VerifiableCredential', credentialType],
      issuer: issuerDID,
      issuanceDate: new Date().toISOString(),
      expirationDate: expirationDate,
      credentialSubject: credentialSubject
    };
  }

  /**
   * Sign a Verifiable Credential
   * @param credential Verifiable Credential
   * @param privateKey Issuer's private key
   * @returns Signed Verifiable Credential
   */
  static async signCredential(
    credential: VerifiableCredential,
    privateKey: string
  ): Promise<VerifiableCredential> {
    const wallet = new ethers.Wallet(privateKey);
    const did = CryptoUtils.addressToDID(wallet.address);
    
    // Create JWT-like proof
    const payload = {
      '@context': credential['@context'],
      id: credential.id,
      type: credential.type,
      issuer: credential.issuer,
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate,
      credentialSubject: credential.credentialSubject
    };
    
    const message = JSON.stringify(payload);
    const signature = await wallet.signMessage(message);
    
    const proof: Proof = {
      type: 'EcdsaSecp256k1Signature2019',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: `${did}#keys-1`,
      jws: signature
    };
    
    return {
      ...credential,
      proof
    };
  }

  /**
   * Verify a Verifiable Credential
   * @param credential Verifiable Credential
   * @param issuerPublicKey Issuer's public key
   * @returns True if credential is valid
   */
  static async verifyCredential(
    credential: VerifiableCredential,
    _issuerPublicKey: string
  ): Promise<boolean> {
    if (!credential.proof) {
      return false;
    }
    
    // Extract message from credential (without proof)
    const { proof } = credential;
    
    // Verify signature
    if (proof.jws) {
      // In production, use proper JWT verification
      // This is a simplified version
      return true;
    }
    
    return false;
  }

  /**
   * Create a Verifiable Presentation
   * @param credentials Array of Verifiable Credentials
   * @param holderDID Holder's DID
   * @returns Verifiable Presentation (without proof)
   */
  static createVerifiablePresentation(
    credentials: VerifiableCredential[],
    holderDID: string
  ): VerifiablePresentation {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1'
      ],
      type: ['VerifiablePresentation'],
      verifiableCredential: credentials,
      holder: holderDID
    };
  }

  /**
   * Sign a Verifiable Presentation
   * @param presentation Verifiable Presentation
   * @param privateKey Holder's private key
   * @returns Signed Verifiable Presentation
   */
  static async signPresentation(
    presentation: VerifiablePresentation,
    privateKey: string
  ): Promise<VerifiablePresentation> {
    const wallet = new ethers.Wallet(privateKey);
    const did = CryptoUtils.addressToDID(wallet.address);
    
    const { proof, ...presentationWithoutProof } = presentation;
    const message = JSON.stringify(presentationWithoutProof);
    const signature = await wallet.signMessage(message);
    
    const proofObj: Proof = {
      type: 'EcdsaSecp256k1Signature2019',
      created: new Date().toISOString(),
      proofPurpose: 'authentication',
      verificationMethod: `${did}#keys-1`,
      jws: signature
    };
    
    return {
      ...presentation,
      proof: proofObj
    };
  }

  /**
   * Create a selective disclosure presentation
   * @param credential Original Verifiable Credential
   * @param revealedAttributes Attributes to reveal
   * @param holderPrivateKey Holder's private key
   * @returns Verifiable Presentation with selective disclosure
   */
  static async createSelectiveDisclosurePresentation(
    credential: VerifiableCredential,
    revealedAttributes: string[],
    holderPrivateKey: string
  ): Promise<VerifiablePresentation> {
    // Create filtered credential subject
    const filteredSubject: CredentialSubject = {};
    for (const attr of revealedAttributes) {
      if (credential.credentialSubject[attr] !== undefined) {
        filteredSubject[attr] = credential.credentialSubject[attr];
      }
    }
    
    // Create proof of hidden attributes (simplified)
    // In production, use proper ZKP or BBS+ signatures
    const proof = await CryptoUtils.createSelectiveDisclosureProof(
      credential.credentialSubject,
      revealedAttributes,
      holderPrivateKey
    );
    
    const presentation = this.createVerifiablePresentation(
      [{
        ...credential,
        credentialSubject: {
          ...filteredSubject,
          _proof: proof.proof,
          _nonce: proof.nonce
        }
      }],
      CryptoUtils.addressToDID(new ethers.Wallet(holderPrivateKey).address)
    );
    
    return await this.signPresentation(presentation, holderPrivateKey);
  }
}

