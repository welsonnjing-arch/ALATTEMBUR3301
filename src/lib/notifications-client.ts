"use client";

const DISMISSED_NOTIFS_STORAGE_KEY = "fynux_dismissed_notification_ids";

export function getDismissedNotificationIds(): string[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(DISMISSED_NOTIFS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDismissedNotificationIds(ids: string[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(DISMISSED_NOTIFS_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function dismissNotificationId(id: string): string[] {
  const current = getDismissedNotificationIds();
  if (current.includes(id)) return current;
  const updated = [...current, id];
  saveDismissedNotificationIds(updated);
  return updated;
}

export function dismissAllNotificationIds(ids: string[]): string[] {
  const current = getDismissedNotificationIds();
  const updated = Array.from(new Set([...current, ...ids]));
  saveDismissedNotificationIds(updated);
  return updated;
}
