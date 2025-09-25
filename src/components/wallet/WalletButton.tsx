import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { useVaultWarsContract } from '@/hooks/useVaultWarsContract';
import { ChevronDown, ExternalLink, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant="outline"
                    className="cyber-border bg-background hover:bg-primary/10"
                  >
                    Connect Wallet
                  </Button>
                );
              }

              return <ConnectedWalletDisplay account={account} />;
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

function ConnectedWalletDisplay({ account }: { account: any }) {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { playerWins } = useVaultWarsContract();

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatBalance = (bal: any) => 
    bal ? `${parseFloat(bal.formatted).toFixed(3)} ${bal.symbol}` : '0.000 ETH';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="cyber-border bg-background hover:bg-primary/10 flex items-center gap-2"
        >
          <div className="flex flex-col items-start text-left">
            <div className="text-sm font-mono">
              {formatAddress(account.address)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatBalance(balance)} • Wins: {playerWins}
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-background border-primary/20"
      >
        <DropdownMenuItem
          onClick={() => window.open(`https://etherscan.io/address/${account.address}`, '_blank')}
          className="cursor-pointer hover:bg-primary/10"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Etherscan
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={account.disconnect}
          className="cursor-pointer hover:bg-destructive/10 text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}