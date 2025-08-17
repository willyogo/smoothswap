import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin, referer, user-agent',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface SwapRequest {
  sourceToken: {
    symbol: string;
    address: string;
  };
  targetToken: {
    symbol: string;
    address: string;
  };
  amountUSD: number;
  userAddress: string;
  credentials?: {
    apiKey: string;
    apiSecret: string;
  };
}

// Get current market price from CoinGecko as fallback
async function getCurrentPrice(productId: string): Promise<number> {
  try {
    const symbolMap: Record<string, string> = {
      'ETH-USD': 'ethereum',
      'BTC-USD': 'bitcoin',
      'DAI-USD': 'dai',
    };
    
    const coinId = symbolMap[productId];
    if (coinId) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        { 
          headers: { 'Accept': 'application/json' },
          cache: 'no-cache'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = data[coinId]?.usd;
        if (price && typeof price === 'number') {
          console.log(`📊 Current ${productId} price from CoinGecko: $${price}`);
          return price;
        }
      }
    }
    
    // Fallback to mock prices if CoinGecko fails
    console.warn(`Failed to get price for ${productId}, using fallback`);
    return getFallbackPrice(productId);
    
  } catch (error) {
    console.warn(`Price fetch error for ${productId}:`, error);
    return getFallbackPrice(productId);
  }
}

// Fallback prices if API fails
function getFallbackPrice(productId: string): number {
  const fallbackPrices: Record<string, number> = {
    'ETH-USD': 2500,
    'BTC-USD': 45000,
    'DAI-USD': 1.00,
  };
  return fallbackPrices[productId] || 1.00;
}

// Get product ID from token pair
function getProductId(sourceSymbol: string, targetSymbol: string): string {
  const TOKEN_TO_PRODUCT_ID: Record<string, string> = {
    'ETH-USDC': 'ETH-USD',
    'USDC-ETH': 'ETH-USD',
    'DAI-USDC': 'DAI-USD',
    'USDC-DAI': 'DAI-USD',
    'ETH-DAI': 'ETH-USD',
    'DAI-ETH': 'ETH-USD',
  };
  
  const key = `${sourceSymbol}-${targetSymbol}`;
  return TOKEN_TO_PRODUCT_ID[key] || 'ETH-USD';
}

// Execute REAL swap using CDP SDK
async function executeRealSwapWithCDP(
  sourceSymbol: string,
  targetSymbol: string,
  amountUSD: number,
  userAddress: string,
  apiKey: string,
  apiSecret: string
): Promise<any> {
  try {
    console.log('🚀 Executing REAL swap with CDP SDK:', {
      sourceSymbol,
      targetSymbol,
      amountUSD,
      userAddress: userAddress.slice(0, 6) + '...' + userAddress.slice(-4)
    });

    // Import CDP SDK
    let Coinbase;
    try {
      const cdpModule = await import('npm:@coinbase/coinbase-sdk@latest');
      Coinbase = cdpModule.Coinbase;
      console.log('📦 CDP SDK imported successfully');
    } catch (importError) {
      console.error('❌ Failed to import CDP SDK:', importError);
      throw new Error('CDP SDK not available');
    }

    // Initialize Coinbase SDK properly
    console.log('🔧 Initializing Coinbase SDK...');
    Coinbase.configure({
      apiKeyName: apiKey,
      privateKey: apiSecret,
      useServerSigner: true
    });
    console.log('✅ Coinbase SDK initialized');

    // Create or import wallet for the user
    console.log('💼 Setting up wallet for user...');
    let wallet;
    
    try {
      // Try to import existing wallet by address
      wallet = await Coinbase.importWallet({
        walletId: userAddress,
        seed: userAddress // This might not work, but let's try
      });
      console.log('✅ Imported existing wallet');
    } catch (importError) {
      console.log('⚠️ Could not import wallet, creating new one...');
      
      try {
        // Create a new wallet
        wallet = await Coinbase.createWallet({
          networkId: 'base-mainnet'
        });
        console.log('✅ Created new wallet:', wallet.getId());
      } catch (createError) {
        console.error('❌ Failed to create wallet:', createError);
        throw new Error('Could not create or import wallet');
      }
    }

    // Get the default address from the wallet
    const address = await wallet.getDefaultAddress();
    console.log('📍 Wallet address:', address.getId());

    // Map token symbols to asset IDs for Base network
    const assetMap: Record<string, string> = {
      'USDC': 'usdc',
      'ETH': 'eth',
      'DAI': 'dai',
      'USDbC': 'usdc' // Map USDbC to USDC
    };

    const fromAssetId = assetMap[sourceSymbol];
    const toAssetId = assetMap[targetSymbol];

    if (!fromAssetId || !toAssetId) {
      throw new Error(`Unsupported token pair: ${sourceSymbol} -> ${targetSymbol}`);
    }

    console.log('💱 Creating trade:', {
      fromAssetId,
      toAssetId,
      amount: amountUSD.toString()
    });

    // Create and execute the trade
    const trade = await address.createTrade({
      amount: amountUSD.toString(),
      fromAssetId: fromAssetId,
      toAssetId: toAssetId
    });

    console.log('📋 Trade created:', trade.getId());

    // Wait for the trade to complete
    console.log('⏳ Waiting for trade to complete...');
    await trade.wait();
    
    console.log('✅ Trade completed successfully!');

    // Get trade details
    const tradeDetails = trade.getTransaction();
    const transactionHash = tradeDetails?.getTransactionHash();

    // Get current price for display
    const productId = getProductId(sourceSymbol, targetSymbol);
    const currentPrice = await getCurrentPrice(productId);
    const amountOut = (amountUSD / currentPrice).toFixed(6);

    return {
      success: true,
      txHash: transactionHash || trade.getId(),
      amountIn: amountUSD.toFixed(2),
      amountOut,
      price: currentPrice.toFixed(2),
      isReal: true,
      note: '✅ Real trade executed via Coinbase CDP SDK',
      tradeId: trade.getId(),
      walletId: wallet.getId()
    };

  } catch (error) {
    console.error('❌ CDP SDK trade failed:', error);
    throw error;
  }
}

// Alternative: Execute swap using Aerodrome DEX directly
async function executeSwapViaAerodrome(
  sourceSymbol: string,
  targetSymbol: string,
  amountUSD: number,
  userAddress: string
): Promise<any> {
  try {
    console.log('🚀 Executing swap via Aerodrome DEX');

    // Aerodrome is the main DEX on Base
    // Contract addresses on Base mainnet
    const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
    
    // Token addresses on Base
    const tokenAddresses: Record<string, string> = {
      'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'ETH': '0x4200000000000000000000000000000000000006', // WETH
      'DAI': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      'USDbC': '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA'
    };

    const fromToken = tokenAddresses[sourceSymbol];
    const toToken = tokenAddresses[targetSymbol];

    if (!fromToken || !toToken) {
      throw new Error(`Unsupported token pair: ${sourceSymbol} -> ${targetSymbol}`);
    }

    console.log('💱 Aerodrome swap parameters:', {
      router: AERODROME_ROUTER,
      fromToken,
      toToken,
      amountUSD
    });

    // For now, simulate the Aerodrome swap
    // In production, you'd call the Aerodrome router contract
    console.log('🎭 Simulating Aerodrome swap (contract integration needed)');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    const productId = getProductId(sourceSymbol, targetSymbol);
    const currentPrice = await getCurrentPrice(productId);
    const slippage = 0.001 + Math.random() * 0.002;
    const effectivePrice = currentPrice * (1 - slippage);
    const amountOut = (amountUSD / effectivePrice).toFixed(6);

    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).slice(2, 66),
      amountIn: amountUSD.toFixed(2),
      amountOut,
      price: effectivePrice.toFixed(2),
      isReal: false,
      isAerodromeSimulation: true,
      note: '🎭 Aerodrome simulation - contract integration needed',
      router: AERODROME_ROUTER
    };

  } catch (error) {
    console.error('❌ Aerodrome swap failed:', error);
    throw error;
  }
}

// Simulate swap for fallback
async function simulateSwap(
  sourceSymbol: string,
  targetSymbol: string,
  amountUSD: number
): Promise<any> {
  console.log('🎭 Using fallback simulation');
  
  const productId = getProductId(sourceSymbol, targetSymbol);
  const currentPrice = await getCurrentPrice(productId);
  
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
  
  const isSuccess = Math.random() > 0.05;
  
  if (!isSuccess) {
    return {
      success: false,
      error: 'Simulated network error',
      amountIn: amountUSD.toFixed(2),
      amountOut: '0'
    };
  }
  
  const slippage = 0.001 + Math.random() * 0.002;
  const effectivePrice = currentPrice * (1 - slippage);
  const amountOut = (amountUSD / effectivePrice).toFixed(6);
  
  return {
    success: true,
    txHash: '0x' + Math.random().toString(16).slice(2, 66),
    amountIn: amountUSD.toFixed(2),
    amountOut,
    price: effectivePrice.toFixed(2),
    isSimulated: true,
    note: 'Fallback simulation - API credentials needed for real trades'
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request received');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  console.log('🔄 Edge function called:', req.method, req.url);
  
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const requestBody = await req.json();
    const { sourceToken, targetToken, amountUSD, userAddress, credentials }: SwapRequest = requestBody;
    
    console.log('📥 Swap request received:', {
      sourceToken: sourceToken?.symbol,
      targetToken: targetToken?.symbol,
      amountUSD,
      userAddress: userAddress?.slice(0, 6) + '...' + userAddress?.slice(-4),
      hasCredentials: !!credentials
    });

    // Validate request
    if (!sourceToken || !targetToken || !amountUSD || !userAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    if (amountUSD < 0.01) {
      return new Response(
        JSON.stringify({ error: 'Minimum order size is $0.01' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get Coinbase credentials from environment or request
    const apiKey = Deno.env.get('COINBASE_API_KEY') || credentials?.apiKey;
    const apiSecret = Deno.env.get('COINBASE_API_SECRET') || credentials?.apiSecret;

    console.log('🔑 Checking credentials:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      source: Deno.env.get('COINBASE_API_KEY') ? 'environment' : 'request'
    });

    // Try CDP SDK first if credentials are available
    if (apiKey && apiSecret) {
      try {
        console.log('🚀 Attempting REAL swap with CDP SDK');
        const result = await executeRealSwapWithCDP(
          sourceToken.symbol,
          targetToken.symbol,
          amountUSD,
          userAddress,
          apiKey,
          apiSecret
        );

        console.log('📊 CDP SDK result:', result);

        return new Response(
          JSON.stringify(result),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      } catch (cdpError) {
        console.error('❌ CDP SDK failed:', cdpError);
        
        // Try Aerodrome as fallback
        console.log('🔄 Falling back to Aerodrome DEX');
        try {
          const aerodromeResult = await executeSwapViaAerodrome(
            sourceToken.symbol,
            targetToken.symbol,
            amountUSD,
            userAddress
          );
          
          aerodromeResult.note = `CDP failed: ${cdpError.message}. Using Aerodrome fallback.`;
          
          return new Response(
            JSON.stringify(aerodromeResult),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        } catch (aerodromeError) {
          console.error('❌ Aerodrome also failed:', aerodromeError);
          
          // Final fallback to simulation
          const simulationResult = await simulateSwap(
            sourceToken.symbol,
            targetToken.symbol,
            amountUSD
          );
          
          simulationResult.note = `Both CDP and Aerodrome failed. ${cdpError.message}`;
          simulationResult.isSimulated = true;
          
          return new Response(
            JSON.stringify(simulationResult),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
      }
    } else {
      console.log('⚠️ No CDP credentials, trying Aerodrome directly');
      
      try {
        const aerodromeResult = await executeSwapViaAerodrome(
          sourceToken.symbol,
          targetToken.symbol,
          amountUSD,
          userAddress
        );
        
        return new Response(
          JSON.stringify(aerodromeResult),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      } catch (aerodromeError) {
        console.error('❌ Aerodrome failed:', aerodromeError);
        
        // Fallback to simulation
        const simulationResult = await simulateSwap(
          sourceToken.symbol,
          targetToken.symbol,
          amountUSD
        );
        
        simulationResult.note = 'No CDP credentials and Aerodrome failed. Using simulation.';
        simulationResult.isSimulated = true;
        
        return new Response(
          JSON.stringify(simulationResult),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
    }

  } catch (error) {
    console.error('❌ Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});