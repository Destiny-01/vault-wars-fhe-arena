import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Vault Wars",
  projectId: "vault-wars-demo-project", // Replace with your WalletConnect project ID
  chains: [sepolia],
  ssr: false,
});
