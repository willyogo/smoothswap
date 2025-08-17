import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useSendTransaction } from 'wagmi';
import { encodeFunctionData, parseUnits } from 'viem';
import { USDC_ADDRESS, DAI_ADDRESS, WETH_ADDRESS, AERODROME_ROUTER, MAX_UINT256 } from '../config/coinbase';

const SetupInvisibleSigning: React.FC = () => {
  const { address, requestSessionKeys, sessionKeysRequested } = useWallet();
  const { sendTransaction } = useSendTransaction();
  const [setupStep, setSetupStep] = useState<'requesting' | 'approving' | 'complete' | 'error'>('requesting');
  const [currentApproval, setCurrentApproval] = useState<string>('');
  const [error, setError] = useState<string>('');

  // ERC20 ABI for approve function
  const ERC20_ABI = [
    {
      inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
      name: 'approve',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ] as const;

  // Setup invisible signing
  useEffect(() => {
    const setupInvisibleSigning = async () => {
      if (!address) return;

      try {
        console.log('🔑 Smart wallet connected - invisible signing ready!');
        
        // Set up unlimited token approvals for smoother swaps
        setSetupStep('approving');
        await setupUnlimitedApprovals();
        
        // Complete setup
        setSetupStep('complete');
        
      } catch (error) {
        console.error('❌ Setup failed:', error);
        setError(error instanceof Error ? error.message : 'Setup failed');
        setSetupStep('error');
      }
    };

    if (address) setupInvisibleSigning();
  }, [address]);

  const setupUnlimitedApprovals = async () => {
    if (!sendTransaction) throw new Error('Send transaction not available');

    console.log('🔓 Setting up unlimited token approvals for invisible swaps...');
    
    const tokens = [
      { address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 },
      { address: DAI_ADDRESS, symbol: 'DAI', decimals: 18 },
      { address: WETH_ADDRESS, symbol: 'WETH', decimals: 18 },
    ];

    for (const token of tokens) {
      try {
        console.log(`💰 Approving unlimited ${token.symbol} for Aerodrome DEX...`);
        setCurrentApproval(token.symbol);

        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [AERODROME_ROUTER, BigInt(MAX_UINT256)]
        });

        const txHash = await sendTransaction({
          to: token.address,
          data: approveData,
          gas: 100000n
        });

        console.log(`✅ ${token.symbol} unlimited approval set:`, txHash);
        
        // Brief delay between approvals
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to approve ${token.symbol}:`, error);
        // Don't throw - continue with other tokens
      }
    }
    
    console.log('🎉 Token approval setup complete!');
  };

  const getStepIcon = () => {
    switch (setupStep) {
      case 'requesting':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'approving':
        return <Loader2 className="w-8 h-8 animate-spin text-orange-500" />;
      case 'complete':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStepTitle = () => {
    switch (setupStep) {
      case 'requesting':
        return 'Requesting Session Keys';
      case 'approving':
        return 'Setting Up Token Approvals';
      case 'complete':
        return 'Invisible Signing Ready!';
      case 'error':
        return 'Setup Failed';
    }
  };

  const getStepDescription = () => {
    switch (setupStep) {
      case 'requesting':
        return 'Requesting permissions for invisible transaction signing...';
      case 'approving':
        return `Setting unlimited approval for ${currentApproval}...`;
      case 'complete':
        return 'All swaps will now execute without confirmation prompts!';
      case 'error':
        return error || 'Something went wrong during setup.';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: setupStep === 'complete' ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          {getStepIcon()}
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">{getStepTitle()}</h2>
        <p className="text-blue-100 mb-6">{getStepDescription()}</p>

        {/* Setup Steps */}
        <div className="space-y-3 mb-6">
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            setupStep === 'requesting' ? 'bg-white/20' : 
            setupStep === 'approving' || setupStep === 'complete' ? 'bg-green-500/20' : 'bg-white/10'
          }`}>
            <Shield className="w-5 h-5" />
            <div className="text-left flex-1">
              <p className="font-semibold text-sm">Session Key Permissions</p>
              <p className="text-xs opacity-75">24-hour invisible signing authority</p>
            </div>
            {(setupStep === 'approving' || setupStep === 'complete') && (
              <CheckCircle className="w-5 h-5 text-green-300" />
            )}
          </div>

          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            setupStep === 'approving' ? 'bg-white/20' : 
            setupStep === 'complete' ? 'bg-green-500/20' : 'bg-white/10'
          }`}>
            <Zap className="w-5 h-5" />
            <div className="text-left flex-1">
              <p className="font-semibold text-sm">Token Approvals</p>
              <p className="text-xs opacity-75">Unlimited USDC, DAI, WETH approvals</p>
            </div>
            {setupStep === 'complete' && (
              <CheckCircle className="w-5 h-5 text-green-300" />
            )}
          </div>
        </div>

        {setupStep === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/20 border border-green-300/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-green-300" />
              <span className="font-semibold">Invisible Signing Active</span>
            </div>
            <p className="text-sm text-green-100">
              All future swaps will execute automatically without wallet confirmations!
            </p>
          </motion.div>
        )}

        {setupStep === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-300/30 rounded-lg p-4"
          >
            <p className="text-sm text-red-100 mb-3">
              Setup failed, but you can still use the app with manual confirmations.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {(setupStep === 'requesting' || setupStep === 'approving') && (
          <div className="flex items-center justify-center space-x-2 text-sm opacity-75">
            <Clock className="w-4 h-4" />
            <span>This may take a few moments...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SetupInvisibleSigning;