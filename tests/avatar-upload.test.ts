import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { toSessionData } from "../src/modules/auth/user.service";
import { UserAccount } from "../src/modules/auth/types";

describe("User Profile & Avatar Persistence Engine", () => {
  const dummyUser: UserAccount = {
    id: "user-avatar-test-01",
    email: "avatar.tester@fynux.co",
    passwordHash: "hash123",
    salt: "salt123",
    fullName: "Avatar Tester",
    role: "DEVELOPER",
    status: "ACTIVE",
    permissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test("toSessionData sanitizes base64 string to keep session cookies under 1KB", () => {
    const rawLargeBase64 = "data:image/webp;base64," + "A".repeat(15000);
    const mockUser: UserAccount = {
      ...dummyUser,
      avatarUrl: rawLargeBase64,
    };

    const sessionData = toSessionData(mockUser);

    assert.equal(
      sessionData.avatarUrl,
      undefined,
      "Base64 string panjang tidak boleh dimasukkan ke dalam cookie session"
    );
    assert.equal(sessionData.email, "avatar.tester@fynux.co");
  });

  test("toSessionData allows short public static avatar URLs", () => {
    const shortUrl = `/uploads/avatars/avatar-${dummyUser.id}.webp?v=1793460000`;
    const mockUser: UserAccount = {
      ...dummyUser,
      avatarUrl: shortUrl,
    };

    const sessionData = toSessionData(mockUser);

    assert.equal(sessionData.avatarUrl, shortUrl);
  });
});
