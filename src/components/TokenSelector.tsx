import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X } from 'lucide-react';
import { Token } from '../types';
import { BASE_TOKENS } from '../config/constants';

interface TokenSelectorProps {
  selectedToken: Token;
  onSelectToken: (token: Token) => void;
  label: string;
  position: 'top' | 'bottom';
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onSelectToken,
  label,
  position
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = BASE_TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className={`relative bg-gradient-to-br ${
          position === 'top' 
            ? 'from-blue-50 to-blue-100 border-blue-200' 
            : 'from-emerald-50 to-emerald-100 border-emerald-200'
        } border-2 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
              {selectedToken.image ? (
                <img
                  src={selectedToken.image}
                  alt={selectedToken.symbol}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">
                    {selectedToken.symbol.slice(0, 2)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${
                position === 'top' ? 'text-blue-600' : 'text-emerald-600'
              }`}>
                {label}
              </p>
              <p className="font-bold text-lg text-gray-800">{selectedToken.symbol}</p>
              <p className="text-sm text-gray-600">{selectedToken.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedToken.balance && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="font-semibold">${selectedToken.balance}</p>
              </div>
            )}
            <ChevronDown className={`w-5 h-5 ${
              position === 'top' ? 'text-blue-400' : 'text-emerald-400'
            }`} />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Select Token</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTokens.map((token) => (
                  <motion.div
                    key={token.address}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectToken(token)}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                      token.address === selectedToken.address
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {token.image ? (
                        <img
                          src={token.image}
                          alt={token.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600">
                            {token.symbol.slice(0, 2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{token.symbol}</p>
                      <p className="text-sm text-gray-600">{token.name}</p>
                    </div>
                    {token.balance && (
                      <div className="text-right">
                        <p className="font-semibold">${token.balance}</p>
                        <p className="text-xs text-gray-500">{token.fiatValue}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TokenSelector;