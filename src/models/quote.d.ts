interface SwapInfo {
    ammKey: string;
    feeAmount: string;
    feeMint: string;
    inAmount: string;
    inputMint: string;
    label: string;
    outAmount: string;
    outputMint: string;
  }
  
  interface RoutePlan {
    percent: number;
    swapInfo: SwapInfo;
  }
  
  interface QuoteResponse {
    contextSlot: number;
    inAmount: string;
    inputMint: string;
    otherAmountThreshold: string;
    outAmount: string;
    outputMint: string;
    platformFee: null | string;
    priceImpactPct: string;
    routePlan: RoutePlan[];
    slippageBps: number;
    swapMode: string;
    timeTaken: number;
  }