import './App.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Dashboard } from './pages/Dashboard';

function App() {

  return (
    <div className="App">
      <div className="header">
        <div className='wallet'>
          <WalletMultiButton></WalletMultiButton>
        </div>
      </div>
      <Dashboard />
    </div>
  );
}

export default App;
