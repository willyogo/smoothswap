import { SliderTier, Token } from '../types';

// Base mainnet tokens
export const BASE_TOKENS: Token[] = [
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    image: 'https://images.ctfassets.net/q5ulk4bp65r7/3O9sjrr3HBZN74XICN6E6E/89b2b2f1e2e7f05c33b7adcb3d8b3e7d/USDC_Logo.svg'
  },
  {
    address: '0x4200000000000000000000000000000000000006', // WETH
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
  },
  {
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    image: 'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png'
  },
  {
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC
    symbol: 'USDbC',
    name: 'USD Base Coin',
    decimals: 6,
    image: 'https://images.ctfassets.net/q5ulk4bp65r7/3O9sjrr3HBZN74XICN6E6E/89b2b2f1e2e7f05c33b7adcb3d8b3e7d/USDC_Logo.svg'
  }
];

// Slider frequency tiers
export const SLIDER_TIERS: SliderTier[] = [
  {
    tier: 'days',
    min: 86400, // 1 day in seconds
    max: 2592000, // 30 days in seconds
    label: 'Days'
  },
  {
    tier: 'hours',
    min: 3600, // 1 hour in seconds
    max: 86400, // 24 hours in seconds
    label: 'Hours'
  },
  {
    tier: 'minutes',
    min: 60, // 1 minute in seconds
    max: 3600, // 60 minutes in seconds
    label: 'Minutes'
  },
  {
    tier: 'seconds',
    min: 1, // 1 second
    max: 60, // 60 seconds
    label: 'Seconds'
  }
];

export const DEFAULT_SOURCE_TOKEN = BASE_TOKENS[0]; // USDC
export const DEFAULT_TARGET_TOKEN = BASE_TOKENS[1]; // ETH

export const COINBASE_API_BASE = 'https://api.coinbase.com/v2';
export const BASE_CHAIN_ID = 8453;