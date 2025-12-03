/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createInstance,
  FhevmInstance,
  PublicDecryptResults,
  UserDecryptResults,
  SepoliaConfig,
  initSDK,
} from "@zama-fhe/relayer-sdk/bundle";
import { Signer, Wallet } from "ethers";

let relayer: FhevmInstance | null = null;
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS!;

export async function initializeFHE() {
  try {
    if (!relayer) {
      console.log("Checking available global objects...");

      console.log("Calling initSDK()...");
      try {
        await initSDK();
      } catch (cdnError) {
        // If CDN fails (usually CORS), fallback to local WASM files
        console.warn(
          "⚠️ CDN initialization failed, falling back to local WASM files:",
          cdnError
        );
        console.log("🔄 Trying local WASM files from public folder...");
        await initSDK({
          tfheParams: "/tfhe_bg.wasm",
          kmsParams: "/kms_lib_bg.wasm",
        });
        console.log("✅ FHEVM SDK initialized with local WASM files");
      }
      console.log("initSDK() completed");

      relayer = await createInstance(SepoliaConfig);

      console.log("FHEVM relayer SDK instance initialized successfully");
    }
    return relayer;
  } catch (error) {
    console.error("Failed to initialize FHEVM relayer SDK:", error);
    console.error("Error details:", error);
    throw new Error("Failed to initialize FHE encryption");
  }
}

export async function getFhevmInstance() {
  if (!relayer) {
    await initializeFHE();
  }
  return relayer;
}

/**
 * Encrypt a 4-digit vault code
 * - plainDigits: [0..9] length 4
 * - returns ciphertext string (store onchain in your contract)
 */
export async function encryptValue(address: string, plainDigits: number[]) {
  const instance = await getFhevmInstance();

  console.log("syat");
  const inputHandle = instance.createEncryptedInput(contractAddress, address);
  for (const d of plainDigits) {
    inputHandle.add8(d); // add8 is an SDK helper in examples
  }
  // seal & encrypt
  const ciphertextBlob = await inputHandle.encrypt();
  console.log(ciphertextBlob, ciphertextBlob.handles[0]);
  return ciphertextBlob;
}

/**
 * Fetch a public decryption (if outputs are public)
 */
export async function fetchPublicDecryption(
  handles: (string | Uint8Array)[]
): Promise<PublicDecryptResults> {
  const instance = await getFhevmInstance();
  return instance.publicDecrypt(handles);
}
