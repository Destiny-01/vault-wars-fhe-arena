import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoomCreatedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export function RoomCreatedModal({ open, onOpenChange, roomId }: RoomCreatedModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const invitationLink = `${window.location.origin}/join?room=${roomId}`;

  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Invitation link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md cyber-border bg-background">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-primary">
            Room Created!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share this room with your opponent to start the game.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <label className="text-sm font-medium text-muted-foreground">
              Room ID
            </label>
            <div className="text-2xl font-mono font-bold text-primary mt-1">
              {roomId}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Invitation Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={invitationLink}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-primary/20 rounded-md font-mono"
              />
              <Button
                onClick={copyInvitationLink}
                size="sm"
                variant="outline"
                className="cyber-border"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={copyInvitationLink}
            className="w-full cyber-border bg-primary hover:bg-primary/90"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Invitation Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}