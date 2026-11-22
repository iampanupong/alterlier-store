"use client";

import { useState } from "react";
import { HeartIcon } from "@/components/ui/icons";

// Front-end only: there is no wishlist backend yet, so this just toggles local UI state.
export function SaveButton({ productName, className }: { productName: string; className?: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      className={className}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from saved items` : `Save ${productName}`}
      onClick={() => setSaved((v) => !v)}
    >
      <HeartIcon fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
