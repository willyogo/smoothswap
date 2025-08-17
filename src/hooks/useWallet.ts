import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { WalletState } from '../types';
import { base } from 'wagmi/chains';
import { createSessionKeyPermissions } from '../config/coinbase';

export const useWallet = () => {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting, error, connectors, isSuccess } = useConnect();
  const { disconnect } = useDisconnect();
  
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({
    address,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    chainId: base.id,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isLoading: false,
  });
  const [sessionKeysRequested, setSessionKeysRequested] = useState(true); // Skip session key requests for now

  // Handle successful connection
  useEffect(() => {
    if (isSuccess && isConnected && address) {
      console.log('Wallet connected successfully:', address);
      // Force balance refresh after connection
      setTimeout(() => {
        refetchBalance();
      }, 1000);
    }
  }, [isSuccess, isConnected, address, refetchBalance]);

  // Update wallet state when connection changes
  useEffect(() => {
    console.log('Wallet state update:', { isConnected, address, balanceData });
    setWalletState({
      isConnected,
      address,
      balance: balanceData ? parseFloat(balanceData.formatted).toFixed(2) : '0.00',
      isLoading: isBalanceLoading || isConnecting,
    });
  }, [isConnected, address, balanceData, isBalanceLoading]);

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error('Wallet connection error:', error);
    }
  }, [error]);

  // Simplified session key handling - rely on smart wallet capabilities
  const requestSessionKeys = useCallback(async () => {
    console.log('🔑 Using Coinbase Smart Wallet built-in capabilities for invisible signing');
    setSessionKeysRequested(true);
    localStorage.setItem('sessionKeysGranted', 'true');
    localStorage.setItem('sessionKeysExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
    localStorage.setItem('sessionKeyAddress', address || '');
  }, [address]);

  const connectWallet = useCallback(async () => {
    try {
      console.log('Attempting to connect wallet...');
      const connector = connectors.find(c => c.id === 'coinbaseWalletSDK');
      
      if (!connector) {
        console.error('Available connectors:', connectors.map(c => c.id));
        throw new Error('Coinbase Wallet connector not found');
      }

      console.log('Found Coinbase connector, connecting...');
      
      await connect({
        connector,
        chainId: base.id,
      });
      
      console.log('✅ Smart wallet connected');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error; // Re-throw to handle in component
    }
  }, [connect, connectors]);

  const disconnectWallet = useCallback(() => {
    console.log('Disconnecting wallet...');
    setSessionKeysRequested(true); // Reset to true to skip session key requests
    localStorage.removeItem('sessionKeysGranted');
    localStorage.removeItem('sessionKeysExpiry');
    localStorage.removeItem('sessionKeyAddress');
    disconnect();
  }, [disconnect]);

  const refreshBalance = useCallback(async () => {
    if (isConnected) {
      console.log('Refreshing balance...');
      try {
        const result = await refetchBalance();
        console.log('Balance refresh result:', result);
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }
  }, [isConnected, refetchBalance]);

  return {
    ...walletState,
    isConnecting,
    isSuccess,
    sessionKeysRequested,
    connect: connectWallet,
    disconnect: disconnectWallet,
    refreshBalance,
    requestSessionKeys,
    error,
  };
};