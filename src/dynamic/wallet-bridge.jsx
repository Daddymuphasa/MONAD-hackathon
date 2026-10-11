import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DynamicContextProvider,
  DynamicWidget,
  mergeNetworks,
  useDynamicContext
} from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors, isEthereumWallet } from '@dynamic-labs/ethereum';
import { connectMonadWallet, createDynamicWalletSession } from '../monad/wallet.js';
import { MONAD_TESTNET } from '../monad/monad-testnet.js';

const environmentId = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID;
const monadNetwork = {
  blockExplorerUrls: [MONAD_TESTNET.explorerUrl],
  chainId: 10143,
  chainName: 'Monad Testnet',
  iconUrls: [],
  name: 'Monad Testnet',
  nativeCurrency: { decimals: 18, name: 'Monad', symbol: 'MON' },
  networkId: 10143,
  rpcUrls: [MONAD_TESTNET.rpcUrl],
  vanityName: 'Monad Testnet'
};

function SessionBridge({ onSession, onError, autoOpen }) {
  const { primaryWallet, sdkHasLoaded, setShowAuthFlow } = useDynamicContext();

  useEffect(() => {
    if (sdkHasLoaded && autoOpen && !primaryWallet) setShowAuthFlow(true);
  }, [autoOpen, primaryWallet, sdkHasLoaded, setShowAuthFlow]);

  useEffect(() => {
    if (!sdkHasLoaded || !primaryWallet) return;
    if (!isEthereumWallet(primaryWallet)) {
      onError(new Error('Papagedon requires an EVM wallet on Monad Testnet.'));
      return;
    }

    createDynamicWalletSession(primaryWallet).then(onSession).catch(onError);
  }, [primaryWallet, sdkHasLoaded, onSession, onError]);

  return <DynamicWidget />;
}

function BrowserWalletFallback({ onSession, onError }) {
  return (
    <button
      type="button"
      className="dynamic-fallback"
      onClick={() => connectMonadWallet().then(onSession).catch(onError)}
    >
      Connect Wallet
    </button>
  );
}

export function mountDynamicWallet(rootElement, callbacks) {
  const root = createRoot(rootElement);
  if (!environmentId) {
    root.render(<BrowserWalletFallback {...callbacks} />);
    return { provider: 'browser-fallback', configured: false };
  }

  root.render(
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
        initialAuthenticationMode: 'connect-and-sign',
        overrides: {
          evmNetworks: (networks) => mergeNetworks([monadNetwork], networks)
        }
      }}
    >
      <SessionBridge {...callbacks} />
    </DynamicContextProvider>
  );
  return { provider: 'dynamic', configured: true };
}
