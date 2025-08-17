import { Token, SwapResult } from '../types';

// Coinbase Advanced Trade API configuration
const COINBASE_API_BASE = 'https://api.coinbase.com/api/v3/brokerage';

export interface CoinbaseCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
}

export interface OrderRequest {
  client_order_id: string;
  product_id: string;
  side: 'BUY' | 'SELL';
  order_configuration: {
    market_market_ioc?: {
      quote_size?: string;
      base_size?: string;
    };
  };
}

export interface OrderResponse {
  success: boolean;
  failure_reason?: string;
  order_id?: string;
  success_response?: {
    order_id: string;
    product_id: string;
    side: string;
    client_order_id: string;
  };
  error_response?: {
    error: string;
    message: string;
    error_details: string;
  };
}

export interface ProductInfo {
  product_id: string;
  price: string;
  price_percentage_change_24h: string;
  volume_24h: string;
  volume_percentage_change_24h: string;
  base_increment: string;
  quote_increment: string;
  quote_min_size: string;
  quote_max_size: string;
  base_min_size: string;
  base_max_size: string;
  base_name: string;
  quote_name: string;
  watched: boolean;
  is_disabled: boolean;
  new: boolean;
  status: string;
  cancel_only: boolean;
  limit_only: boolean;
  post_only: boolean;
  trading_disabled: boolean;
  auction_mode: boolean;
  product_type: string;
  quote_currency_id: string;
  base_currency_id: string;
}

// Token to Coinbase product ID mapping
export const TOKEN_TO_PRODUCT_ID: Record<string, string> = {
  'ETH': 'ETH-USD',
  'USDC': 'USDC-USD',
  'DAI': 'DAI-USD',
  'USDbC': 'USDC-USD', // Map USDbC to USDC for trading
};

// Get product ID from token symbols
export const getProductId = (sourceToken: Token, targetToken: Token): string => {
  // For DCA, we're typically buying the target token with the source token
  const targetSymbol = targetToken.symbol === 'USDbC' ? 'USDC' : targetToken.symbol;
  const sourceSymbol = sourceToken.symbol === 'USDbC' ? 'USDC' : sourceToken.symbol;
  
  // Most common pattern: buying crypto with USD stablecoins
  if (sourceSymbol === 'USDC' || sourceSymbol === 'DAI') {
    return `${targetSymbol}-USD`;
  }
  
  // Selling crypto for USD stablecoins
  if (targetSymbol === 'USDC' || targetSymbol === 'DAI') {
    return `${sourceSymbol}-USD`;
  }
  
  // Default fallback
  return `${targetSymbol}-${sourceSymbol}`;
};

// Create JWT token for Coinbase API authentication
export const createJWT = (credentials: CoinbaseCredentials, requestPath: string, method: string, body?: string): string => {
  // This would normally use crypto libraries to create a proper JWT
  // For now, we'll simulate the authentication
  const timestamp = Math.floor(Date.now() / 1000);
  const message = timestamp + method.toUpperCase() + requestPath + (body || '');
  
  // In a real implementation, you'd use HMAC-SHA256 with the secret
  // For demo purposes, we'll return a mock JWT
  return `Bearer mock-jwt-token-${timestamp}`;
};

// Get current market price for a product
export const getProductPrice = async (productId: string): Promise<number> => {
  try {
    // In a real implementation, this would call the Coinbase API
    // For now, we'll return mock prices based on the product
    const mockPrices: Record<string, number> = {
      'ETH-USD': 2500 + (Math.random() - 0.5) * 100, // ETH around $2500
      'BTC-USD': 45000 + (Math.random() - 0.5) * 1000, // BTC around $45000
      'USDC-USD': 1.00,
      'DAI-USD': 1.00,
    };
    
    return mockPrices[productId] || 1.00;
  } catch (error) {
    console.error('Failed to get product price:', error);
    return 1.00; // Fallback price
  }
};

// Execute a market order
export const executeMarketOrder = async (
  sourceToken: Token,
  targetToken: Token,
  amountUSD: number,
  credentials?: CoinbaseCredentials
): Promise<SwapResult> => {
  try {
    const productId = getProductId(sourceToken, targetToken);
    const price = await getProductPrice(productId);
    
    // Simulate order execution
    const isSuccess = Math.random() > 0.05; // 95% success rate
    
    if (!isSuccess) {
      return {
        success: false,
        error: 'Market order failed due to insufficient liquidity',
        amountIn: amountUSD.toFixed(2),
        amountOut: '0'
      };
    }
    
    // Calculate output amount based on price and slippage
    const slippage = 0.001 + Math.random() * 0.002; // 0.1-0.3% slippage
    const effectivePrice = price * (1 - slippage);
    const amountOut = (amountUSD / effectivePrice).toFixed(6);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).slice(2, 66),
      amountIn: amountUSD.toFixed(2),
      amountOut,
      price: effectivePrice.toFixed(2)
    };
    
  } catch (error) {
    console.error('Market order execution failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      amountIn: amountUSD.toFixed(2),
      amountOut: '0'
    };
  }
};

// Get account balances (mock implementation)
export const getAccountBalances = async (credentials?: CoinbaseCredentials): Promise<Record<string, string>> => {
  try {
    // In a real implementation, this would fetch actual balances from Coinbase
    // For now, return mock balances
    return {
      'USDC': '1000.00',
      'ETH': '0.5',
      'DAI': '500.00'
    };
  } catch (error) {
    console.error('Failed to get account balances:', error);
    return {};
  }
};

// Validate order before execution
export const validateOrder = (
  sourceToken: Token,
  targetToken: Token,
  amountUSD: number
): { valid: boolean; error?: string } => {
  if (amountUSD < 0.01) {
    return { valid: false, error: 'Minimum order size is $0.01' };
  }
  
  if (amountUSD > 10000) {
    return { valid: false, error: 'Maximum order size is $10,000' };
  }
  
  if (sourceToken.address === targetToken.address) {
    return { valid: false, error: 'Cannot swap token with itself' };
  }
  
  return { valid: true };
};

// Note: This file now contains legacy mock functions
// Real swap functionality has been moved to swapService.ts