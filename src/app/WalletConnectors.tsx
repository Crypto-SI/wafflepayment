'use client';

import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";
import { EvmIcon } from "@/components/icons";

interface WalletConnectorsProps {
  onClose: () => void;
}

export default function WalletConnectors({ onClose }: WalletConnectorsProps) {
  const { isConnected: isEvmConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const handleEvmConnect = () => {
    if (openConnectModal) {
      openConnectModal();
      onClose();
    }
  };

  return (
    <div className="flex justify-center">
      <Button
        variant="outline"
        className="h-28 flex-col gap-2 text-lg hover:bg-secondary min-w-[200px]"
        onClick={handleEvmConnect}
      >
        <EvmIcon className="h-10 w-10 text-primary" />
        Connect EVM Wallet
      </Button>
    </div>
  );
} 