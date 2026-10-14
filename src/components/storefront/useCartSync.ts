"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useCartStore } from "@/stores/cart";
import { getCartSnapshot } from "@/app/(storefront)/actions";

/** Refresh bag prices/stock from the server whenever `active` becomes true. */
export function useCartSync(active: boolean) {
  const syncWithServer = useCartStore((s) => s.syncWithServer);
  const [syncing, setSyncing] = useState(false);
  const running = useRef(false);

  useEffect(() => {
    if (!active || running.current) return;
    const ids = useCartStore.getState().items.map((i) => i.variantId);
    if (!ids.length) return;
    running.current = true;
    const run = async () => {
      setSyncing(true);
      try {
        const lines = await getCartSnapshot(ids);
        syncWithServer(lines).forEach((msg) => toast(msg, { icon: "ℹ️", duration: 5000 }));
      } catch {
        // Offline or server error — keep the bag as is; checkout re-validates anyway.
      } finally {
        running.current = false;
        setSyncing(false);
      }
    };
    void run();
  }, [active, syncWithServer]);

  return syncing;
}
