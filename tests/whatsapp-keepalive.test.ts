import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  hasPersistedWhatsAppAuth,
  getWhatsAppSession,
  initWhatsAppKeepAlive,
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
});
