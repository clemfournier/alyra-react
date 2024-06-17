import './App.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function App() {  
  return (
    <div className="App">
      <header className="App-header">
          <WalletMultiButton></WalletMultiButton>
      </header>
    </div>
  );
}

export default App;
