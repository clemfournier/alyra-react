import { BN, Idl, Program } from "@coral-xyz/anchor";
import { AnchorWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl } from "@solana/web3.js";
import { sign } from 'tweetnacl';
import { IDL, PROGRAM_ID } from "../idl/idl";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
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