import { VaultWarsContextValue } from "@/contexts/VaultWarsProvider";
import { useContext } from "react";
import { createContext } from "react";

export const VaultWarsContext = createContext<VaultWarsContextValue | null>(
  null
);

export const useVaultWars = () => {
  const context = useContext(VaultWarsContext);
  if (!context)
    throw new Error("useVaultWars must be used within VaultWarsProvider");
  return context;
};
