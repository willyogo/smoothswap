import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Token, SwapResult } from '../types';
import { useAccount, useSendTransaction } from 'wagmi';
import { executeRealSwap, getSwapQuote } from '../services/realSwapService';

interface InvisibleSwapTransactionProps {
  sourceToken: Token;
  targetToken: Token;
  amountUSD: string;
  onSwapComplete: (result: SwapResult) => void;
  disabled?: boolean;
  isExecuting?: boolean;
}

const InvisibleSwapTransaction: React.FC<InvisibleSwapTransactionProps> = ({
  sourceToken,
  targetToken,
  amountUSD,
  onSwapComplete,
  disabled = false,
  isExecuting = false
}) => {
  const { address } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<{ expectedOutput: string; price: string; slippage: string } | null>(null);

  // Load quote on mount
  React.useEffect(() => {
    const loadQuote = async () => {
      try {
        const quoteData = await getSwapQuote(sourceToken, targetToken, parseFloat(amountUSD));
        setQuote(quoteData);
      } catch (error) {
        console.error('Failed to load quote:', error);
      }
    };

    if (parseFloat(amountUSD) > 0) {
      loadQuote();
    }
  }, [sourceToken, targetToken, amountUSD]);

  const handleInvisibleSwap = useCallback(async () => {
    if (!address || !sendTransaction || isLoading || disabled) return;

    setIsLoading(true);
    
    try {
      console.log('🚀 Executing invisible swap via smart wallet');
      
      const result = await executeRealSwap(
        sourceToken,
        targetToken,
        amountUSD,
        address,
        sendTransaction
      );

      console.log('✅ Invisible swap result:', result);
      onSwapComplete(result);

    } catch (error) {
      console.error('❌ Invisible swap failed:', error);
      
      const errorResult: SwapResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Swap failed',
        amountIn: amountUSD,
        amountOut: '0'
      };
      
      onSwapComplete(errorResult);
    } finally {
      setIsLoading(false);
    }
  }, [address, sendTransaction, sourceToken, targetToken, amountUSD, onSwapComplete, isLoading, disabled]);

  if (!address) {
    return (
      <div className="text-center text-gray-500 py-4">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>Connect wallet to enable invisible swaps</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Swap Preview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
              {sourceToken.image ? (
                <img src={sourceToken.image} alt={sourceToken.symbol} className="w-5 h-5 rounded-full" />
              ) : (
                <span className="text-xs font-bold text-gray-600">{sourceToken.symbol.slice(0, 2)}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800">${amountUSD}</p>
              <p className="text-xs text-gray-600">{sourceToken.symbol}</p>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-gray-400" />

          <div className="flex items-center space-x-3">
            <div>
              <p className="font-semibold text-gray-800 text-right">
                {quote ? `${quote.expectedOutput}` : '...'}
              </p>
              <p className="text-xs text-gray-600 text-right">{targetToken.symbol}</p>
            </div>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
              {targetToken.image ? (
                <img src={targetToken.image} alt={targetToken.symbol} className="w-5 h-5 rounded-full" />
              ) : (
                <span className="text-xs font-bold text-gray-600">{targetToken.symbol.slice(0, 2)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Price:</span>
              <span>${quote.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. slippage:</span>
              <span>{quote.slippage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Invisible Swap Button */}
      <motion.button
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        onClick={handleInvisibleSwap}
        disabled={disabled || isLoading || isExecuting}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
      >
        {isLoading || isExecuting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Executing Invisible Swap...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Execute Invisible Swap</span>
          </>
        )}
      </motion.button>

      {/* Info Panel */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-medium text-gray-700">Session Key Signing Active</span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Zero wallet confirmations required</p>
            <p>• Automatic gas optimization</p>
            <p>• Secure 24-hour session keys</p>
            <p>• Real swaps via Aerodrome DEX on Base</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvisibleSwapTransaction;