import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletModal({ open, onOpenChange }: ConnectWalletModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md cyber-border bg-background">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-primary">
            Connect Wallet to Continue
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You need to connect your wallet to create or join a room.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button
                onClick={() => {
                  openConnectModal?.();
                  onOpenChange(false);
                }}
                className="w-full cyber-border bg-primary hover:bg-primary/90"
              >
                Connect Wallet
              </Button>
            )}
          </ConnectButton.Custom>
        </div>
      </DialogContent>
    </Dialog>
  );
}