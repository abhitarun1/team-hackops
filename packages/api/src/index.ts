import { ethers } from 'ethers';
import { DIDCore, VerifiableCredential, VerifiablePresentation } from '@identity-vault/did-core';

export interface VerificationResult {
  valid: boolean;
  credentialId?: string;
  issuer?: string;
  holder?: string;
  errors?: string[];
  warnings?: string[];
}

export interface DIDResolutionResult {
  did: string;
  document: any;
  exists: boolean;
}

/**
 * API for third-party verifiers to interact with the identity system
 */
export class IdentityAPI {
  private didRegistry: ethers.Contract;
  private credentialRegistry: ethers.Contract;

  constructor(
    provider: ethers.Provider,
    didRegistryAddress: string,
    credentialRegistryAddress: string,
    didRegistryABI: any[],
    credentialRegistryABI: any[]
  ) {
    this.didRegistry = new ethers.Contract(
      didRegistryAddress,
      didRegistryABI,
      provider
    );
    this.credentialRegistry = new ethers.Contract(
      credentialRegistryAddress,
      credentialRegistryABI,
      provider
    );
  }

  /**
   * Resolve a DID to its document
   * @param did DID identifier
   * @returns DID resolution result
   */
  async resolveDID(did: string): Promise<DIDResolutionResult> {
    try {
      const exists = await this.didRegistry.didExists(did);
      if (!exists) {
        return {
          did,
          document: null,
          exists: false
        };
      }

      const document = await this.didRegistry.resolveDID(did);
      return {
        did,
        document: {
          id: document.id,
          context: document.context,
          controller: document.controller,
          publicKey: document.publicKey,
          service: document.service,
          created: document.created.toString(),
          updated: document.updated.toString()
        },
        exists: true
      };
    } catch (error: any) {
      return {
        did,
        document: null,
        exists: false
      };
    }
  }

  /**
   * Verify a Verifiable Credential
   * @param credential Verifiable Credential
   * @returns Verification result
   */
  async verifyCredential(credential: VerifiableCredential): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check credential structure
    if (!credential['@context'] || !credential.type || !credential.issuer) {
      errors.push('Invalid credential structure');
      return { valid: false, errors };
    }

    // Check expiration
    if (credential.expirationDate) {
      const expiration = new Date(credential.expirationDate);
      if (expiration < new Date()) {
        errors.push('Credential has expired');
        return { valid: false, errors };
      }
    }

    // Resolve issuer DID
    const issuerDID = typeof credential.issuer === 'string' 
      ? credential.issuer 
      : credential.issuer.id;
    
    const didResolution = await this.resolveDID(issuerDID);
    if (!didResolution.exists) {
      errors.push('Issuer DID not found');
      return { valid: false, errors };
    }

    // Check credential status on blockchain
    if (credential.credentialStatus) {
      try {
        const [, isValid] = await this.credentialRegistry.checkStatus(
          credential.credentialStatus.id
        );
        if (!isValid) {
          errors.push('Credential has been revoked or is invalid');
          return { valid: false, errors };
        }
      } catch (error) {
        warnings.push('Could not verify credential status on blockchain');
      }
    }

    // Verify proof
    if (credential.proof) {
      const proofValid = await DIDCore.verifyCredential(
        credential,
        didResolution.document.publicKey[0]?.publicKeyJwk || ''
      );
      if (!proofValid) {
        warnings.push('Could not verify credential proof');
      }
    } else {
      warnings.push('Credential has no proof');
    }

    return {
      valid: errors.length === 0,
      credentialId: credential.id,
      issuer: issuerDID,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Verify a Verifiable Presentation
   * @param presentation Verifiable Presentation
   * @returns Verification result
   */
  async verifyPresentation(
    presentation: VerifiablePresentation
  ): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check presentation structure
    if (!presentation['@context'] || !presentation.verifiableCredential) {
      errors.push('Invalid presentation structure');
      return { valid: false, errors };
    }

    // Verify all credentials in the presentation
    const credentialResults = await Promise.all(
      presentation.verifiableCredential.map(cred => this.verifyCredential(cred))
    );

    const invalidCredentials = credentialResults.filter(r => !r.valid);
    if (invalidCredentials.length > 0) {
      errors.push(`${invalidCredentials.length} credential(s) are invalid`);
      invalidCredentials.forEach(result => {
        if (result.errors) {
          errors.push(...result.errors);
        }
      });
    }

    // Verify presentation proof
    if (presentation.proof && presentation.holder) {
      const holderResolution = await this.resolveDID(presentation.holder);
      if (!holderResolution.exists) {
        warnings.push('Holder DID not found');
      }
    } else {
      warnings.push('Presentation has no proof or holder');
    }

    return {
      valid: errors.length === 0,
      holder: presentation.holder,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Check credential status on blockchain
   * @param credentialId Credential ID
   * @returns Status information
   */
  async checkCredentialStatus(credentialId: string): Promise<{
    status: number;
    isValid: boolean;
    expiresAt: number;
  }> {
    try {
      const [status, isValid, expiresAt] = await this.credentialRegistry.checkStatus(
        credentialId
      );
      return {
        status: Number(status),
        isValid,
        expiresAt: Number(expiresAt)
      };
    } catch (error) {
      throw new Error('Failed to check credential status');
    }
  }

  /**
   * Batch verify multiple credentials
   * @param credentials Array of Verifiable Credentials
   * @returns Array of verification results
   */
  async batchVerifyCredentials(
    credentials: VerifiableCredential[]
  ): Promise<VerificationResult[]> {
    return Promise.all(
      credentials.map(cred => this.verifyCredential(cred))
    );
  }
}

