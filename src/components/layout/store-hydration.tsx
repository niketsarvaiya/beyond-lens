"use client";

import { useEffect } from "react";
import { useLensStore } from "@/store/lens-store";

export function StoreHydration() {
  useEffect(() => {
    useLensStore.persist.rehydrate();
  }, []);
  return null;
}
