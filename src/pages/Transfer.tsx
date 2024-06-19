import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { transferSolana } from "../helpers/solana.helper";

export function Transfer() {

    const wallet = useWallet();
    const [amount, setAmount] = useState<number>(0);
    const [destination, setDestination] = useState<string>('');
    const [signature, setSignature] = useState<string | null | undefined>(undefined);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h1>
                Transfer
            </h1>
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Amount"
            />
            <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
            />
            <button
                onClick={async () => {
                    if (amount > 0 && destination && wallet) {
                        const result = await transferSolana(wallet, new PublicKey(destination), amount);
                        setSignature(result);
                    }
                }}
            >
                Transfer
            </button>
            {
                signature !== undefined && (
                    <p>
                        Signature: {signature === null ? 'Error' : signature}
                    </p>
                )
            }
        </div>   
    )
}