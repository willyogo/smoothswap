import { Token, SwapResult } from '../types';

// Supabase Edge Function URL for Coinbase Trade API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const COINBASE_TRADE_FUNCTION_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/coinbase-trade` : null;

// Get token price from CoinGecko API
export const getTokenPrice = async (tokenSymbol: string): Promise<number> => {
  try {
    const symbolMap: Record<string, string> = {
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'DAI': 'dai',
      'USDbC': 'usd-coin'
    };
    
    const coinId = symbolMap[tokenSymbol] || tokenSymbol.toLowerCase();
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const price = data[coinId]?.usd;
    
    if (!price || typeof price !== 'number') {
      throw new Error('Invalid price data');
    }
    
    return price;
  } catch (error) {
    console.warn('Failed to get token price from API:', error);
    // Fallback prices
    const fallbackPrices: Record<string, number> = {
      'ETH': 2500,
      'USDC': 1,
      'DAI': 1,
      'USDbC': 1
    };
    return fallbackPrices[tokenSymbol] || 1;
  }
};

// Execute swap using Coinbase Trade API via Supabase Edge Function
export const executeSwapService = async (
  sourceToken: Token,
  targetToken: Token,
  amountInUSD: string,
  userAddress: string
): Promise<SwapResult> => {
  try {
    console.log('🚀 Starting swap execution:', {
      from: sourceToken.symbol,
      to: targetToken.symbol,
      amountUSD: amountInUSD,
      user: userAddress
    });

    const amountNum = parseFloat(amountInUSD);
    if (amountNum <= 0) {
      throw new Error('Invalid swap amount');
    }

    // Since we're now using OnchainKit for real swaps, this service is just for fallback simulation
    console.log('🎭 Using fallback simulation - real swaps should use OnchainKit');
    return simulateSwap(sourceToken, targetToken, amountNum);

  } catch (error) {
    console.error('❌ Swap failed:', error);
    
    let errorMessage = 'Swap failed';
    
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('insufficient') && msg.includes('balance')) {
        errorMessage = 'Insufficient token balance';
      } else if (msg.includes('user rejected') || msg.includes('user denied')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (msg.includes('network') || msg.includes('fetch')) {
        errorMessage = 'Network error, please try again';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
      amountIn: amountInUSD,
      amountOut: '0',
    };
  }
};

// Simulate swap for demo purposes
const simulateSwap = async (
  sourceToken: Token,
  targetToken: Token,
  amountUSD: number
): Promise<SwapResult> => {
  try {
    console.log('🎭 Fallback simulation (OnchainKit should handle real swaps):', {
      from: sourceToken.symbol,
      to: targetToken.symbol,
      amount: `$${amountUSD}`
    });
    
    // Get current price from CoinGecko
    const price = await getTokenPrice(targetToken.symbol);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    
    // 95% success rate for simulation
    const isSuccess = Math.random() > 0.05;
    
    if (!isSuccess) {
      return {
        success: false,
        error: 'Simulated network error',
        amountIn: amountUSD.toFixed(2),
        amountOut: '0'
      };
    }
    
    // Calculate output with realistic slippage
    const slippage = 0.001 + Math.random() * 0.002; // 0.1-0.3% slippage
    const effectivePrice = price * (1 - slippage);
    const amountOut = (amountUSD / effectivePrice).toFixed(6);
    
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).slice(2, 66),
      amountIn: amountUSD.toFixed(2),
      amountOut,
      price: effectivePrice.toFixed(2),
      isSimulated: true,
      note: 'Fallback simulation - use OnchainKit component for real swaps'
    };
    
  } catch (error) {
    console.error('Swap simulation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Simulation error',
      amountIn: amountUSD.toFixed(2),
      amountOut: '0'
    };
  }
};

// Validate swap parameters
export const validateSwap = (
  sourceToken: Token,
  targetToken: Token,
  amountUSD: number,
  userBalance: string
): { valid: boolean; error?: string } => {
  // Basic validation
  if (amountUSD < 0.01) {
    return { valid: false, error: 'Minimum swap amount is $0.01' };
  }

  if (amountUSD > 10000) {
    return { valid: false, error: 'Maximum swap amount is $10,000' };
  }

  if (sourceToken.address === targetToken.address) {
    return { valid: false, error: 'Cannot swap token with itself' };
  }

  // Validate user balance
  const balance = parseFloat(userBalance || '0');
  if (balance < amountUSD) {
    return { valid: false, error: `Insufficient balance. Have: $${balance.toFixed(2)}, Need: $${amountUSD.toFixed(2)}` };
  }

  return { valid: true };
};