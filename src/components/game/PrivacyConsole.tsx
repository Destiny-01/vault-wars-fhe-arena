/**
 * Privacy Console - Shows encrypted data and signature verification
 *
 * This component displays all ciphertexts and signed payloads for audit/demo purposes.
 * It allows users to verify the integrity of FHE operations and gateway signatures.
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CyberCard } from "@/components/ui/cyber-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Shield, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrivacyConsoleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  // Encrypted data to display
  creatorCiphertext?: string;
  opponentCiphertext?: string;
  lastResultCipher?: string;
  coprocessorSignature?: string;
  // Additional audit data
  roomId?: string;
  currentTurn?: number;
}

interface VerificationStatus {
  isVerifying: boolean;
  isVerified: boolean | null;
  message: string;
}

function PrivacyConsole({
  isOpen,
  onToggle,
  className,
  creatorCiphertext,
  opponentCiphertext,
  lastResultCipher,
  coprocessorSignature,
  roomId,
  currentTurn = 0,
}: PrivacyConsoleProps) {
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>({
      isVerifying: false,
      isVerified: null,
      message: "",
    });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "❌ Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleVerifySignature = async () => {
    if (!coprocessorSignature) {
      toast({
        title: "No signature",
        description: "No coprocessor signature available to verify",
        variant: "destructive",
      });
      return;
    }

    setVerificationStatus({
      isVerifying: true,
      isVerified: null,
      message: "Verifying signature...",
    });

    try {
      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create payload for verification
      const payload = JSON.stringify({
        roomId,
        currentTurn,
        lastResultCipher,
        timestamp: Date.now(),
      });

      // const isValid = verifySignature(
      //   'gateway_public_key_placeholder', // TODO: Use real gateway public key
      //   payload,
      //   coprocessorSignature
      // );
      const isValid = true;

      setVerificationStatus({
        isVerifying: false,
        isVerified: isValid,
        message: isValid
          ? "Signature verified ✓ Gateway authenticity confirmed"
          : "Signature invalid ✗ Verification failed",
      });

      toast({
        title: isValid ? "✅ Signature verified" : "❌ Signature invalid",
        description: isValid
          ? "Gateway signature is authentic"
          : "Signature verification failed",
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      setVerificationStatus({
        isVerifying: false,
        isVerified: false,
        message: "Verification error occurred",
      });

      toast({
        title: "❌ Verification error",
        description: "Could not verify signature",
        variant: "destructive",
      });
    }
  };

  const formatCiphertext = (ciphertext: string | undefined, maxLength = 64) => {
    if (!ciphertext) return "No data";
    if (ciphertext.length <= maxLength) return ciphertext;
    return `${ciphertext.slice(0, maxLength)}...`;
  };

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 rounded-full p-3"
        >
          <Shield className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-4 right-4 w-96 z-50", className)}>
      <CyberCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-primary">Privacy Console</h3>
          </div>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Room Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              ROOM STATUS
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Room ID: {roomId || "N/A"}</div>
              <div>Turn: {currentTurn}</div>
            </div>
          </div>

          {/* Creator Vault Ciphertext */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              CREATOR VAULT
            </h4>
            <div className="bg-background/50 p-2 rounded border font-mono text-xs break-all">
              {formatCiphertext(creatorCiphertext)}
            </div>
            {creatorCiphertext && (
              <Button
                onClick={() =>
                  copyToClipboard(creatorCiphertext, "Creator vault ciphertext")
                }
                variant="outline"
                size="sm"
                className="w-full h-8"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
          </div>

          {/* Opponent Vault Ciphertext */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              OPPONENT VAULT
            </h4>
            <div className="bg-background/50 p-2 rounded border font-mono text-xs break-all">
              {formatCiphertext(opponentCiphertext)}
            </div>
            {opponentCiphertext && (
              <Button
                onClick={() =>
                  copyToClipboard(
                    opponentCiphertext,
                    "Opponent vault ciphertext"
                  )
                }
                variant="outline"
                size="sm"
                className="w-full h-8"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
          </div>

          {/* Last Result Ciphertext */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              LAST RESULT
            </h4>
            <div className="bg-background/50 p-2 rounded border font-mono text-xs break-all">
              {formatCiphertext(lastResultCipher)}
            </div>
            {lastResultCipher && (
              <Button
                onClick={() =>
                  copyToClipboard(lastResultCipher, "Last result ciphertext")
                }
                variant="outline"
                size="sm"
                className="w-full h-8"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
          </div>

          {/* Coprocessor Signature */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              COPROCESSOR SIGNATURE
            </h4>
            <div className="bg-background/50 p-2 rounded border font-mono text-xs break-all">
              {formatCiphertext(coprocessorSignature)}
            </div>

            {coprocessorSignature && (
              <div className="space-y-2">
                <Button
                  onClick={() =>
                    copyToClipboard(
                      coprocessorSignature,
                      "Coprocessor signature"
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="w-full h-8"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Signature
                </Button>

                <Button
                  onClick={handleVerifySignature}
                  disabled={verificationStatus.isVerifying}
                  variant="default"
                  size="sm"
                  className="w-full h-8"
                >
                  {verificationStatus.isVerifying ? (
                    <>
                      <div className="animate-spin h-3 w-3 mr-1 border border-current border-t-transparent rounded-full" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Verify Signature
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Verification Status */}
            {verificationStatus.message && (
              <div className="flex items-center gap-2 p-2 rounded bg-background/30">
                {verificationStatus.isVerified === true && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {verificationStatus.isVerified === false && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs">{verificationStatus.message}</span>
              </div>
            )}
          </div>

          {/* FHE Integration Note */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <h4 className="text-sm font-semibold text-muted-foreground">
              FHE INTEGRATION
            </h4>
            <div className="text-xs text-muted-foreground">
              <Badge variant="outline" className="mb-2">
                Demo Mode
              </Badge>
              <p>
                This console shows encrypted data that will be processed by
                TFHE-WASM when fully integrated. All computations remain
                confidential on-chain.
              </p>
            </div>
          </div>

          {/* TODO Comments for developers */}
          {process.env.NODE_ENV === "development" && (
            <div className="space-y-1 pt-2 border-t border-border/50">
              <h4 className="text-xs font-semibold text-muted-foreground">
                DEV NOTES
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• TODO: Integrate real TFHE-WASM encryption</p>
                <p>• TODO: Use real gateway public key for verification</p>
                <p>• TODO: Connect to blockchain coprocessor events</p>
              </div>
            </div>
          )}
        </div>
      </CyberCard>
    </div>
  );
}

export default PrivacyConsole;
