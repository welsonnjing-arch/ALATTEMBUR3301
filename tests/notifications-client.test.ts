import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  getDismissedNotificationIds,
  saveDismissedNotificationIds,
  dismissNotificationId,
  dismissAllNotificationIds,
} from "../src/lib/notifications-client";

describe("Notification Client Dismiss & Persistence Helper", () => {
  // Mock localStorage for node environment
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    (global as unknown as { window: unknown }).window = {
      localStorage: {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, val: string) => {
          mockStorage[key] = val;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
      },
    };
  });

  test("returns empty array initially when nothing dismissed", () => {
    const list = getDismissedNotificationIds();
    assert.deepEqual(list, []);
  });

  test("dismisses single notification and persists ID", () => {
    const updated = dismissNotificationId("notif-1");
    assert.deepEqual(updated, ["notif-1"]);
    assert.deepEqual(getDismissedNotificationIds(), ["notif-1"]);

    // Dismissing the same id does not duplicate
    const updated2 = dismissNotificationId("notif-1");
    assert.deepEqual(updated2, ["notif-1"]);
  });

  test("dismisses all notification IDs at once", () => {
    dismissNotificationId("notif-old");
    const updated = dismissAllNotificationIds(["notif-1", "notif-2", "notif-3"]);
    assert.ok(updated.includes("notif-old"));
    assert.ok(updated.includes("notif-1"));
    assert.ok(updated.includes("notif-2"));
    assert.ok(updated.includes("notif-3"));
    assert.equal(updated.length, 4);
  });

  test("calculates active unread count correctly against mock notifications", () => {
    const sampleNotifications = [
      { id: "app-1", title: "App 1" },
      { id: "task-1", title: "Task 1" },
      { id: "warr-1", title: "Warr 1" },
    ];

    // Initially all 3 are active
    const dismissed0 = getDismissedNotificationIds();
    const count0 = sampleNotifications.filter((n) => !dismissed0.includes(n.id)).length;
    assert.equal(count0, 3);

    // Dismiss 1 notification -> active is 2
    dismissNotificationId("task-1");
    const dismissed1 = getDismissedNotificationIds();
    const count1 = sampleNotifications.filter((n) => !dismissed1.includes(n.id)).length;
    assert.equal(count1, 2);

    // Dismiss all -> active is 0
    dismissAllNotificationIds(sampleNotifications.map((n) => n.id));
    const dismissedAll = getDismissedNotificationIds();
    const countAll = sampleNotifications.filter((n) => !dismissedAll.includes(n.id)).length;
    assert.equal(countAll, 0);
  });
});
