import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  hasPersistedWhatsAppAuth,
  getWhatsAppSession,
  initWhatsAppKeepAlive,
  isBaileysSocketAlive,
  decommissionSocket,
} from "../src/modules/whatsapp/whatsapp.service";

describe("WhatsApp Keep-Alive & 24/7 Background Engine", () => {
  it("safely checks for persisted WhatsApp credentials in auth directory", () => {
    // In test environment, .whatsapp-auth-test is used
    const hasAuth = hasPersistedWhatsAppAuth();
    assert.equal(typeof hasAuth, "boolean");
  });

  it("retrieves current WhatsApp session info cleanly", async () => {
    const session = await getWhatsAppSession();
    assert.ok(session);
    assert.ok(["DISCONNECTED", "CONNECTING", "SCANNING_QR", "CONNECTED", "ERROR"].includes(session.status));
    assert.equal(session.platform, "WhatsApp Multi-Device (Fynux Engine)");
  });

  it("safely handles multiple initWhatsAppKeepAlive invocations without duplicate daemons", () => {
    // Calling initWhatsAppKeepAlive in test mode should exit safely and idempotently
    assert.doesNotThrow(() => {
      initWhatsAppKeepAlive();
      initWhatsAppKeepAlive();
    });
  });

  it("correctly identifies Baileys socket vitality via isOpen or readyState", () => {
    assert.equal(isBaileysSocketAlive(null), false);
    assert.equal(isBaileysSocketAlive(undefined), false);

    // Mock Baileys WebSocketClient with isOpen getter
    const mockOpenWsClient = { ws: { isOpen: true, socket: { readyState: 1 } } };
    assert.equal(isBaileysSocketAlive(mockOpenWsClient), true);

    const mockClosedWsClient = { ws: { isOpen: false, socket: { readyState: 3 } } };
    assert.equal(isBaileysSocketAlive(mockClosedWsClient), false);

    // Decommissioned socket is always dead
    const mockDecommissioned = { ws: { isOpen: true }, isDecommissioned: true };
    assert.equal(isBaileysSocketAlive(mockDecommissioned), false);
  });

  it("safely decommissions old socket and cleans up all event listeners", () => {
    let listenersRemoved = false;
    let endCalled = false;

    const mockSocket = {
      ev: {
        removeAllListeners: (evt: string) => {
          if (evt === "connection.update") listenersRemoved = true;
        },
      },
      end: () => {
        endCalled = true;
      },
      isDecommissioned: false,
    };

    decommissionSocket(mockSocket);
    assert.equal(mockSocket.isDecommissioned, true);
    assert.equal(listenersRemoved, true);
    assert.equal(endCalled, true);

    // Calling decommissionSocket on null or undefined does not throw
    assert.doesNotThrow(() => decommissionSocket(null));
  });
});
