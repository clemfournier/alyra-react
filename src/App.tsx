import './App.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Dashboard } from './pages/Dashboard';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getSolanaBalance } from './helpers/solana.helper';

function App() {

  const wallet = useWallet();
  const [solanaBalance, setSolanaBalance] = useState<number | null>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      getSolanaBalance(wallet.publicKey.toBase58())
        .then((balance) => setSolanaBalance(balance));
    } else {
      setSolanaBalance(null);
    }
  }, [wallet.publicKey]);

  return (
    <div className="App">
      <div className="header">
        <div className='wallet'>
          {
            solanaBalance !== null && 
            (
              <div>
                <p>Balance: {solanaBalance} SOL</p>
              </div>
            )
          }
          <WalletMultiButton></WalletMultiButton>
        </div>
      </div>
      <Dashboard />
    </div>
  );
}

export default App;
