import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { TOKENS } from "../const/tokens";
import { getQuote } from "../helpers/jupiter.helper";
import { sendSwapTransaction } from "../helpers/solana.helper";

export function Swap() {
    const [token1, setToken1] = useState<string>('');
    const [token2, setToken2] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [quote, setQuote] = useState<QuoteResponse | null>(null);
    const [requestQuote, setRequestQuote] = useState<boolean>(false);
    const [sendingTransaction, setSendingTransaction] = useState<boolean>(false);
    const [transactionHash, setTransactionHash] = useState<string>('');
    const wallet = useWallet();

    const getJupiterQuote = async () => {
        try {
            setTransactionHash('');
            setQuote(null);
            setSendingTransaction(false);
            const token = TOKENS.find(token => token.mintAddress === token1);
            if (!token) return;
            setRequestQuote(true);
            const quote = await getQuote(amount * (10 ** token.decimals), token1, token2);
            setQuote(quote);
            setRequestQuote(false);
        } catch (error) {
            console.error(error);
            setRequestQuote(false);
        }
    }

    const swap = async () => {
        try {
            if (!wallet.publicKey) return;
            const token = TOKENS.find(token => token.mintAddress === token1);
            if (!token) return;
            setSendingTransaction(true);
            const swapTransaction = await sendSwapTransaction(wallet, amount * (10 ** token.decimals), token1, token2);
            if (swapTransaction) {
                setTransactionHash(swapTransaction);
            }
            setSendingTransaction(false);
        } catch (error) {
            console.error(error);
            setSendingTransaction(false);
        }
    }

    useEffect(() => {
        setQuote(null);
    }, [token1, token2, amount])

    return (
        <div>
            <h1>Swap</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                    type="number" 
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                />
                <select value={token1} onChange={(e) => setToken1(e.target.value)}>
                    <option value="">Select token</option>
                    {TOKENS.filter(token => token.mintAddress !== token2).map(token => (
                        <option key={`token1-${token.name}`} value={token.mintAddress}>{token.name}</option>
                    ))}
                </select>
                <span>FOR</span>
                <select value={token2} onChange={(e) => setToken2(e.target.value)}>
                    <option value="">Select token</option>
                    {TOKENS.filter(token => token.mintAddress !== token1).map(token => (
                        <option key={`token2-${token.name}`} value={token.mintAddress}>{token.name}</option>
                    ))}
                </select>
                {
                    requestQuote ? (
                        <span>Requesting quote...</span>
                    ) : (
                        <button onClick={getJupiterQuote}>
                            Get Quote
                        </button>
                    )
                }
            </div>
            {quote && (
                <div>
                    <h2>Quote</h2>
                    <p>In Amount: {(+quote.inAmount / ( 10 ** (TOKENS?.find(token => token?.mintAddress === token1)?.decimals ?? 1)))}</p>
                    <p>Out Amount: {(+quote.outAmount / ( 10 ** (TOKENS?.find(token => token?.mintAddress === token2)?.decimals ?? 1)))}</p>
                    <p>Price: ${
                        (+quote.inAmount / ( 10 ** (TOKENS?.find(token => token?.mintAddress === token1)?.decimals ?? 1))) /
                        (+quote.outAmount / ( 10 ** (TOKENS?.find(token => token?.mintAddress === token2)?.decimals ?? 1)))
                    }
                    </p>
                    <p>Route Plan: 
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {quote.routePlan.map((route: RoutePlan, index: number) => (
                                <>
                                    <span key={`route-per-${index}`}>{route.percent}</span>
                                    <span key={`route-label-${index}`}>{route.swapInfo.label}</span>
                                </>
                            ))}
                        </div>
                    </p>
                    {
                        sendingTransaction ? (
                            <p>Sending transaction...</p>
                        ) : (
                            <button onClick={swap}>
                                Swap
                            </button>
                        )
                    }
                    {
                        transactionHash && (
                            <p>Transaction hash: {transactionHash}</p>
                        )
                    }
                </div>
            )}
        </div>
    );
}