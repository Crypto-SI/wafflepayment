'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Sparkles, Trophy, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsAdded: number;
  newBalance: number;
  transactionHash: string;
  tokenSymbol: string;
  userEmail?: string;
}

export function CongratulationsModal({
  isOpen,
  onClose,
  creditsAdded,
  newBalance,
  transactionHash,
  tokenSymbol,
  userEmail
}: CongratulationsModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  // Trigger confetti animation when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Multiple bursts for celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Left side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        
        // Right side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Cleanup
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const getProfilePicture = () => {
    if (userEmail) {
      // Create a simple avatar based on email
      const firstLetter = userEmail.charAt(0).toUpperCase();
      return (
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {firstLetter}
        </div>
      );
    }
    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white shadow-lg">
        <Trophy className="w-10 h-10" />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
            <CheckCircle className="w-8 h-8" />
            Congratulations! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Picture with Sparkles */}
          <div className="flex justify-center relative">
            <div className="relative">
              {getProfilePicture()}
              {showAnimation && (
                <>
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
                  <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-pink-400 animate-pulse delay-300" />
                  <Sparkles className="absolute top-0 -left-4 w-5 h-5 text-blue-400 animate-pulse delay-700" />
                </>
              )}
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">
              Payment Successful! 🧇
            </h3>
            <p className="text-gray-600">
              Your crypto payment has been processed and credits have been added to your account.
            </p>
          </div>

          {/* Credit Information */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-700">Credits Added:</span>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1 bg-green-100 text-green-800 w-fit">
                  +{creditsAdded.toLocaleString()}
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <span className="font-medium text-gray-700">New Balance:</span>
                <div className="text-2xl font-bold text-green-600">
                  {newBalance.toLocaleString()} credits
                </div>
              </div>

              <div className="pt-2 border-t border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-sm text-gray-600">
                  <span>Payment Method:</span>
                  <span className="font-medium">{tokenSymbol} {tokenSymbol === 'Stripe' ? '(Card)' : '(Crypto)'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-sm text-gray-600 mt-1">
                  <span>Transaction:</span>
                  <span className="font-mono text-xs break-all sm:break-normal">
                    {transactionHash.length > 20 
                      ? `${transactionHash.slice(0, 8)}...${transactionHash.slice(-6)}`
                      : transactionHash}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fun Message */}
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 font-medium">
              🎊 Ready to stack some more waffles? Your credits are ready to use! 🎊
            </p>
          </div>

          {/* Close Button */}
          <Button 
            onClick={onClose} 
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3"
          >
            Continue to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}