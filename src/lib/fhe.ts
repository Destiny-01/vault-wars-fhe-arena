/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createInstance,
  FhevmInstance,
  HandleContractPair,
  SepoliaConfig,
} from "@zama-fhe/relayer-sdk/bundle";
import { Wallet } from "ethers";
import { initSDK } from "@zama-fhe/relayer-sdk/bundle";

let relayer: FhevmInstance | null = null;
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS!;

export async function initializeFHE() {
  try {
    if (!relayer) {
      console.log("Checking available global objects...");

      console.log("Calling initSDK()...");
      await initSDK();
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
  if (!relayer) throw new Error("Relayer not initialized");

  console.log("syat");
  const inputHandle = relayer.createEncryptedInput(contractAddress, address);
  for (const d of plainDigits) {
    inputHandle.add8(d); // add8 is an SDK helper in examples
  }
  // seal & encrypt
  const ciphertextBlob = await inputHandle.encrypt();
  console.log(ciphertextBlob, ciphertextBlob.handles[0]);
  return ciphertextBlob;
}

/**
 * Request user decryption via relayer:
 * - if result was returned re-encrypted for user, relayer will deliver ciphertext and user decrypts locally
 * - depending on SDK, relayer may return plaintext directly after EIP-712 auth
 */
export async function requestUserDecryption(
  signer: Wallet,
  ciphertextHandle: string
) {
  if (!relayer) throw new Error("Relayer not initialized");

  const keypair = relayer.generateKeypair();
  const handleContractPairs: HandleContractPair[] = [
    {
      handle: ciphertextHandle,
      contractAddress: contractAddress,
    },
  ];
  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = "10"; // String for consistency
  const contractAddresses = [contractAddress];

  const eip712 = relayer.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimeStamp,
    durationDays
  );

  const signature = await signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification:
        eip712.types.UserDecryptRequestVerification,
    },
    eip712.message
  );

  const result = await relayer.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    contractAddresses,
    signer.address,
    startTimeStamp,
    durationDays
  );

  const decryptedValue = result[ciphertextHandle];

  return decryptedValue;
}

/**
 * Fetch a public decryption (if outputs are public)
 */
export async function fetchPublicDecryption(handles: string[]): Promise<any> {
  if (!relayer) throw new Error("Relayer not initialized");
  return relayer.publicDecrypt(handles);
}
