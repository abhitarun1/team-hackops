import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { ethers } from 'ethers';
import { CryptoUtils } from '@identity-vault/crypto-utils';
import { VerifiableCredential } from '@identity-vault/did-core';
import { IPFSClient } from '@identity-vault/ipfs-client';

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  privateKey: string | null;
  did: string | null;
  credentials: VerifiableCredential[];
  provider: ethers.BrowserProvider | null;
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  createDID: () => Promise<string>;
  addCredential: (credential: VerifiableCredential) => void;
  removeCredential: (credentialId: string) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  ipfsClient: IPFSClient | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    privateKey: null,
    did: null,
    credentials: [],
    provider: null,
  });

  const [ipfsClient] = useState<IPFSClient>(() => {
    const client = new IPFSClient({
      httpUrl: 'https://ipfs.infura.io:5001/api/v0',
      gatewayUrl: 'https://ipfs.io/ipfs/'
    });
    client.initialize();
    return client;
  });

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Generate or load private key from local storage
        let privateKey = localStorage.getItem('identity_vault_private_key');
        if (!privateKey) {
          const keyPair = CryptoUtils.generateKeyPair();
          privateKey = keyPair.privateKey;
          localStorage.setItem('identity_vault_private_key', privateKey);
        }

        const did = CryptoUtils.addressToDID(address);

        setState({
          isConnected: true,
          address,
          privateKey,
          did,
          credentials: [],
          provider,
        });

        saveToLocalStorage();
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask or another Web3 wallet');
    }
  };

  const disconnectWallet = () => {
    setState({
      isConnected: false,
      address: null,
      privateKey: null,
      did: null,
      credentials: [],
      provider: null,
    });
    localStorage.removeItem('identity_vault_state');
  };

  const createDID = async (): Promise<string> => {
    if (!state.address || !state.privateKey) {
      throw new Error('Wallet not connected');
    }

    const did = CryptoUtils.addressToDID(state.address);
    setState(prev => ({ ...prev, did }));
    saveToLocalStorage();
    return did;
  };

  const addCredential = (credential: VerifiableCredential) => {
    setState(prev => ({
      ...prev,
      credentials: [...prev.credentials, credential],
    }));
    saveToLocalStorage();
  };

  const removeCredential = (credentialId: string) => {
    setState(prev => ({
      ...prev,
      credentials: prev.credentials.filter(c => c.id !== credentialId),
    }));
    saveToLocalStorage();
  };

  const saveToLocalStorage = () => {
    const dataToSave = {
      address: state.address,
      did: state.did,
      credentials: state.credentials,
    };
    localStorage.setItem('identity_vault_state', JSON.stringify(dataToSave));
  };

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('identity_vault_state');
      if (saved) {
        const data = JSON.parse(saved);
        const privateKey = localStorage.getItem('identity_vault_private_key');
        
        if (data.address && privateKey) {
          setState(prev => ({
            ...prev,
            address: data.address,
            did: data.did,
            credentials: data.credentials || [],
            privateKey,
            isConnected: !!data.address,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connectWallet,
        disconnectWallet,
        createDID,
        addCredential,
        removeCredential,
        saveToLocalStorage,
        loadFromLocalStorage,
        ipfsClient,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

