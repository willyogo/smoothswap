import { useState, useEffect, useCallback, useRef } from 'react';
import { DCAConfig, SwapResult, FrequencyTier, Token } from '../types';
import { SLIDER_TIERS, DEFAULT_SOURCE_TOKEN, DEFAULT_TARGET_TOKEN } from '../config/constants';
import { executeRealSwap, validateRealSwap } from '../services/realSwapService';
import { useWallet } from './useWallet';
import { useAccount, useSendTransaction } from 'wagmi';

export const useDCA = () => {
  const { balance, refreshBalance } = useWallet();
  const { address } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const [config, setConfig] = useState<DCAConfig>({
    sourceToken: DEFAULT_SOURCE_TOKEN,
    targetToken: DEFAULT_TARGET_TOKEN,
    frequency: 3600000, // 1 hour in milliseconds
    percentage: 1,
    isActive: false,
    nextSwapIn: 0
  });

  const [currentTier, setCurrentTier] = useState<FrequencyTier>('hours');
  const [sliderValue, setSliderValue] = useState(50); // 0-100
  const [swapHistory, setSwapHistory] = useState<SwapResult[]>([]);
  const [totalSwapped, setTotalSwapped] = useState(0);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);

  // Handle OnchainKit swap results
  const handleOnchainKitSwap = useCallback((result: SwapResult) => {
    console.log('📊 Processing OnchainKit swap result:', result);
    
    // Add to swap history
    setSwapHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10

    if (result.success) {
      setTotalSwapped(prev => prev + parseFloat(result.amountIn));
      console.log('✅ Swap completed successfully:', result);
    } else {
      console.error('❌ Swap failed:', result.error);
    }
  }, []);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Convert slider value to frequency based on current tier
  const calculateFrequency = useCallback((value: number, tier: FrequencyTier): number => {
    const tierConfig = SLIDER_TIERS.find(t => t.tier === tier);
    if (!tierConfig) return 3600000; // fallback to 1 hour

    // Exponential scaling for more intuitive feel
    const normalizedValue = value / 100;
    const range = tierConfig.max - tierConfig.min;
    const frequency = tierConfig.min + (range * (1 - normalizedValue));
    
    return Math.round(frequency * 1000); // convert to milliseconds
  }, []);

  // Update frequency when slider or tier changes
  useEffect(() => {
    const newFrequency = calculateFrequency(sliderValue, currentTier);
    setConfig(prev => ({
      ...prev,
      frequency: newFrequency,
      nextSwapIn: prev.isActive ? newFrequency : 0
    }));
  }, [sliderValue, currentTier, calculateFrequency]);

  // Execute a single swap
  const executeSingleSwap = useCallback(async (): Promise<SwapResult> => {
    if (isExecutingSwap) {
      return {
        success: false,
        error: 'Swap already in progress',
        amountIn: '0',
        amountOut: '0'
      };
    }

    if (!address || !sendTransaction) {
      return {
        success: false,
        error: 'Wallet not connected or transaction function unavailable',
        amountIn: '0',
        amountOut: '0'
      };
    }

    setIsExecutingSwap(true);

    try {
      const currentBalance = parseFloat(balance || '0');
      
      if (currentBalance === 0) {
        throw new Error('Insufficient balance');
      }

      // Calculate 1% of balance for DCA
      const swapAmount = currentBalance * (config.percentage / 100);
      
      if (swapAmount < 0.01) {
        throw new Error('Swap amount too small (minimum $0.01 for reliable execution)');
      }
      
      // Validate the swap
      const validation = validateRealSwap(
        config.sourceToken, 
        config.targetToken, 
        swapAmount, 
        balance || '0'
      );
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      console.log('🚀 Executing invisible DCA swap:', {
        sourceToken: config.sourceToken.symbol,
        targetToken: config.targetToken.symbol,
        amountUSD: swapAmount.toFixed(2),
        userBalance: currentBalance.toFixed(2),
        address
      });

      console.log('🚀 Executing invisible swap via smart wallet');
      const result = await executeRealSwap(
        config.sourceToken,
        config.targetToken,
        swapAmount.toFixed(2),
        address,
        sendTransaction
      );

      handleOnchainKitSwap(result);
      
      // Refresh balance after swap
      if (result.success) {
        setTimeout(() => {
          refreshBalance();
        }, 2000);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Invisible swap execution error:', error);
      const errorResult: SwapResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        amountIn: '0',
        amountOut: '0'
      };
      
      handleOnchainKitSwap(errorResult);
      return errorResult;
    } finally {
      setIsExecutingSwap(false);
    }
  }, [config, balance, refreshBalance, isExecutingSwap, address, sendTransaction, handleOnchainKitSwap]);

  // Handle tier bouncing
  const handleSliderChange = useCallback((value: number) => {
    setSliderValue(value);
  }, []);

  // Handle tier changes
  const handleTierChange = useCallback((newTier: FrequencyTier) => {
    setCurrentTier(newTier);
    setSliderValue(50); // Reset to middle when changing tiers
  }, []);

  // Countdown timer
  const startCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setConfig(prev => {
        const newTime = Math.max(0, prev.nextSwapIn - 100);
        return { ...prev, nextSwapIn: newTime };
      });
    }, 100);
  }, []);

  // Start DCA
  const startDCA = useCallback(async () => {
    if (config.isActive) return;
    
    const currentBalance = parseFloat(balance || '0');
    if (currentBalance === 0) {
      console.error('Cannot start DCA with zero balance');
      return;
    }

    console.log('🚀 Starting DCA with invisible swaps');
    
    setConfig(prev => ({ ...prev, isActive: true, nextSwapIn: prev.frequency }));
    startCountdown();

    const runSwap = async () => {
      console.log('🔄 Executing scheduled invisible DCA swap');
      await executeSingleSwap();
      setConfig(prev => ({ ...prev, nextSwapIn: prev.frequency }));
    };

    intervalRef.current = setInterval(runSwap, config.frequency);
  }, [config.isActive, config.frequency, executeSingleSwap, startCountdown, balance]);

  // Stop DCA
  const stopDCA = useCallback(() => {
    setConfig(prev => ({ ...prev, isActive: false, nextSwapIn: 0 }));
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Update tokens
  const updateTokens = useCallback((source: Token, target: Token) => {
    setConfig(prev => ({
      ...prev,
      sourceToken: source,
      targetToken: target
    }));
  }, []);

  // Swap token positions
  const swapTokens = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      sourceToken: prev.targetToken,
      targetToken: prev.sourceToken
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return {
    config,
    currentTier,
    sliderValue,
    swapHistory,
    totalSwapped,
    isExecutingSwap,
    handleSliderChange,
    handleTierChange,
    startDCA,
    stopDCA,
    updateTokens,
    swapTokens,
    executeSwap: executeSingleSwap,
    handleOnchainKitSwap
  };
};