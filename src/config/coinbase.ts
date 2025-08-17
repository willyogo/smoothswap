import { createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { http } from 'viem';
import { createPublicClient, parseUnits, encodeFunctionData } from 'viem';

// Coinbase credentials are now handled server-side and should not be exposed to the client.
// Remove any VITE_ prefixed variables to prevent leaking sensitive values in the browser.

// Contract addresses for session key permissions
const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
const DAI_ADDRESS = '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb';

// Maximum uint256 value for unlimited approvals
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

// ERC20 ABI for approvals
const ERC20_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

// Aerodrome Router ABI for swaps
const AERODROME_ABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'routes', type: 'tuple[]', components: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'stable', type: 'bool' },
        { name: 'factory', type: 'address' }
      ]},
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Create session key permissions for invisible signing
export const createSessionKeyPermissions = () => {
  const validUntil = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
  const maxValue = parseUnits('1', 18); // 1 ETH max per transaction

  // Generate approval call data for unlimited approvals
  const unlimitedApproval = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  
  const usdcApprovalData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [AERODROME_ROUTER, BigInt(unlimitedApproval)]
  });

  const daiApprovalData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [AERODROME_ROUTER, BigInt(unlimitedApproval)]
  });

  const wethApprovalData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [AERODROME_ROUTER, BigInt(unlimitedApproval)]
  });

  return {
    permissions: [
      {
        target: AERODROME_ROUTER,
        value: maxValue.toString(),
        data: '0x', // Allow any swap call
        operation: 0, // CALL
        validUntil
      },
      {
        target: USDC_ADDRESS,
        value: '0',
        data: usdcApprovalData,
        operation: 0,
        validUntil
      },
      {
        target: DAI_ADDRESS,
        value: '0',
        data: daiApprovalData,
        operation: 0,
        validUntil
      },
      {
        target: WETH_ADDRESS,
        value: maxValue.toString(),
        data: wethApprovalData,
        operation: 0,
        validUntil
      }
    ],
    validUntil
  };
};

// Coinbase Developer Platform configuration
export const coinbaseConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'Slide - Gamified DCA',
      appLogoUrl: 'https://slide-gamified-dca-s-07rw.bolt.host/vite.svg',
      preference: 'smartWalletOnly',
      enableHostedBackups: false,
      version: '4',
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: false,
  multiInjectedProviderDiscovery: false,
});

// Export session key permissions for use in wallet connection
export { getSessionKeyPermissions, MAX_UINT256, AERODROME_ROUTER, USDC_ADDRESS, DAI_ADDRESS, WETH_ADDRESS };