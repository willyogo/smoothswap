import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Loader2, CheckCircle, DollarSign, Copy, QrCode, X, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { useWallet } from '../hooks/useWallet';
import SetupInvisibleSigning from './SetupInvisibleSigning';

const WalletConnection: React.FC = () => {
  const { isConnected, address, balance, isLoading, isConnecting, isSuccess, sessionKeysRequested, connect, disconnect, error } = useWallet();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAutoDepositPrompt, setShowAutoDepositPrompt] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');

  // Auto-prompt for deposit when wallet is created with no balance
  useEffect(() => {
    if (isConnected && balance && parseFloat(balance) === 0) {
      const timer = setTimeout(() => {
        setShowAutoDepositPrompt(true);
      }, 1500); // Show after 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [isConnected, balance]);

  // Handle connection errors
  useEffect(() => {
    if (error) {
      setConnectionError(error.message || 'Failed to connect wallet');
      console.error('Connection error:', error);
    } else {
      setConnectionError('');
    }
  }, [error]);

  // Clear error when connection is successful
  useEffect(() => {
    if (isSuccess) {
      setConnectionError('');
    }
  }, [isSuccess]);

  const handleConnect = async () => {
    try {
      setConnectionError('');
      await connect();
    } catch (err) {
      console.error('Connection failed:', err);
      setConnectionError('Failed to connect. Please try again.');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleShowDeposit = async () => {
    if (address) {
      try {
        const qrUrl = await QRCode.toDataURL(address, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
        setShowDepositModal(true);
        setShowAutoDepositPrompt(false);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    }
  };

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleBalanceClick = () => {
    setShowBalanceModal(true);
  };

  // Mock asset breakdown (in a real app, this would come from multiple token balances)
  const mockAssets = [
    { symbol: 'USDC', name: 'USD Coin', balance: balance || '0.00', percentage: 100 },
    // Add more assets here when you have multi-token support
  ];

  const totalBalance = parseFloat(balance || '0');

  if (isConnected && address) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Coinbase Wallet Connected</p>
                <p className="text-sm opacity-90">{formatAddress(address)}</p>
                <p className="text-xs opacity-75">🔐 Invisible signing enabled</p>
              </div>
            </div>
            <motion.div 
              className="text-right cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBalanceClick}
            >
              <div className="flex items-center space-x-1 text-sm opacity-90">
                <DollarSign className="w-4 h-4" />
                <span>Total Balance</span>
              </div>
              <p className="font-bold text-lg">${balance}</p>
              <p className="text-xs opacity-75">Tap for details</p>
            </motion.div>
          </div>

          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShowDeposit}
              className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg py-2 px-4 font-semibold transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Deposit</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={disconnect}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg py-2 px-4 text-sm transition-all"
            >
              Disconnect
            </motion.button>
          </div>
        </motion.div>

        {/* Auto Deposit Prompt */}
        <AnimatePresence>
          {showAutoDepositPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Ready to start DCA trading!</h3>
                  <p className="text-sm opacity-90 mb-3">
                    Your wallet is empty. Deposit USDC to begin dollar-cost averaging into your favorite crypto assets.
                  </p>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleShowDeposit}
                      className="bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                    >
                      Deposit USDC
                    </motion.button>
                    <button
                      onClick={() => setShowAutoDepositPrompt(false)}
                      className="text-white/80 hover:text-white text-sm py-2 px-3 transition-colors"
                    >
                      Later
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance Details Modal */}
        <AnimatePresence>
          {showBalanceModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowBalanceModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Portfolio Balance</h3>
                  <button
                    onClick={() => setShowBalanceModal(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Total Balance */}
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-gray-800">${totalBalance.toFixed(2)}</p>
                  <p className="text-gray-500 text-sm">Total Portfolio Value</p>
                </div>

                {/* Asset Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Assets</span>
                    <span>Balance</span>
                  </div>
                  {mockAssets.map((asset, index) => (
                    <motion.div
                      key={asset.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">
                            {asset.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{asset.symbol}</p>
                          <p className="text-xs text-gray-500">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">${asset.balance}</p>
                        <p className="text-xs text-gray-500">{asset.percentage}%</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Deposit CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowBalanceModal(false);
                    handleShowDeposit();
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deposit More Funds</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deposit Modal */}
        <AnimatePresence>
          {showDepositModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowDepositModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Deposit USDC</h3>
                  <button
                    onClick={() => setShowDepositModal(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-gray-600 text-sm">
                    Send USDC to your wallet address on Base network
                  </p>

                  {/* QR Code */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    {qrCodeUrl && (
                      <img
                        src={qrCodeUrl}
                        alt="Wallet Address QR Code"
                        className="w-48 h-48 mx-auto"
                      />
                    )}
                  </div>

                  {/* Address */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Your Base Address</p>
                    <p className="font-mono text-sm text-gray-800 break-all">
                      {address}
                    </p>
                  </div>

                  {/* Copy Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopyAddress}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                      copySuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copySuccess ? 'Copied!' : 'Copy Address'}</span>
                  </motion.button>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>⚠️ Only send USDC on Base network</p>
                    <p>🔗 Contract: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: isLoading ? 360 : 0 }}
          transition={{ duration: 2, repeat: isLoading ? Infinity : 0 }}
          className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          {isLoading || isConnecting ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Wallet className="w-8 h-8" />
          )}
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Welcome to Slide</h2>
        <p className="text-blue-100 mb-6">
          Create your Coinbase smart wallet with seamless trading permissions
        </p>

        {/* Session Key Permissions Info */}
        <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
          <h3 className="font-semibold text-sm mb-2 flex items-center space-x-2">
            <span>🔐</span>
            <span>Session Key Permissions</span>
          </h3>
          <div className="text-xs text-blue-100 space-y-1">
            <p>• Execute transactions without confirmation</p>
            <p>• Unlimited token approvals for DEX</p>
            <p>• 24-hour session validity</p>
            <p>• Secure Coinbase Smart Wallet keys</p>
            <p>• Revocable at any time</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleConnect}
          disabled={isLoading || isConnecting}
          className={`w-full font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            connectionError 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
        >
          {isLoading || isConnecting ? (
            <span className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Smart Wallet...</span>
            </span>
          ) : connectionError ? (
            <span className="flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>Try Again</span>
            </span>
          ) : (
            'Create Smart Wallet'
          )}
        </motion.button>

        {connectionError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600 text-sm text-center">{connectionError}</p>
            <p className="text-red-500 text-xs text-center mt-1">
              Make sure you're on a supported network and try refreshing the page
            </p>
          </motion.div>
        )}

        <p className="text-xs text-blue-200 mt-3">
          🔒 Secured by Coinbase • No seed phrases needed
        </p>
      </div>
    </motion.div>
  );
};

export default WalletConnection;