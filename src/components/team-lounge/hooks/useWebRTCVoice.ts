"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VoiceParticipant, SignalingMessage } from "@/modules/team-lounge/types";

interface UseWebRTCVoiceProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  currentUserAvatar?: string;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function useWebRTCVoice({
  currentUserId,
  currentUserName,
  currentUserRole,
  currentUserAvatar,
}: UseWebRTCVoiceProps) {
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [allParticipants, setAllParticipants] = useState<VoiceParticipant[]>([]);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // References for WebRTC connections and audio
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // References for Web Audio API Voice Activity Detection (VAD)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeakingStateRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync Interval Reference
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper untuk mengirim sinyal WebRTC ke backend
  const sendSignal = useCallback(
    async (toUserId: string | undefined, channelId: string, type: SignalingMessage["type"], payload: any) => {
      try {
        await fetch("/api/team-lounge/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toUserId,
            channelId,
            type,
            payload,
          }),
        });
      } catch (err) {
        console.warn("[WEBRTC_SIGNAL_ERROR] Gagal mengirim sinyal:", err);
      }
    },
    []
  );

  // Helper untuk membuat RTCPeerConnection baru untuk peer tertentu
  const createPeerConnection = useCallback(
    (targetUserId: string, channelId: string) => {
      if (peerConnectionsRef.current.has(targetUserId)) {
        return peerConnectionsRef.current.get(targetUserId)!;
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);

      // Tambahkan trek audio lokal ke koneksi
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Kirim kandidat ICE saat ditemukan
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(targetUserId, channelId, "candidate", {
            candidate: event.candidate,
          });
        }
      };

      // Terima remote track audio dari peer
      pc.ontrack = (event) => {
        let audioEl = remoteAudiosRef.current.get(targetUserId);
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          audioEl.style.display = "none";
          document.body.appendChild(audioEl);
          remoteAudiosRef.current.set(targetUserId, audioEl);
        }
        audioEl.srcObject = event.streams[0];
        audioEl.muted = isDeafened;
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          pc.close();
          peerConnectionsRef.current.delete(targetUserId);
        }
      };

      peerConnectionsRef.current.set(targetUserId, pc);
      return pc;
    },
    [isDeafened, sendSignal]
  );

  // Setup Voice Activity Detection (VAD) menggunakan Web Audio API
  const setupVAD = useCallback((stream: MediaStream, channelId: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);

      vadIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);

        // Hitung rata-rata amplitudo volume suara
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length;
        const SPEAKING_THRESHOLD = 18;

        if (average > SPEAKING_THRESHOLD) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          if (!lastSpeakingStateRef.current) {
            lastSpeakingStateRef.current = true;
            setIsLocalSpeaking(true);
            setSpeakingUsers((prev) => new Set(prev).add(currentUserId));

            // Kirim notifikasi state change ke peers
            fetch("/api/team-lounge/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "state_change",
                channelId,
                state: { isSpeaking: true },
              }),
            }).catch(() => {});
          }
        } else {
          // Tambahkan delay 350ms agar tidak berkedip-kedip saat jeda kata
          if (lastSpeakingStateRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              lastSpeakingStateRef.current = false;
              setIsLocalSpeaking(false);
              setSpeakingUsers((prev) => {
                const next = new Set(prev);
                next.delete(currentUserId);
                return next;
              });

              fetch("/api/team-lounge/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "state_change",
                  channelId,
                  state: { isSpeaking: false },
                }),
              }).catch(() => {});
              silenceTimerRef.current = null;
            }, 350);
          }
        }
      }, 100);
    } catch (err) {
      console.warn("[VAD_INIT] Web Audio API VAD tidak dapat dimulai:", err);
    }
  }, [currentUserId]);

  // Hentikan VAD & audio stream lokal
  const cleanupMedia = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    // Tutup seluruh peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Hapus elemen audio remote
    remoteAudiosRef.current.forEach((el) => el.remove());
    remoteAudiosRef.current.clear();

    lastSpeakingStateRef.current = false;
    setIsLocalSpeaking(false);
    setSpeakingUsers(new Set());
  }, []);

  // Bergabung ke Voice Channel
  const joinVoiceChannel = useCallback(
    async (channelId: string) => {
      try {
        setError(null);
        setIsConnecting(true);

        // Ambil izin mikrofon pengguna
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        // Terapkan mute awal jika sedang dalam kondisi mute
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });

        localStreamRef.current = stream;
        setupVAD(stream, channelId);

        // Beritahu server bahwa kita bergabung
        const res = await fetch("/api/team-lounge/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "join_voice",
            channelId,
            state: { isMuted, isDeafened },
          }),
        });

        if (!res.ok) {
          throw new Error("Gagal bergabung ke saluran suara.");
        }

        setActiveVoiceChannelId(channelId);
      } catch (err: unknown) {
        console.error("[VOICE_JOIN_ERROR]", err);
        setError(
          (err as Error)?.message ||
            "Gagal mengakses mikrofon. Pastikan Anda mengizinkan akses audio di browser."
        );
        cleanupMedia();
      } finally {
        setIsConnecting(false);
      }
    },
    [cleanupMedia, isDeafened, isMuted, setupVAD]
  );

  // Keluar dari Voice Channel
  const leaveVoiceChannel = useCallback(async () => {
    try {
      await fetch("/api/team-lounge/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leave_voice",
        }),
      });
    } catch {}

    cleanupMedia();
    setActiveVoiceChannelId(null);
  }, [cleanupMedia]);

  // Toggle Mute Mikrofon
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !next;
        });
      }

      if (activeVoiceChannelId) {
        fetch("/api/team-lounge/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "state_change",
            channelId: activeVoiceChannelId,
            state: { isMuted: next },
          }),
        }).catch(() => {});
      }

      return next;
    });
  }, [activeVoiceChannelId]);

  // Toggle Deafen (Matikan suara semua output)
  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => {
      const next = !prev;

      // Matikan audio elemen remote
      remoteAudiosRef.current.forEach((el) => {
        el.muted = next;
      });

      // Jika deafened, otomatis mute mikrofon juga (seperti Discord)
      if (next && !isMuted) {
        toggleMute();
      }

      if (activeVoiceChannelId) {
        fetch("/api/team-lounge/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "state_change",
            channelId: activeVoiceChannelId,
            state: { isDeafened: next },
          }),
        }).catch(() => {});
      }

      return next;
    });
  }, [activeVoiceChannelId, isMuted, toggleMute]);

  // Loop Sinkronisasi (Heartbeat & Pemrosesan Sinyal WebRTC)
  useEffect(() => {
    let isCancelled = false;

    const performSync = async () => {
      try {
        const res = await fetch("/api/team-lounge/sync");
        if (!res.ok) return;

        const data = await res.json();
        if (isCancelled || !data.success) return;

        // Perbarui daftar partisipan di semua channel
        if (data.voiceParticipants) {
          setAllParticipants(data.voiceParticipants);

          // Update speaking status dari partisipan
          const speakingSet = new Set<string>();
          data.voiceParticipants.forEach((p: VoiceParticipant) => {
            if (p.isSpeaking) speakingSet.add(p.userId);
          });
          if (lastSpeakingStateRef.current) {
            speakingSet.add(currentUserId);
          }
          setSpeakingUsers(speakingSet);
        }

        // Proses sinyal WebRTC jika kita sedang berada di dalam channel suara
        if (activeVoiceChannelId && data.signals && data.signals.length > 0) {
          for (const signal of data.signals as SignalingMessage[]) {
            const peerId = signal.fromUserId;
            if (peerId === currentUserId) continue;

            if (signal.type === "join") {
              // Peer baru bergabung -> Kita buat offer dan kirim ke peer baru tersebut
              const pc = createPeerConnection(peerId, activeVoiceChannelId);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendSignal(peerId, activeVoiceChannelId, "offer", { offer });
            } else if (signal.type === "offer") {
              // Terima offer dari peer -> Set remote, buat answer, dan kirim balik
              const pc = createPeerConnection(peerId, activeVoiceChannelId);
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendSignal(peerId, activeVoiceChannelId, "answer", { answer });
            } else if (signal.type === "answer") {
              // Terima answer dari peer
              const pc = peerConnectionsRef.current.get(peerId);
              if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.answer));
              }
            } else if (signal.type === "candidate") {
              // Terima kandidat ICE
              const pc = peerConnectionsRef.current.get(peerId);
              if (pc && signal.payload.candidate) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(signal.payload.candidate));
                } catch (e) {
                  console.warn("[WEBRTC_ICE_FAIL]", e);
                }
              }
            } else if (signal.type === "leave") {
              // Peer keluar dari room
              const pc = peerConnectionsRef.current.get(peerId);
              if (pc) {
                pc.close();
                peerConnectionsRef.current.delete(peerId);
              }
              const audioEl = remoteAudiosRef.current.get(peerId);
              if (audioEl) {
                audioEl.remove();
                remoteAudiosRef.current.delete(peerId);
              }
              setSpeakingUsers((prev) => {
                const next = new Set(prev);
                next.delete(peerId);
                return next;
              });
            } else if (signal.type === "state_change") {
              // Update state (speaking / muted)
              if (signal.payload.isSpeaking !== undefined) {
                setSpeakingUsers((prev) => {
                  const next = new Set(prev);
                  if (signal.payload.isSpeaking) {
                    next.add(peerId);
                  } else {
                    next.delete(peerId);
                  }
                  return next;
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn("[SYNC_LOOP_WARN]", err);
      }
    };

    // Jalankan segera dan ulangi setiap 1500ms
    performSync();
    syncIntervalRef.current = setInterval(performSync, 1500);

    return () => {
      isCancelled = true;
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [activeVoiceChannelId, createPeerConnection, currentUserId, sendSignal]);

  // Bersihkan media saat komponen unmount
  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  return {
    activeVoiceChannelId,
    isConnecting,
    isMuted,
    isDeafened,
    isLocalSpeaking,
    allParticipants,
    speakingUsers,
    error,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
  };
}
