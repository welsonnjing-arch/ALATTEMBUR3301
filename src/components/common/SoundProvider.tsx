"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import {
  initAudioSettings,
  playClickSound,
  isAudioMuted,
  setAudioMuted,
  toggleAudioMuted,
} from "@/lib/audio";

interface SoundContextType {
  muted: boolean;
  toggleMute: () => void;
  play: (variant?: "click" | "soft" | "pop") => void;
}

const SoundContext = createContext<SoundContextType>({
  muted: false,
  toggleMute: () => {},
  play: () => {},
});

export function useSound() {
  return useContext(SoundContext);
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    initAudioSettings();
    setMutedState(isAudioMuted());

    const handleInteraction = (target: HTMLElement | null, isKey = false) => {
      if (!target) return;

      const interactiveEl = target.closest<HTMLElement>(
        'button, a, input, select, textarea, [role="button"], [role="tab"], [role="menuitem"], [role="switch"], [role="checkbox"], [data-clickable]'
      );

      if (!interactiveEl) return;

      if (
        interactiveEl.hasAttribute("disabled") ||
        interactiveEl.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }

      const isSoft =
        interactiveEl.getAttribute("role") === "tab" ||
        interactiveEl.tagName.toLowerCase() === "a";
      const isPop =
        interactiveEl.getAttribute("role") === "switch" ||
        interactiveEl.getAttribute("type") === "checkbox";

      playClickSound(isPop ? "pop" : isSoft ? "soft" : "click");
    };

    const handlePointerDown = (e: PointerEvent) => {
      handleInteraction(e.target as HTMLElement | null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handleInteraction(e.target as HTMLElement | null, true);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, { capture: true, passive: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  const toggleMute = () => {
    const next = toggleAudioMuted();
    setMutedState(next);
  };

  return (
    <SoundContext.Provider
      value={{
        muted,
        toggleMute,
        play: (variant) => playClickSound(variant),
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}
