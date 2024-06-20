import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { TipLinkWalletAutoConnect } from '@tiplink/wallet-adapter-react-ui';
import { registerTipLinkWallet } from '@tiplink/wallet-adapter';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const wallets = [new PhantomWalletAdapter()];

registerTipLinkWallet({
  clientId: "" ,
  theme: 'dark',
  title: 'Alyra',
  rpcUrl: process.env.REACT_APP_RPC_URL!,
});

root.render(
  <ConnectionProvider endpoint={process.env.REACT_APP_RPC_URL!}>
    <TipLinkWalletAutoConnect
      isReady={wallets.length > 0}
      query={{}}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </TipLinkWalletAutoConnect>
  </ConnectionProvider>
);
