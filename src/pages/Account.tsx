import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getAccount, initializeAccount } from "../helpers/solana.helper";
import { useState } from "react";

export function Account() {

    const anchorWallet = useAnchorWallet();
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [sendingTransaction, setSendingTransaction] = useState<boolean>(false);
    const [account, setAccount] = useState<any | null | undefined>(undefined);
    const [data, setData] = useState<number>(0);
    const [age, setAge] = useState<number>(0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h1>
                Account
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div>
                    <label>
                        Data
                    </label>
                    <input
                        type="number"
                        value={data}
                        onChange={(e) => setData(parseInt(e.target.value))}
                        placeholder="Data"
                    />
                </div>
                <div>
                    <label>
                        Age
                    </label>
                    <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(parseInt(e.target.value))}
                        placeholder="Age"
                    />
                </div>
            </div>
            {
                anchorWallet?.publicKey && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                            onClick={async () => {
                                if (anchorWallet.publicKey) {
                                    const account = await getAccount(anchorWallet.publicKey)
                                    setAccount(account);
                                }
                            }}
                        >
                            Get Account
                        </button>
                        <button
                            onClick={async () => {
                                if (anchorWallet.publicKey) {
                                    setSendingTransaction(true);
                                    const initResult = await initializeAccount(anchorWallet, 100, 20);
                                    setTransactionHash(initResult);
                                    setSendingTransaction(false);
                                }
                            }}
                        >
                            Create Account
                        </button>
                    </div>
                )
            }
            {
                account !== undefined && (
                    <p>
                        Account: <b>{account === null ? 'N/A' : `data: ${account.data} - age: ${account.age}`}</b>
                    </p>
                )
            }
            {
                sendingTransaction && (
                    <p>
                        Sending transaction...
                    </p>
                )
            }
            {
                transactionHash && !sendingTransaction && (
                    <p>
                        Transaction hash: <b>{transactionHash}</b>
                    </p>
                )
            }
        </div>
    );
}