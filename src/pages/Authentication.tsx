import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { getWalletAuthentication, verifyEncodedMessage } from "../helpers/solana.helper";

export function Authentication() {

    const wallet = useWallet();

    const authMessage = 'Alyra connection';
    const fakeAuthMessage = 'Alyra connection fake message';
    const [encodedMessage, setEncodedMessage] = useState<Uint8Array | null>(null);
    const [canDecodeMessage, setCanDecodeMessage] = useState<boolean | null>(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h1>
                Authentication
            </h1>
            {
                !encodedMessage && (
                    <button
                        style={{ width: '200px' }}
                        onClick={async () => {
                            const signedMessage = await getWalletAuthentication(wallet, authMessage);
                            setEncodedMessage(signedMessage);
                        }}
                    >
                        Sign Message
                    </button>
                )
            }
                        {
                !encodedMessage && (
                    <button
                        style={{ width: '200px' }}
                        onClick={async () => {
                            const signedMessage = await getWalletAuthentication(wallet, fakeAuthMessage);
                            setEncodedMessage(signedMessage);
                        }}
                    >
                        Sign Fake Message
                    </button>
                )
            }
            {
                encodedMessage && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <p>
                            Signed message: <b>{encodedMessage}</b>
                        </p>
                        <button
                            style={{ width: '200px' }}
                            onClick={async () => {
                                const isVerified = await verifyEncodedMessage(wallet, authMessage, encodedMessage);
                                setCanDecodeMessage(isVerified);
                            }}
                        >
                            Decode
                        </button>
                    </div>
                )
            }
            {
                canDecodeMessage !== null && (
                    <p>
                        Can decode message: <b>{canDecodeMessage ? 'YES' : 'NO'}</b>
                    </p>
                )
            }
            {
                encodedMessage && (
                    <button
                        style={{ width: '200px' }}
                        onClick={() => {
                            setEncodedMessage(null);
                            setCanDecodeMessage(null);
                        }}
                    >
                        Reset
                    </button>
                )
            }
        </div>
    );
}