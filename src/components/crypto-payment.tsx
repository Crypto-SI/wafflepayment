'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { 
  type PaymentPackage, 
  SUPPORTED_TOKENS, 
  getTokensByChain, 
  getTokenBySymbolAndChain,
  ERC20_ABI,
  PAYMENT_WALLET_ADDRESS 
} from '@/lib/crypto-tokens';
import { useTokenBalances } from '@/hooks/use-token-balances';

interface CryptoPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PaymentPackage | null;
  onPaymentSuccess: (transactionHash: string, tokenSymbol: string, amount: string, userAddress: string, chainId: number) => void;
}

export function CryptoPayment({ isOpen, onClose, selectedPackage, onPaymentSuccess }: CryptoPaymentProps) {
  const { address, isConnected, chain } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const { balances, isLoading: balancesLoading } = useTokenBalances();
  
  const [selectedToken, setSelectedToken] = useState<typeof SUPPORTED_TOKENS[0] | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'confirm' | 'processing' | 'success' | 'error'>('select');
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPaymentStep('select');
      setSelectedToken(null);
    }
  }, [isOpen]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash && selectedToken && address) {
      setPaymentStep('success');
      onPaymentSuccess(
        hash,
        selectedToken.symbol,
        selectedPackage?.price.toString() || '0',
        address,
        selectedToken.chainId
      );
    }
  }, [isConfirmed, hash, selectedToken, address, selectedPackage, onPaymentSuccess]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      setPaymentStep('error');
    }
  }, [error]);

  const handleTokenSelect = (token: typeof SUPPORTED_TOKENS[0]) => {
    setSelectedToken(token);
    setPaymentStep('confirm');
  };

  const handlePayment = async () => {
    if (!selectedToken || !selectedPackage || !address) return;

    // Switch to the correct chain if needed
    if (chain?.id !== selectedToken.chainId) {
      try {
        await switchChain({ chainId: selectedToken.chainId });
        return; // Wait for chain switch, user will need to click pay again
      } catch (error) {
        console.error('Failed to switch chain:', error);
        setPaymentStep('error');
        return;
      }
    }

    setPaymentStep('processing');

    try {
      const amount = parseUnits(selectedPackage.price.toString(), selectedToken.decimals);
      
      writeContract({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [PAYMENT_WALLET_ADDRESS, amount],
      });
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStep('error');
    }
  };

  const handleClose = () => {
    if (paymentStep !== 'processing') {
      onClose();
    }
  };

  const availableTokens = chain ? getTokensByChain(chain.id) : SUPPORTED_TOKENS;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pay with Crypto</DialogTitle>
          <DialogDescription>
            {selectedPackage && `Purchase ${selectedPackage.name} (${selectedPackage.credits.toLocaleString()} credits) for $${selectedPackage.price}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isConnected ? (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Wallet className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Connect your wallet to pay with crypto
              </p>
              <ConnectButton />
            </div>
          ) : paymentStep === 'select' ? (
            <div className="space-y-4">
              <div className="text-sm font-medium">Select payment token:</div>
              <div className="grid gap-3">
                {availableTokens.map((token) => {
                  const balanceKey = `${token.symbol}-${token.chainId}`;
                  const balance = balances[balanceKey];
                  const hasBalance = balance && parseFloat(balance.formatted) > 0;
                  const hasEnoughBalance = balance && parseFloat(balance.formatted) >= (selectedPackage?.price || 0);
                  
                  return (
                    <Card 
                      key={`${token.symbol}-${token.chainId}`}
                      className={`cursor-pointer transition-colors ${
                        hasEnoughBalance 
                          ? 'hover:bg-accent border-green-200 hover:border-green-300' 
                          : hasBalance 
                            ? 'hover:bg-accent border-yellow-200 hover:border-yellow-300' 
                            : 'hover:bg-accent'
                      }`}
                      onClick={() => handleTokenSelect(token)}
                    >
                      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{token.icon}</span>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground">{token.name}</div>
                            {balancesLoading ? (
                              <div className="text-xs text-muted-foreground mt-1">
                                Loading balance...
                              </div>
                            ) : balance ? (
                              <div className={`text-xs mt-1 ${
                                hasEnoughBalance 
                                  ? 'text-green-600' 
                                  : hasBalance 
                                    ? 'text-yellow-600' 
                                    : 'text-muted-foreground'
                              }`}>
                                Balance: {parseFloat(balance.formatted).toFixed(2)} {token.symbol}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground mt-1">
                                Balance: 0.00 {token.symbol}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right mt-2 sm:mt-0">
                          <Badge variant="secondary">{token.chainName}</Badge>
                          <div className="text-sm font-medium mt-1">${selectedPackage?.price}</div>
                          {balance && !hasEnoughBalance && hasBalance && (
                            <div className="text-xs text-yellow-600 mt-1">
                              Insufficient balance
                            </div>
                          )}
                          {hasEnoughBalance && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Sufficient balance
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : paymentStep === 'confirm' ? (
            <div className="space-y-4">
              <div className="text-sm font-medium">Confirm payment details:</div>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package:</span>
                    <span className="font-medium">{selectedPackage?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits:</span>
                    <span className="font-medium">{selectedPackage?.credits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">${selectedPackage?.price} {selectedToken?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network:</span>
                    <Badge variant="secondary">{selectedToken?.chainName}</Badge>
                  </div>
                </CardContent>
              </Card>
              
              {chain?.id !== selectedToken?.chainId && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Please switch to {selectedToken?.chainName} network
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setPaymentStep('select')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handlePayment} className="flex-1">
                  Pay ${selectedPackage?.price}
                </Button>
              </div>
            </div>
          ) : paymentStep === 'processing' ? (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center">
                <div className="font-medium">Processing Payment</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {isPending ? 'Confirm transaction in your wallet...' : 
                   isConfirming ? 'Waiting for confirmation...' : 
                   'Preparing transaction...'}
                </div>
              </div>
            </div>
          ) : paymentStep === 'success' ? (
            <div className="flex flex-col items-center space-y-4 py-8">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center">
                <div className="font-medium text-green-700">Payment Successful!</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Your credits will be added shortly
                </div>
              </div>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          ) : paymentStep === 'error' ? (
            <div className="flex flex-col items-center space-y-4 py-8">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <div className="text-center">
                <div className="font-medium text-red-700">Payment Failed</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {error?.message || 'Something went wrong. Please try again.'}
                </div>
              </div>
              <div className="flex space-x-3 w-full">
                <Button variant="outline" onClick={() => setPaymentStep('select')} className="flex-1">
                  Try Again
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
} 