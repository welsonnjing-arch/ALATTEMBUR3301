"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VoiceParticipant, SignalingMessage } from "@/modules/team-lounge/types";

interface UseWebRTCVoiceProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  currentUserAvatar?: string;
}

// STUN + Free OpenRelay TURN configuration for seamless P2P & NAT traversal (Telkomsel/Indosat/Office NAT)
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    // OpenRelay Project by Metered (Free public TURN servers for WebRTC audio/video)
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
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

  // References for WebRTC connections, audio, and queued ICE candidates
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // References for Web Audio API Voice Activity Detection (VAD)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeakingStateRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMutedRef = useRef(isMuted);
  const isDeafenedRef = useRef(isDeafened);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isDeafenedRef.current = isDeafened;
    // Update mute status pada seluruh elemen audio remote
    remoteAudiosRef.current.forEach((audioEl) => {
      audioEl.muted = isDeafened;
    });
  }, [isDeafened]);

  // Sync Interval Reference
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeVoiceChannelRef = useRef<string | null>(activeVoiceChannelId);
  useEffect(() => {
    activeVoiceChannelRef.current = activeVoiceChannelId;
  }, [activeVoiceChannelId]);

  // Helper untuk mengirim sinyal WebRTC ke backend
  const sendSignal = useCallback(
    async (
      toUserId: string | undefined,
      channelId: string,
      type: SignalingMessage["type"],
      payload: any
    ) => {
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

  // Drain dan tambahkan kandidat ICE yang sebelumnya tertunda
  const drainPendingCandidates = useCallback(
    async (peerId: string, pc: RTCPeerConnection) => {
      const queued = pendingCandidatesRef.current.get(peerId) || [];
      if (queued.length > 0) {
        for (const cand of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (err) {
            console.warn("[ICE_DRAIN_FAIL] Gagal menambahkan ICE tertunda:", err);
          }
        }
        pendingCandidatesRef.current.delete(peerId);
      }
    },
    []
  );

  // Tambahkan kandidat langsung jika remoteDescription sudah siap, atau simpan ke antrean
  const addOrQueueCandidate = useCallback(
    async (peerId: string, candidate: RTCIceCandidateInit) => {
      const pc = peerConnectionsRef.current.get(peerId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("[ICE_ADD_FAIL] Gagal menambahkan ICE candidate:", err);
        }
      } else {
        const queued = pendingCandidatesRef.current.get(peerId) || [];
        queued.push(candidate);
        pendingCandidatesRef.current.set(peerId, queued);
      }
    },
    []
  );

  // Helper membuat atau memperbarui RTCPeerConnection untuk peer tertentu
  const createPeerConnection = useCallback(
    (targetUserId: string, channelId: string) => {
      // Jika sudah ada koneksi yang masih aktif dan valid, gunakan kembali
      const existingPc = peerConnectionsRef.current.get(targetUserId);
      if (
        existingPc &&
        existingPc.connectionState !== "closed" &&
        existingPc.connectionState !== "failed"
      ) {
        return existingPc;
      }

      if (existingPc) {
        existingPc.close();
        peerConnectionsRef.current.delete(targetUserId);
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);

      // Tambahkan trek mikrofon lokal ke koneksi
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      } else {
        // Jika stream belum siap, tambahkan transceiver audio dua arah
        pc.addTransceiver("audio", { direction: "sendrecv" });
      }

      // Kirim kandidat ICE saat ditemukan oleh browser
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(targetUserId, channelId, "candidate", {
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Terima remote track audio dari peer dan putar melalui HTMLAudioElement
      pc.ontrack = (event) => {
        let audioEl = remoteAudiosRef.current.get(targetUserId);
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          audioEl.setAttribute("playsinline", "true");
          // Gunakan koordinat off-screen (bukan display: none) agar browser tidak mem-pause rendering audio
          audioEl.style.position = "fixed";
          audioEl.style.top = "-9999px";
          audioEl.style.left = "-9999px";
          audioEl.style.width = "1px";
          audioEl.style.height = "1px";
          audioEl.style.opacity = "0.01";
          audioEl.style.pointerEvents = "none";
          document.body.appendChild(audioEl);
          remoteAudiosRef.current.set(targetUserId, audioEl);
        }

        const remoteStream =
          event.streams && event.streams[0]
            ? event.streams[0]
            : new MediaStream([event.track]);

        audioEl.srcObject = remoteStream;
        audioEl.muted = isDeafenedRef.current;
        audioEl.volume = 1.0;

        // Panggil .play() secara eksplisit untuk menangani kebijakan browser Autoplay
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn(
              "[AUDIO_AUTOPLAY_POLICY] Audio terhalang kebijakan autoplay browser, menunggu interaksi pengguna:",
              err
            );
            const resumeOnInteraction = () => {
              audioEl?.play().catch(() => {});
              window.removeEventListener("click", resumeOnInteraction);
              window.removeEventListener("keydown", resumeOnInteraction);
            };
            window.addEventListener("click", resumeOnInteraction, { once: true });
            window.addEventListener("keydown", resumeOnInteraction, { once: true });
          });
        }
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
    [sendSignal]
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
        if (isMutedRef.current) {
          if (lastSpeakingStateRef.current) {
            lastSpeakingStateRef.current = false;
            setIsLocalSpeaking(false);
            setSpeakingUsers((prev) => {
              const next = new Set(prev);
              next.delete(currentUserId);
              return next;
            });
          }
          return;
        }

        analyserRef.current.getByteFrequencyData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length;
        const SPEAKING_THRESHOLD = 16;

        if (average > SPEAKING_THRESHOLD) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          if (!lastSpeakingStateRef.current) {
            lastSpeakingStateRef.current = true;
            setIsLocalSpeaking(true);
            setSpeakingUsers((prev) => new Set(prev).add(currentUserId));

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

  // Hentikan VAD & audio stream lokal serta bersihkan elemen DOM
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
    pendingCandidatesRef.current.clear();

    // Hapus elemen audio remote dari DOM
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

        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMutedRef.current;
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
            state: { isMuted: isMutedRef.current, isDeafened: isDeafenedRef.current },
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
    [cleanupMedia, setupVAD]
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

      if (activeVoiceChannelRef.current) {
        fetch("/api/team-lounge/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "state_change",
            channelId: activeVoiceChannelRef.current,
            state: { isMuted: next },
          }),
        }).catch(() => {});
      }

      return next;
    });
  }, []);

  // Toggle Deafen (Matikan suara output)
  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => {
      const next = !prev;

      remoteAudiosRef.current.forEach((el) => {
        el.muted = next;
      });

      if (next && !isMutedRef.current) {
        toggleMute();
      }

      if (activeVoiceChannelRef.current) {
        fetch("/api/team-lounge/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "state_change",
            channelId: activeVoiceChannelRef.current,
            state: { isDeafened: next },
          }),
        }).catch(() => {});
      }

      return next;
    });
  }, [toggleMute]);

  // Inisiasi offer ke peer tertentu
  const initiateOffer = useCallback(
    async (peerId: string, channelId: string) => {
      try {
        const pc = createPeerConnection(peerId, channelId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(offer);
        await sendSignal(peerId, channelId, "offer", { offer });
      } catch (err) {
        console.error("[INITIATE_OFFER_ERR]", err);
      }
    },
    [createPeerConnection, sendSignal]
  );

  // Loop Sinkronisasi (Heartbeat, Self-Healing Mesh, & Pemrosesan Sinyal WebRTC)
  useEffect(() => {
    let isCancelled = false;

    const performSync = async () => {
      try {
        const res = await fetch("/api/team-lounge/sync");
        if (!res.ok) return;

        const data = await res.json();
        if (isCancelled || !data.success) return;

        // Perbarui daftar partisipan di seluruh channel
        if (data.voiceParticipants) {
          setAllParticipants(data.voiceParticipants);

          // Update speaking status partisipan
          const speakingSet = new Set<string>();
          data.voiceParticipants.forEach((p: VoiceParticipant) => {
            if (p.isSpeaking) speakingSet.add(p.userId);
          });
          if (lastSpeakingStateRef.current) {
            speakingSet.add(currentUserId);
          }
          setSpeakingUsers(speakingSet);

          // Self-Healing P2P Mesh: Jika kita sedang di voice channel,
          // pastikan koneksi ke seluruh peer di channel yang sama terhubung
          const currentChannel = activeVoiceChannelRef.current;
          if (currentChannel && localStreamRef.current) {
            const peersInRoom = data.voiceParticipants.filter(
              (p: VoiceParticipant) =>
                p.channelId === currentChannel && p.userId !== currentUserId
            );

            for (const peer of peersInRoom) {
              const existingPc = peerConnectionsRef.current.get(peer.userId);
              const needsConnection =
                !existingPc ||
                existingPc.connectionState === "closed" ||
                existingPc.connectionState === "failed";

              // Gunakan aturan tie-breaker deterministik (lexicographical user ID):
              // User dengan ID lebih kecil yang mengambil inisiatif membuat Offer
              if (needsConnection && currentUserId < peer.userId) {
                initiateOffer(peer.userId, currentChannel);
              }
            }
          }
        }

        // Proses sinyal WebRTC jika berada di dalam saluran suara
        const currentChannel = activeVoiceChannelRef.current;
        if (currentChannel && data.signals && data.signals.length > 0) {
          for (const signal of data.signals as SignalingMessage[]) {
            const peerId = signal.fromUserId;
            if (peerId === currentUserId) continue;

            if (signal.type === "join") {
              // Peer baru bergabung -> Buat offer dan kirim ke peer baru tersebut
              initiateOffer(peerId, currentChannel);
            } else if (signal.type === "offer") {
              // Terima offer dari peer -> Set remote, buat answer, dan kirim balik
              const pc = createPeerConnection(peerId, currentChannel);
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.offer));
              await drainPendingCandidates(peerId, pc);

              const answer = await pc.createAnswer({
                offerToReceiveAudio: true,
              });
              await pc.setLocalDescription(answer);
              await sendSignal(peerId, currentChannel, "answer", { answer });
            } else if (signal.type === "answer") {
              // Terima answer dari peer
              const pc = peerConnectionsRef.current.get(peerId);
              if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.answer));
                await drainPendingCandidates(peerId, pc);
              }
            } else if (signal.type === "candidate") {
              // Terima kandidat ICE dari peer
              if (signal.payload.candidate) {
                await addOrQueueCandidate(peerId, signal.payload.candidate);
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
              pendingCandidatesRef.current.delete(peerId);
              setSpeakingUsers((prev) => {
                const next = new Set(prev);
                next.delete(peerId);
                return next;
              });
            } else if (signal.type === "state_change") {
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

    // Polling cepat (800ms jika sedang di voice, atau 2000ms jika idle)
    const intervalMs = activeVoiceChannelId ? 800 : 2000;
    performSync();
    syncIntervalRef.current = setInterval(performSync, intervalMs);

    return () => {
      isCancelled = true;
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [
    activeVoiceChannelId,
    addOrQueueCandidate,
    createPeerConnection,
    currentUserId,
    drainPendingCandidates,
    initiateOffer,
    sendSignal,
  ]);

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
