"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearOverrides,
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
    const ws = await getWalletState();
    if (!ws.publicKey && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("harbor.wallet.publickey");
        if (cached) {
          setState({ available: ws.available, publicKey: cached });
          return;
        }
      } catch {}
    }
    setState(ws);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!isWalletAvailable()) return null;
    const publicKey = await getWalletPublicKey(true);
    if (publicKey && typeof window !== "undefined") {
      try {
        localStorage.setItem("harbor.wallet.publickey", publicKey);
      } catch {}
    }
    setState({ available: true, publicKey });
    return publicKey;
  }, []);

  const disconnect = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("harbor.wallet.publickey");
        sessionStorage.removeItem("harbor.wallet.session");
      } catch {}
    }
    clearOverrides();
    setState({ available: isWalletAvailable(), publicKey: null });
  }, []);

  return { ...state, connect, disconnect, refresh };
}

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}