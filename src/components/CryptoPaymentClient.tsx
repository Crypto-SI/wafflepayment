'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useChainId, useSwitchChain, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  SUPPORTED_TOKENS, 
  CREDIT_PACKAGES, 
  PAYMENT_WALLET_ADDRESS, 
  ERC20_ABI,
  getTokensByChain,
  formatTokenAmount,
  parseTokenAmount,
  type TokenConfig,
  type PaymentPackage 
} from '@/lib/crypto-tokens';

interface CryptoPaymentClientProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PaymentPackage | null;
  onPaymentSuccess: (transactionHash: string, tokenSymbol: string, amount: string) => void;
}

export default function CryptoPaymentClient({ isOpen, onClose, selectedPackage, onPaymentSuccess }: CryptoPaymentClientProps) {
  const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'confirm' | 'processing' | 'success' | 'error'>('select');
  const [transactionHash, setTransactionHash] = useState<string>('');

  const { address: userAddress, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: writeData, isPending: isWritePending, error: writeError } = useWriteContract();
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: selectedToken?.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!selectedToken && !!userAddress,
    },
  });
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: writeData,
    query: {
      enabled: !!writeData,
    },
  });

  // Get available tokens for current chain
  const availableTokens = useMemo(() => {
    return getTokensByChain(currentChainId);
  }, [currentChainId]);

  // Calculate payment amount in token units
  const paymentAmount = useMemo(() => {
    if (!selectedPackage || !selectedToken) return BigInt(0);
    return parseTokenAmount(selectedPackage.price.toString(), selectedToken.decimals);
  }, [selectedPackage, selectedToken]);

  // Format user balance for display
  const formattedBalance = useMemo(() => {
    if (!tokenBalance || !selectedToken) return '0';
    return formatTokenAmount(tokenBalance as bigint, selectedToken.decimals);
  }, [tokenBalance, selectedToken]);

  // Check if user has sufficient balance
  const hasSufficientBalance = useMemo(() => {
    if (!tokenBalance || !selectedToken) return false;
    return (tokenBalance as bigint) >= paymentAmount;
  }, [tokenBalance, selectedToken, paymentAmount]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPaymentStep('select');
      setSelectedToken(null);
      setTransactionHash('');
    }
  }, [isOpen]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && writeData) {
      setPaymentStep('success');
      setTransactionHash(writeData);
      if (selectedToken && selectedPackage) {
        onPaymentSuccess(writeData, selectedToken.symbol, selectedPackage.price.toString());
      }
      toast({
        title: "Payment Successful!",
        description: `Your ${selectedPackage?.name} purchase has been completed.`,
      });
    }
  }, [isConfirmed, writeData, selectedToken, selectedPackage, onPaymentSuccess]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setPaymentStep('error');
      toast({
        title: "Payment Failed",
        description: writeError.message,
        variant: "destructive",
      });
    }
  }, [writeError]);

  const handleTokenSelect = (tokenAddress: string) => {
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      setSelectedToken(token);
      setPaymentStep('confirm');
    }
  };

  const handleSwitchChain = async (chainId: number) => {
    try {
      await switchChain({ chainId });
    } catch (error) {
      toast({
        title: "Chain Switch Failed",
        description: "Please switch to the correct network in your wallet.",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedToken || !selectedPackage || !userAddress) return;

    setPaymentStep('processing');
    setIsProcessing(true);

    try {
      // Execute the token transfer
      writeContract({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [PAYMENT_WALLET_ADDRESS, paymentAmount],
        chainId: selectedToken.chainId,
      });
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStep('error');
      toast({
        title: "Payment Failed",
        description: "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPaymentStep('select');
    setSelectedToken(null);
    setTransactionHash('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pay with Crypto</DialogTitle>
          <DialogDescription>
            {selectedPackage && (
              <>Pay ${selectedPackage.price} for {selectedPackage.credits.toLocaleString()} credits</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token Selection */}
          {paymentStep === 'select' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Token & Network</label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose your preferred token and network for payment
                </p>
              </div>

              {availableTokens.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No supported tokens available on this network. Please switch to a supported network.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-3">
                  {availableTokens.map((token) => (
                    <Card 
                      key={`${token.address}-${token.chainId}`}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleTokenSelect(token.address)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{token.icon}</span>
                            <div>
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-sm text-muted-foreground">{token.chainName}</div>
                            </div>
                          </div>
                          <Badge variant="secondary">${selectedPackage?.price}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment Confirmation */}
          {paymentStep === 'confirm' && selectedToken && selectedPackage && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{selectedToken.icon}</span>
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token:</span>
                    <span>{selectedToken.symbol} on {selectedToken.chainName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>{selectedPackage.price} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits:</span>
                    <span>{selectedPackage.credits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Balance:</span>
                    <span className={hasSufficientBalance ? 'text-green-600' : 'text-red-600'}>
                      {formattedBalance} {selectedToken.symbol}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {!hasSufficientBalance && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient balance. You need {selectedPackage.price} {selectedToken.symbol} to complete this purchase.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPaymentStep('select')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handlePayment}
                  disabled={!hasSufficientBalance || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${selectedPackage.price} ${selectedToken.symbol}`
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {paymentStep === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
              <p className="text-muted-foreground">
                {isConfirming ? 'Confirming transaction...' : 'Please confirm the transaction in your wallet'}
              </p>
            </div>
          )}

          {/* Success State */}
          {paymentStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground mb-4">
                Your {selectedPackage?.credits.toLocaleString()} credits have been added to your account.
              </p>
              {transactionHash && (
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1"
                  >
                    View Transaction <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Error State */}
          {paymentStep === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Payment Failed</h3>
              <p className="text-muted-foreground mb-4">
                There was an error processing your payment. Please try again.
              </p>
              <Button onClick={() => setPaymentStep('select')}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 