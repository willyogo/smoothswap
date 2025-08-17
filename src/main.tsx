import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import App from './App.tsx';
import './index.css';
import { coinbaseConfig } from './config/coinbase';

const queryClient = new QueryClient();

console.log('Environment:', import.meta.env.MODE);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={coinbaseConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
