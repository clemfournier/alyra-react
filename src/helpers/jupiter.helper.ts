export async function getQuote(
    amount: number,
    inputMint: string,
    outputMint: string,
    slippage: string = '0.5',
    swapMode: string = 'ExactIn',
) : Promise<QuoteResponse | null> {
    try {
        let slippageBps = parseFloat(slippage) * 100;
    
        let quoteParams = {
            inputMint: inputMint,
            outputMint: outputMint,
            amount: amount.toString(),
            slippageBps: slippageBps.toString(),
            swapMode: swapMode,
        };
    
        const queryString = new URLSearchParams(quoteParams).toString();
        const url = `https://quote-api.jup.ag/v6/quote?${queryString}`;
        const quoteResponse: any = await fetch(url);

        if (!quoteResponse.ok) {
            return null;
        }
    
        return quoteResponse.json();
    } catch (error) {
        console.error('error', error);
        return null;
    }
}