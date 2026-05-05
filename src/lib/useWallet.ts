"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getWalletPublicKey,
  getWalletState,
  isWalletAvailable,
  type WalletState,
} from "@/lib/harbor";

export interface UseWalletResult extends WalletState {
  connect: () => Promise<string | null>;
  disconnect: () => void;
  refresh: () => Promise<void>;
}

/** Shared wallet state for any component that needs the connected account. */
export function useWallet(): UseWalletResult {
  const [state, setState] = useState<WalletState>({
    available: false,
    publicKey: null,
  });

  const refresh = useCallback(async () => {
    setState(await getWalletState());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!isWalletAvailable()) return null;
    const publicKey = await getWalletPublicKey(true);
    setState({ available: true, publicKey });
    return publicKey;
  }, []);

  const disconnect = useCallback(() => {
    setState({ available: isWalletAvailable(), publicKey: null });
  }, []);

  return { ...state, connect, disconnect, refresh };
}

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}