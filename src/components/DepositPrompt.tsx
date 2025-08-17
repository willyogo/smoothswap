import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, QrCode, Copy, X, AlertCircle, Wallet } from 'lucide-react';
import QRCode from 'qrcode';
import { useWallet } from '../hooks/useWallet';

const DepositPrompt: React.FC = () => {
  const { address, balance, refreshBalance } = useWallet();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Wallet className="w-8 h-8" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">Wallet Connected!</h2>
          <p className="text-blue-100 mb-2">
            {address && formatAddress(address)}
          </p>
          <p className="text-blue-100 mb-6">
            Your balance is $0. Deposit USDC to start DCA trading.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShowDeposit}
            className="w-full bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Deposit USDC</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              console.log('Refresh button clicked in DepositPrompt');
              refreshBalance();
            }}
            className="w-full mt-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg py-2 px-4 font-semibold transition-all"
          >
            Refresh Balance
          </motion.button>

          <p className="text-xs text-blue-200 mt-4">
            🔗 Base Network • 🔒 Secured by Coinbase
          </p>
        </div>
      </motion.div>

      {/* Deposit Modal */}
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
    </>
  );
};

export default DepositPrompt;