export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  image?: string;
  balance?: string;
  fiatValue?: string;
}

export interface WalletState {
  isConnected: boolean;
  address?: string;
  balance?: string;
  isLoading: boolean;
}

export interface DCAConfig {
  sourceToken: Token;
  targetToken: Token;
  frequency: number; // in milliseconds
  percentage: number; // always 1% for now
  isActive: boolean;
  nextSwapIn: number; // milliseconds until next swap
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  error?: string;
  amountIn: string;
  amountOut: string;
  price?: string;
}

export type FrequencyTier = 'days' | 'hours' | 'minutes' | 'seconds';

export interface SliderTier {
  tier: FrequencyTier;
  min: number; // in seconds
  max: number; // in seconds
  label: string;
}