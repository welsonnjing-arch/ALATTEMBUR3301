// Web Audio API tactile feedback synthesizer inspired by recent.design & iOS haptic clicks
// Zero external asset dependencies, zero network latency, 100% resilient.

let audioCtx: AudioContext | null = null;
let isMuted = false;

export function warmUpAudioContext(): void {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
  } catch {}
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    warmUpAudioContext();
  } else if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isAudioMuted(): boolean {
  if (typeof window === "undefined") return false;
  return isMuted;
}

export function setAudioMuted(muted: boolean): void {
  isMuted = muted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fynux_sound_muted", muted ? "true" : "false");
    } catch {}
  }
}

export function toggleAudioMuted(): boolean {
  const next = !isMuted;
  setAudioMuted(next);
  if (!next) {
    // Play a gentle confirmation tap when unmuted
    setTimeout(() => playClickSound("soft"), 50);
  }
  return next;
}

export function initAudioSettings(): void {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem("fynux_sound_muted");
    if (saved !== null) {
      isMuted = saved === "true";
    }
  } catch {}
}

/**
 * Synthesizes a crisp, subtle mechanical/taptic click sound
 * inspired by recent.design and iOS tactile micro-interactions.
 */
export function playClickSound(variant: "click" | "soft" | "pop" = "click"): void {
  if (typeof window === "undefined" || isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Highpass filter to eliminate sub-bass DC rumble and keep click tactile & tight
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(180, now);
    filter.connect(ctx.destination);

    if (variant === "click") {
      // Crisp mechanical/taptic click: rapid frequency glide (1450Hz -> 260Hz in 18ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.018);

      // Smooth attack and decay curve (audible at 20-30% volume, zero distortion)
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.0018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + 0.028);

      // Micro transient burst (subtle high-frequency snap)
      const oscSnap = ctx.createOscillator();
      const gainSnap = ctx.createGain();

      oscSnap.type = "triangle";
      oscSnap.frequency.setValueAtTime(3200, now);
      oscSnap.frequency.exponentialRampToValueAtTime(1100, now + 0.009);

      gainSnap.gain.setValueAtTime(0.0001, now);
      gainSnap.gain.linearRampToValueAtTime(0.18, now + 0.0012);
      gainSnap.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

      oscSnap.connect(gainSnap);
      gainSnap.connect(filter);

      oscSnap.start(now);
      oscSnap.stop(now + 0.016);
    } else if (variant === "pop") {
      // Subtle toggle / modal pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.028);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.30, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + 0.035);
    } else {
      // Soft tab / navigation switch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(840, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.02);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.0018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + 0.027);
    }
  } catch {
    // Audio synthesis failure should never interrupt user experience
  }
}
