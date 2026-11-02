import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getTextChannels,
  getVoiceChannels,
  createMessage,
  getMessages,
  toggleReaction,
  joinVoiceChannel,
  leaveVoiceChannel,
  updateVoiceState,
  getVoiceParticipants,
  queueSignal,
  consumeSignals,
} from "../src/modules/team-lounge/team-lounge.service";
import { SignalingMessage } from "../src/modules/team-lounge/types";

describe("Team Lounge Live Voice & Chat Engine", () => {
  it("initializes and loads default text & voice channels correctly", () => {
    const textChannels = getTextChannels();
    const voiceChannels = getVoiceChannels();

    assert.ok(textChannels.length >= 3, "Harus memiliki minimal 3 saluran teks");
    assert.ok(voiceChannels.length >= 3, "Harus memiliki minimal 3 saluran suara");

    const generalText = textChannels.find((c) => c.name === "general");
    assert.ok(generalText, "Saluran #general harus tersedia");

    const mainVoice = voiceChannels.find((c) => c.name.includes("Lounge Utama"));
    assert.ok(mainVoice, "Saluran suara Lounge Utama harus tersedia");
  });

  it("creates messages and retrieves channel message history", () => {
    const textChannels = getTextChannels();
    const targetChannel = textChannels[0].id;

    const testUser = {
      id: "test-user-dev-1",
      fullName: "Budi Pratama",
      role: "DEVELOPER" as const,
      avatarUrl: "/uploads/avatars/avatar-budi.webp",
    };

    const newMsg = createMessage(
      targetChannel,
      testUser,
      "Halo tim, apakah standup hari ini diadakan di Lounge Utama?"
    );

    assert.ok(newMsg.id.startsWith("msg-"), "ID pesan harus valid");
    assert.equal(newMsg.content, "Halo tim, apakah standup hari ini diadakan di Lounge Utama?");
    assert.equal(newMsg.userId, testUser.id);
    assert.equal(newMsg.userName, testUser.fullName);

    const messages = getMessages(targetChannel);
    const found = messages.find((m) => m.id === newMsg.id);
    assert.ok(found, "Pesan yang dibuat harus ditemukan di riwayat channel");
  });

  it("handles emoji reactions (add, toggle, remove)", () => {
    const textChannels = getTextChannels();
    const targetChannel = textChannels[0].id;

    const userA = {
      id: "test-user-a",
      fullName: "User A",
      role: "SALES" as const,
    };
    const userB = {
      id: "test-user-b",
      fullName: "User B",
      role: "DEVELOPER" as const,
    };

    const msg = createMessage(targetChannel, userA, "Proposal deal senilai Rp 50jt disetujui klien!");

    // User A reacts with fire 🔥
    const reacted1 = toggleReaction(msg.id, userA.id, "🔥");
    assert.ok(reacted1?.reactions?.["🔥"]?.includes(userA.id));
    assert.equal(reacted1?.reactions?.["🔥"]?.length, 1);

    // User B reacts with fire 🔥
    const reacted2 = toggleReaction(msg.id, userB.id, "🔥");
    assert.ok(reacted2?.reactions?.["🔥"]?.includes(userB.id));
    assert.equal(reacted2?.reactions?.["🔥"]?.length, 2);

    // User A clicks fire again to un-react
    const reacted3 = toggleReaction(msg.id, userA.id, "🔥");
    assert.ok(!reacted3?.reactions?.["🔥"]?.includes(userA.id));
    assert.equal(reacted3?.reactions?.["🔥"]?.length, 1);
  });

  it("manages voice room participants and state updates", () => {
    const voiceChannels = getVoiceChannels();
    const roomA = voiceChannels[0].id;

    const dev1 = {
      id: "voice-user-1",
      fullName: "Dev Faiz",
      role: "DEVELOPER" as const,
      avatarUrl: "/uploads/avatars/avatar-faiz.webp",
    };

    const dev2 = {
      id: "voice-user-2",
      fullName: "Dev Juan",
      role: "DEVELOPER" as const,
    };

    // Join room
    const p1 = joinVoiceChannel(roomA, dev1, { isMuted: false, isDeafened: false });
    assert.equal(p1.userId, dev1.id);
    assert.equal(p1.channelId, roomA);
    assert.equal(p1.isMuted, false);

    const p2 = joinVoiceChannel(roomA, dev2, { isMuted: true, isDeafened: false });
    assert.equal(p2.userId, dev2.id);
    assert.equal(p2.isMuted, true);

    const roomParticipants = getVoiceParticipants(roomA);
    assert.ok(roomParticipants.some((p) => p.userId === dev1.id));
    assert.ok(roomParticipants.some((p) => p.userId === dev2.id));

    // Update state (Mute & Speaking)
    const updated = updateVoiceState(dev1.id, { isMuted: true, isSpeaking: true });
    assert.equal(updated?.isMuted, true);
    assert.equal(updated?.isSpeaking, true);

    // Leave room
    leaveVoiceChannel(dev1.id);
    leaveVoiceChannel(dev2.id);

    const afterLeave = getVoiceParticipants(roomA);
    assert.ok(!afterLeave.some((p) => p.userId === dev1.id));
    assert.ok(!afterLeave.some((p) => p.userId === dev2.id));
  });

  it("routes and drains WebRTC signaling messages between peers", () => {
    const userAlice = "peer-alice";
    const userBob = "peer-bob";
    const channelId = "vc-test-channel";

    // Direct unicast offer from Alice to Bob
    const offerSignal: SignalingMessage = {
      id: "sig-offer-1",
      fromUserId: userAlice,
      toUserId: userBob,
      channelId,
      type: "offer",
      payload: { sdp: "v=0\r\no=alice..." },
      timestamp: Date.now(),
    };

    queueSignal(offerSignal);

    // Alice should not receive Bob's signal
    const aliceSignals = consumeSignals(userAlice);
    assert.equal(aliceSignals.length, 0);

    // Bob consumes his queue
    const bobSignals = consumeSignals(userBob);
    assert.equal(bobSignals.length, 1);
    assert.equal(bobSignals[0].type, "offer");
    assert.equal(bobSignals[0].fromUserId, userAlice);

    // Queue drained
    const bobSignalsAgain = consumeSignals(userBob);
    assert.equal(bobSignalsAgain.length, 0);
  });
});
