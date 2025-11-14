import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@identity-vault/crypto-utils': path.resolve(__dirname, '../../packages/crypto-utils/src'),
      '@identity-vault/did-core': path.resolve(__dirname, '../../packages/did-core/src'),
      '@identity-vault/ipfs-client': path.resolve(__dirname, '../../packages/ipfs-client/src'),
      '@identity-vault/api': path.resolve(__dirname, '../../packages/api/src'),
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'web3-vendor': ['ethers', 'web3'],
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'ethers']
  }
});

