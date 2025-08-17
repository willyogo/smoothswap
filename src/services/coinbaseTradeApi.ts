// Coinbase Advanced Trade API implementation
import { Token, SwapResult } from '../types';

// Coinbase Advanced Trade API configuration
const COINBASE_API_BASE = 'https://api.coinbase.com/api/v3/brokerage';

export interface CoinbaseCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface OrderRequest {
  client_order_id: string;
  product_id: string;
  side: 'BUY' | 'SELL';
  order_configuration: {
    market_market_ioc: {
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
  base_increment: string;
  quote_increment: string;
  quote_min_size: string;
  quote_max_size: string;
  base_min_size: string;
  base_max_size: string;
  status: string;
  trading_disabled: boolean;
}

// Token to Coinbase product ID mapping for Base network
export const TOKEN_TO_PRODUCT_ID: Record<string, string> = {
  'ETH-USDC': 'ETH-USD',
  'USDC-ETH': 'ETH-USD',
  'DAI-USDC': 'DAI-USD',
  'USDC-DAI': 'DAI-USD',
  'ETH-DAI': 'ETH-USD', // We'll convert through USD
  'DAI-ETH': 'ETH-USD',
};

// Get product ID from token pair
export const getProductId = (sourceToken: Token, targetToken: Token): string => {
  const key = `${sourceToken.symbol}-${targetToken.symbol}`;
  return TOKEN_TO_PRODUCT_ID[key] || 'ETH-USD';
};

// Create JWT token for Coinbase API authentication
export const createJWT = async (
  credentials: CoinbaseCredentials,
  requestPath: string,
  method: string,
  body?: string
): Promise<string> => {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = timestamp + method.toUpperCase() + requestPath + (body || '');
  
  // Import crypto for HMAC
  const encoder = new TextEncoder();
  const keyData = encoder.encode(credentials.apiSecret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = new Uint8Array(signature);
  const signatureHex = Array.from(signatureArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Create JWT payload
  const header = {
    alg: 'ES256',
    kid: credentials.apiKey,
    nonce: Math.random().toString(36).substring(2, 15)
  };
  
  const payload = {
    sub: credentials.apiKey,
    iss: 'coinbase-cloud',
    nbf: timestamp,
    exp: timestamp + 120, // 2 minutes
    aud: ['retail_rest_api_proxy']
  };
  
  // For demo purposes, return a mock JWT structure
  // In production, you'd use a proper JWT library
  return `Bearer ${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.${signatureHex}`;
};

// Get current market price for a product
export const getProductPrice = async (
  productId: string,
  credentials?: CoinbaseCredentials
): Promise<number> => {
  try {
    const response = await fetch(`${COINBASE_API_BASE}/market/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(credentials && {
          'Authorization': await createJWT(credentials, `/market/products/${productId}`, 'GET')
        })
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: ProductInfo = await response.json();
    return parseFloat(data.price);
    
  } catch (error) {
    console.error('Failed to get product price:', error);
    
    // Fallback to mock prices for demo
    const mockPrices: Record<string, number> = {
      'ETH-USD': 2500 + (Math.random() - 0.5) * 100,
      'BTC-USD': 45000 + (Math.random() - 0.5) * 1000,
      'DAI-USD': 1.00,
    };
    
    return mockPrices[productId] || 1.00;
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
    if (!credentials) {
      // For demo without API credentials, simulate the swap
      return simulateSwap(sourceToken, targetToken, amountUSD);
    }
    
    const productId = getProductId(sourceToken, targetToken);
    const clientOrderId = `slide-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Determine if we're buying or selling
    const isBuying = sourceToken.symbol === 'USDC' || sourceToken.symbol === 'DAI';
    
    const orderRequest: OrderRequest = {
      client_order_id: clientOrderId,
      product_id: productId,
      side: isBuying ? 'BUY' : 'SELL',
      order_configuration: {
        market_market_ioc: {
          quote_size: amountUSD.toFixed(2)
        }
      }
    };
    
    const requestPath = '/orders';
    const body = JSON.stringify(orderRequest);
    
    const response = await fetch(`${COINBASE_API_BASE}${requestPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await createJWT(credentials, requestPath, 'POST', body)
      },
      body
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const orderResponse: OrderResponse = await response.json();
    
    if (!orderResponse.success) {
      throw new Error(orderResponse.failure_reason || 'Order failed');
    }
    
    // Get the current price for calculation
    const price = await getProductPrice(productId, credentials);
    const amountOut = (amountUSD / price).toFixed(6);
    
    return {
      success: true,
      txHash: orderResponse.success_response?.order_id || 'unknown',
      amountIn: amountUSD.toFixed(2),
      amountOut,
      price: price.toFixed(2)
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

// Simulate swap for demo purposes (when no API credentials)
const simulateSwap = async (
  sourceToken: Token,
  targetToken: Token,
  amountUSD: number
): Promise<SwapResult> => {
  try {
    console.log('🎭 Simulating swap (no API credentials provided):', {
      from: sourceToken.symbol,
      to: targetToken.symbol,
      amount: `$${amountUSD}`
    });
    
    const productId = getProductId(sourceToken, targetToken);
    const price = await getProductPrice(productId);
    
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
      price: effectivePrice.toFixed(2)
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

// Get account balances
export const getAccountBalances = async (
  credentials?: CoinbaseCredentials
): Promise<Record<string, string>> => {
  try {
    if (!credentials) {
      // Return mock balances for demo
      return {
        'USDC': '1000.00',
        'ETH': '0.5',
        'DAI': '500.00'
      };
    }
    
    const requestPath = '/accounts';
    const response = await fetch(`${COINBASE_API_BASE}${requestPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await createJWT(credentials, requestPath, 'GET')
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const balances: Record<string, string> = {};
    
    if (data.accounts) {
      data.accounts.forEach((account: any) => {
        if (account.available_balance) {
          balances[account.currency] = account.available_balance.value;
        }
      });
    }
    
    return balances;
    
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
  
  const productId = getProductId(sourceToken, targetToken);
  if (!productId) {
    return { valid: false, error: 'Trading pair not supported' };
  }
  
  return { valid: true };
};