import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Play, Pause, TrendingUp, Clock, Zap, ArrowUpDown, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDCA } from '../hooks/useDCA';
import { useWallet } from '../hooks/useWallet';
import TokenSelector from './TokenSelector';
import GameSlider from './GameSlider';
import { getSwapQuote } from '../services/realSwapService';
import InvisibleSwapTransaction from './InvisibleSwapTransaction';

const SwapInterface: React.FC = () => {
  const { address, balance, refreshBalance } = useWallet();
  const {
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
    executeSwap,
    handleOnchainKitSwap
  } = useDCA();

  const [swapQuote, setSwapQuote] = useState<{ expectedOutput: string; price: string; slippage: string } | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Trigger confetti on successful swaps
  useEffect(() => {
    const lastSwap = swapHistory[0];
    if (lastSwap?.success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06d6a0', '#118ab2', '#073b4c']
      });
    }
  }, [swapHistory]);

  // Get swap quote when tokens or balance change
  useEffect(() => {
    const loadQuote = async () => {
      if (parseFloat(balance || '0') > 0) {
        setIsLoadingQuote(true);
        try {
          const swapAmount = parseFloat(balance || '0') * 0.01;
          const quote = await getSwapQuote(config.sourceToken, config.targetToken, swapAmount);
          setSwapQuote(quote);
        } catch (error) {
          console.error('Failed to load swap quote:', error);
        } finally {
          setIsLoadingQuote(false);
        }
      }
    };

    loadQuote();
  }, [config.sourceToken, config.targetToken, balance]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getStatusColor = () => {
    if (!config.isActive) return 'from-gray-400 to-gray-500';
    if (currentTier === 'seconds') return 'from-red-500 to-pink-600';
    if (currentTier === 'minutes') return 'from-orange-500 to-yellow-600';
    if (currentTier === 'hours') return 'from-blue-500 to-indigo-600';
    return 'from-green-500 to-emerald-600';
  };

  return (
    <div className="max-w-md mx-auto space-y-6 p-4">
      {/* Wallet Info Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Wallet Connected</p>
              <p className="text-sm text-gray-600">
                {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Balance</p>
            <p className="font-bold text-lg text-gray-800">${balance || '0.00'}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshBalance}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
            >
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Token Selection */}
      <div className="space-y-4">
        <TokenSelector
          selectedToken={config.sourceToken}
          onSelectToken={(token) => updateTokens(token, config.targetToken)}
          label="You're selling"
          position="top"
        />

        {/* Swap button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={swapTokens}
            className="w-12 h-12 bg-white border-4 border-gray-200 rounded-full flex items-center justify-center hover:border-blue-300 transition-colors shadow-lg"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>

        <TokenSelector
          selectedToken={config.targetToken}
          onSelectToken={(token) => updateTokens(config.sourceToken, token)}
          label="You're buying"
          position="bottom"
        />
      </div>

      {/* Game Slider */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <GameSlider
          value={sliderValue}
          onChange={handleSliderChange}
          tier={currentTier}
          onTierChange={(newTier) => {
            handleTierChange(newTier);
          }}
          frequency={config.frequency}
        />
      </div>

      {/* Control Panel */}
      <motion.div
        className={`bg-gradient-to-r ${getStatusColor()} rounded-2xl p-6 text-white shadow-lg`}
        animate={{ scale: config.isActive ? [1, 1.02, 1] : 1 }}
        transition={{ duration: 2, repeat: config.isActive ? Infinity : 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`} />
            <span className="font-semibold">
              {config.isActive ? 'DCA Active' : 'DCA Paused'}
            </span>
          </div>
          
          {config.isActive && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>Next: {formatTime(config.nextSwapIn)}</span>
            </div>
          )}
        </div>

        {/* Balance check warning */}
        {parseFloat(balance || '0') === 0 && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-300/30 rounded-lg">
            <p className="text-sm text-yellow-100">
              ⚠️ Deposit funds to start DCA trading
            </p>
          </div>
        )}

        {/* Network status */}
        <div className="mb-4 p-3 bg-white/10 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Network:</span>
            <span className="font-semibold">Base Mainnet</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>DEX:</span>
            <span className="font-semibold">Smart Wallet + Aerodrome</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Signing:</span>
            <span className="font-semibold">Invisible</span>
          </div>
        </div>

        {/* Swap amount info */}
        {parseFloat(balance || '0') > 0 && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Next swap amount:</span>
              <span className="font-semibold">
                ${(parseFloat(balance || '0') * 0.01).toFixed(2)}
              </span>
            </div>
            <p className="text-xs opacity-75 mt-1">
              1% of your ${balance} balance
            </p>
            
            {/* Swap Quote */}
            {isLoadingQuote ? (
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-3 h-3 border border-white/50 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs opacity-75">Loading quote...</span>
              </div>
            ) : swapQuote ? (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs opacity-75">
                  <span>Expected output:</span>
                  <span>{swapQuote.expectedOutput} {config.targetToken.symbol}</span>
                </div>
                <div className="flex justify-between text-xs opacity-75">
                  <span>Price:</span>
                  <span>${swapQuote.price}</span>
                </div>
                <div className="flex justify-between text-xs opacity-75">
                  <span>Est. slippage:</span>
                  <span>{swapQuote.slippage}</span>
                </div>
              </div>
            ) : null}
            
            <p className="text-xs opacity-75 mt-2">
              ⚡ Invisible swaps via smart wallet
            </p>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={config.isActive ? stopDCA : startDCA}
          disabled={parseFloat(balance || '0') === 0}
          className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg py-3 px-6 font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {config.isActive ? (
            <>
              <Pause className="w-5 h-5" />
              <span>Pause DCA</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>
                {parseFloat(balance || '0') === 0 ? 'Deposit Required' : 'Start DCA'}
              </span>
            </>
          )}
        </motion.button>

        {totalSwapped > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Total Swapped:</span>
              <span className="font-semibold">${totalSwapped.toFixed(2)}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Swap History */}
      <AnimatePresence>
        {swapHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100"
          >
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">Recent Swaps</h3>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {swapHistory.slice(0, 5).map((swap, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    swap.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {swap.success ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <div className="text-xs text-gray-500">
                          {(swap as any).isReal === true ? 
                            <span className="text-green-600 font-semibold">✅ Real Trade via OnchainKit</span> : 
                            (swap as any).note ? 
                              <span className="text-orange-600">{(swap as any).note}</span> :
                              (swap as any).isSimulated ? 
                                <span className="text-blue-600">🎭 Simulated Trade</span> :
                                <span className="text-green-600 font-semibold">✅ Real Trade via OnchainKit</span>
                          }
                        </div>
                      </>
                    ) : (
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    <div className={swap.success ? 'text-green-700' : 'text-red-700'}>
                      <div className="font-medium">
                        {swap.success ? 'Success' : 'Failed'}
                      </div>
                      {!swap.success && (
                        <div className="text-xs">
                          {swap.error || 'Unknown error'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {swap.success && (
                    <div className="text-right">
                      <div className="font-semibold text-gray-700">
                        ${parseFloat(swap.amountIn).toFixed(2)}
                      </div>
                      {swap.price && (
                        <div className="text-xs text-gray-500">
                          @${parseFloat(swap.price).toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Swap Section */}
      {parseFloat(balance || '0') > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>Invisible Swap</span>
          </h3>
          
          <InvisibleSwapTransaction
            sourceToken={config.sourceToken}
            targetToken={config.targetToken}
            amountUSD={(parseFloat(balance || '0') * 0.01).toFixed(2)}
            onSwapComplete={handleOnchainKitSwap}
            disabled={parseFloat(balance || '0') === 0}
            isExecuting={isExecutingSwap}
          />
        </div>
      )}
    </div>
  );
};

export default SwapInterface;