import React from 'react';
import { motion } from 'framer-motion';
import WalletConnection from './components/WalletConnection';
import SwapInterface from './components/SwapInterface';
import DepositPrompt from './components/DepositPrompt';
import { useWallet } from './hooks/useWallet';

function App() {
  const { isConnected, balance } = useWallet();

  // Show deposit prompt if connected but balance is 0
  const shouldShowDepositPrompt = isConnected && balance && parseFloat(balance) === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-safe-top p-4 pb-2"
      >
        <div className="text-center">
          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Slide
          </motion.h1>
          <p className="text-gray-600 text-sm mt-1">
            Gamified DCA on Base ⚡
          </p>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {!isConnected ? (
            <div className="max-w-md mx-auto mt-8">
              <WalletConnection />
            </div>
          ) : shouldShowDepositPrompt ? (
            <div className="max-w-md mx-auto mt-8">
              <DepositPrompt />
            </div>
          ) : (
            <div className="mt-6">
              <SwapInterface />
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pb-safe-bottom p-4 text-xs text-gray-500"
      >
        <div className="flex items-center justify-center space-x-4">
          <span>🔗 Base Mainnet</span>
          <span>•</span>
          <span>🔒 Coinbase Secured</span>
          <span>•</span>
          <span>⚡ Gas Optimized</span>
        </div>
      </motion.footer>
    </div>
  );
}

export default App;