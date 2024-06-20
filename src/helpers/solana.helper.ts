import { BN, Idl, Program } from "@coral-xyz/anchor";
import { AnchorWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { AddressLookupTableAccount, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { sign } from 'tweetnacl';
import { IDL, PROGRAM_ID } from "../idl/idl";
import { getQuote } from "./jupiter.helper";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const connection = new Connection(process.env.REACT_APP_RPC_URL!, "confirmed");
const program = new Program<Idl>(IDL as Idl, PROGRAM_ID, {
    connection,
});

export async function getSolanaBalance(publicKey: string): Promise<number> {
    const balanceInLamports = await connection.getBalance(new PublicKey(publicKey));
    const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
  
    return balanceInSol;
}

export const getWalletAuthentication = async (wallet: WalletContextState, message: string): Promise<Uint8Array | null> => {
    try {
      const messageEncoded = new TextEncoder().encode(`${message}`);
    
      if (!wallet.signMessage) {
        console.error('The wallet does not support message signing');
        return null;
      }
    
      return await wallet.signMessage(messageEncoded);
    } catch (error) {
      console.error(error);
      return null;
    }
};

export const verifyEncodedMessage = async (wallet: WalletContextState, message: string, encodedMessage: Uint8Array): Promise<boolean> => {
    try {
      if (!wallet.publicKey) {
        console.error('Wallet not connected');
        return false;
      }
      const messageEncoded = new TextEncoder().encode(`${message}`);
  
      return sign.detached.verify(messageEncoded, encodedMessage, wallet.publicKey.toBytes());
    } catch (error) {
      console.error(error);
      return false;
    }
};

export const getRecentBlockhash = async (): Promise<string | null> => {
    try {
      return (await connection.getLatestBlockhash()).blockhash;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

export const transferSolana = async (wallet: WalletContextState, destination: PublicKey, amount: number): Promise<string | null> => {
    try {
        if (!wallet.publicKey || !wallet.signTransaction) return null;
      const recentBlockhash = await getRecentBlockhash();
      const transferTransaction = new Transaction();

      // JUST FOR TESTING THE SIZE OF THE TRANSACTION
    //   if (!recentBlockhash) return null;
    //   transferTransaction.feePayer = wallet.publicKey;
    //   transferTransaction.recentBlockhash = recentBlockhash;
    //   console.log(transferTransaction.serialize({ requireAllSignatures: false }).byteLength);

      const transfer = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: destination,
        lamports: amount * LAMPORTS_PER_SOL
      });

      transferTransaction.add(transfer);

      if (transferTransaction && recentBlockhash) {
        transferTransaction.feePayer = wallet.publicKey;
        transferTransaction.recentBlockhash = recentBlockhash;
        const signedTransaction = await wallet.signTransaction(transferTransaction);
        return await connection.sendRawTransaction(signedTransaction.serialize());
      }
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
};

export const initializeAccount = async (anchorWallet: AnchorWallet, data: number, age: number): Promise<string | null> => {
    try {
      const accountTransaction = await getInitializeAccountTransaction(anchorWallet.publicKey, new BN(data), new BN(age));
      // const accountTransaction = await getInitializeAccountTransactionWWithoutAnchor(anchorWallet.publicKey, new BN(data), new BN(age));
  
      const recentBlockhash = await getRecentBlockhash();
      if (accountTransaction && recentBlockhash) {
          accountTransaction.feePayer = anchorWallet.publicKey;
          accountTransaction.recentBlockhash = recentBlockhash;
          const signedTransaction = await anchorWallet.signTransaction(accountTransaction);
          return await connection.sendRawTransaction(signedTransaction.serialize());
      }
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
};

export const getAccount = async (publicKey: PublicKey): Promise<any> => {
    try {
      const accountSeed = Buffer.from("account");
      const [accountPda] = PublicKey.findProgramAddressSync(
        [
            accountSeed, 
            publicKey.toBuffer()
        ], 
        new PublicKey(PROGRAM_ID.toString())
      );
      return await program.account.newAccount.fetch(accountPda);
    } catch (error) {
      console.error(error);
      return null;
    }
};

export const getInitializeAccountTransaction = async (publicKey: PublicKey, data: BN, age: BN): Promise<Transaction | null> => {
    try {
      const accountSeed = Buffer.from("account");
      const [accountPda] = PublicKey.findProgramAddressSync(
        [
          accountSeed, 
          publicKey.toBuffer()
        ], 
        new PublicKey(PROGRAM_ID.toString())
      );
      return await program.methods.initialize(data, age)
        .accounts({
            newAccount: accountPda,
            signer: publicKey,
            systemProgram: SystemProgram.programId
        })
        .transaction()
      } catch (error) {
        console.error(error);
        return null;
      }
};

export const getInitializeAccountTransactionWWithoutAnchor = async (publicKey: PublicKey, data: BN, age: BN): Promise<Transaction | null> => {
    try {
      const accountSeed = Buffer.from("account");
      const [accountPda] = PublicKey.findProgramAddressSync(
        [
          accountSeed, 
          publicKey.toBuffer()
        ], 
        new PublicKey(PROGRAM_ID.toString())
      );
  
      const instructionData = Buffer.alloc(10); // Adjust size as needed
      instructionData.writeUInt8(0, 0); // This is the "initialize" instruction index
      data.toArrayLike(Buffer, 'le', 8).copy(instructionData, 1); // Write data
      age.toArrayLike(Buffer, 'le', 2).copy(instructionData, 9); // Write age
  
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: accountPda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: new PublicKey(PROGRAM_ID.toString()),
        data: instructionData,
      });
  
      const transaction = new Transaction().add(instruction);
      return transaction;
    } catch (error) {
      console.error(error);
      return null;
    }
};

export async function instructionDataToTransactionInstruction(instructionPayload: any) {
  if (!instructionPayload) {
      return null;
  }

  return new TransactionInstruction({
      programId: new PublicKey(instructionPayload.programId),
      keys: instructionPayload.accounts.map((key: any) => ({
          pubkey: new PublicKey(key.pubkey),
          isSigner: key.isSigner,
          isWritable: key.isWritable,
      })),
      data: Buffer.from(instructionPayload.data, "base64"),
  });
};

export async function getSwapIxs(wallet: PublicKey, amount: number, mint: string, outputMint: string, destinationTokenAccount: string = '', slippage: string = '0.5') {
  const quoteResponse: any = await getQuote(amount, mint, outputMint, slippage);

  let swapParams: any = {
      quoteResponse,
      userPublicKey: wallet.toString(),
      wrapAndUnwrapSol: true,
      prioritzationFeeLamports: 1_000_000,
  }

  if (destinationTokenAccount.length > 0) {
      swapParams['destinationTokenAccount'] = destinationTokenAccount;
  }

  const swapIx: any = await (
      await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(swapParams)
      })
  ).json();

  const instructions: any = [];

  console.log('swapIx', swapIx);

  if (swapIx.computeBudgetInstructions) {
      for (let i = 0; i < swapIx.computeBudgetInstructions.length; i++) {
          instructions.push(await instructionDataToTransactionInstruction(swapIx.computeBudgetInstructions[i]));
      }
  }

  for (let i = 0; i < swapIx?.setupInstructions?.length; i++) {
      instructions.push(await instructionDataToTransactionInstruction(swapIx.setupInstructions[i]));
  }

  instructions.push(await instructionDataToTransactionInstruction(swapIx.swapInstruction));

  if (swapIx.cleanupInstruction) {
      instructions.push(await instructionDataToTransactionInstruction(swapIx.cleanupInstruction));
  }

  return { instructions, addressLookupTableAddresses: swapIx.addressLookupTableAddresses, swappedAmount: quoteResponse.outAmount };
}

export const getAddressLookupTableAccounts = async (
  keys: string[],
  connection: any,
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos =
      await connection.getMultipleAccountsInfo(
          keys.map((key) => new PublicKey(key))
      );

  return addressLookupTableAccountInfos.reduce((acc: any, accountInfo: any, index: any) => {
      const addressLookupTableAddress = keys[index];
      if (accountInfo) {
          const addressLookupTableAccount = new AddressLookupTableAccount({
              key: new PublicKey(addressLookupTableAddress),
              state: AddressLookupTableAccount.deserialize(accountInfo.data),
          });
          acc.push(addressLookupTableAccount);
      }

      return acc;
  }, new Array<AddressLookupTableAccount>());
};

export const jitoTipWallets: string[] = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT'
];

export const getJitoTipWallet = () => {
  // return random tip wallet from JitoTipWallets
  return jitoTipWallets[Math.floor(Math.random() * jitoTipWallets.length)];
}

export const createSwapTransaction = async (addressLookupTableAddresses: any, payer: PublicKey, swapIx: TransactionInstruction[]): Promise<VersionedTransaction | null> => {
  const addressLookupTableAccounts = addressLookupTableAddresses ? await getAddressLookupTableAccounts(
    addressLookupTableAddresses,
    connection,
 ) : [];

  let { blockhash } = await connection.getLatestBlockhash();

  const tipIx = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(getJitoTipWallet()),
      lamports: 100_000,
  });

  swapIx.push(tipIx);

  const swapMessageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: swapIx,
  }).compileToV0Message(addressLookupTableAccounts);
  
  return new VersionedTransaction(swapMessageV0);
};

export const sendTransaction = async (transaction: VersionedTransaction): Promise<string | null> => {
  const transactionSignature = transaction.signatures[0];
  let txSignature = bs58.encode(transactionSignature);
  
  try {
    let blockhashResult = await connection.getLatestBlockhash({
      commitment: "confirmed",
   });

    let confirmTransactionPromise;
    let txSendAttempts = 1;
    try {
       confirmTransactionPromise = connection.confirmTransaction(
          {
             signature: txSignature,
             blockhash: blockhashResult.blockhash,
             lastValidBlockHeight: blockhashResult.lastValidBlockHeight,
          },
          "confirmed"
       );

       let confirmedTx = null;
       while (!confirmedTx) {
          confirmedTx = await Promise.race([
             confirmTransactionPromise,
             new Promise((resolve) =>
                setTimeout(() => {
                   resolve(null);
                }, 1000)
             ),
          ]);
          if (confirmedTx) {
             break;
          }

          await connection.sendRawTransaction(transaction.serialize(), { maxRetries: 0 });

          console.log(`${new Date().toISOString()} Tx not confirmed after ${1000 * txSendAttempts++}ms, resending`);

          if (txSendAttempts > 60) {
             return null;
          }
       }

      return txSignature;
  } catch (error) {
    console.error(error);
    return txSignature;
  }
} catch (error) {
  console.error(error);
  return txSignature;
}
};

export async function sendSwapTransaction(wallet: WalletContextState, amount: number, token1: string, token2: string) {
  try {
      if (!wallet.publicKey || !wallet.signTransaction) return;
      const instructions: TransactionInstruction[] = [];

      const { instructions: swapIx, addressLookupTableAddresses } = await getSwapIxs(wallet.publicKey, amount, token1, token2);

      const transaction = await createSwapTransaction(addressLookupTableAddresses, wallet.publicKey, swapIx);

      if (!transaction) {
          return null;
      }

      const signedTransaction = await wallet.signTransaction(transaction);

      const signature = await sendTransaction(signedTransaction);

      console.log('signature', signature);
      return signature;
  } catch (error) {
      console.error(error);
      return null;
  }
}