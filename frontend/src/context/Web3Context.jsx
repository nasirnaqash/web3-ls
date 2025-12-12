import { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import Solana wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

const Web3Context = createContext(null);

// Inner provider that uses wallet hooks
function Web3ContextInner({ children }) {
  const { publicKey, connected, connecting, disconnect, wallet, connect, select, wallets } = useWallet();
  const { connection } = useConnection();
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      // If Phantom is available, select it
      const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
      if (phantomWallet && phantomWallet.readyState === 'Installed') {
        select(phantomWallet.adapter.name);
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message);
    }
  }, [wallets, select]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
    }
  }, [disconnect]);

  const value = {
    account: publicKey ? publicKey.toBase58() : null,
    publicKey,
    isConnecting: connecting,
    error,
    connectWallet,
    disconnectWallet,
    isConnected: connected,
    wallet,
    connection
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function Web3Provider({ children }) {
  // Configure Solana network (devnet for testing, mainnet-beta for production)
  const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
  const endpoint = useMemo(() => {
    if (import.meta.env.VITE_SOLANA_RPC_URL) {
      return import.meta.env.VITE_SOLANA_RPC_URL;
    }
    return clusterApiUrl(network);
  }, [network]);

  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter()
    ],
    []
  );

  const onError = useCallback((error) => {
    console.error('Wallet error:', error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>
          <Web3ContextInner>
            {children}
          </Web3ContextInner>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
