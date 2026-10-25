import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateNextFollowUp,
  isFollowUpDueTodayOrOverdue,
  isFollowUpOverdue,
} from "../src/modules/follow-up/follow-up.service";

describe("Calendar Days Follow-Up Engine (Non-Business Day Aware)", () => {
  const baseDate = new Date("2026-10-01T10:00:00Z");

  test("INITIAL outreach schedules FU1 exactly +1 calendar day later", () => {
    const res = calculateNextFollowUp("INITIAL", baseDate);
    assert.equal(res.nextStep, "FU1");
    assert.equal(res.daysInterval, 1);
    assert.equal(res.nextDueDate, "2026-10-02");
  });

  test("FU1 schedules FU2 exactly +3 calendar days later", () => {
    const res = calculateNextFollowUp("FU1", baseDate);
    assert.equal(res.nextStep, "FU2");
    assert.equal(res.daysInterval, 3);
    assert.equal(res.nextDueDate, "2026-10-04");
  });

  test("FU2 schedules FU3 exactly +5 calendar days later", () => {
    const res = calculateNextFollowUp("FU2", baseDate);
    assert.equal(res.nextStep, "FU3");
    assert.equal(res.daysInterval, 5);
    assert.equal(res.nextDueDate, "2026-10-06");
  });

  test("FU3 transitions to FAILED exactly +10 calendar days later if no response", () => {
    const res = calculateNextFollowUp("FU3", baseDate);
    assert.equal(res.nextStep, "FAILED");
    assert.equal(res.daysInterval, 10);
    assert.equal(res.nextDueDate, "2026-10-11");
  });

  test("isFollowUpDueTodayOrOverdue correctly checks due date", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    assert.equal(isFollowUpDueTodayOrOverdue(today), true);
    assert.equal(isFollowUpDueTodayOrOverdue(yesterday), true);
    assert.equal(isFollowUpDueTodayOrOverdue(tomorrow), false);
    assert.equal(isFollowUpDueTodayOrOverdue(null), false);
  });
});
