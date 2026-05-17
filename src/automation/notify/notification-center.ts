export const NOTIFICATION_STORAGE_KEY = "decisiondesk.notifications.v1";

export type NotificationLevel = "info" | "success";

export type AppNotification = {
  createdAt: string;
  id: string;
  level: NotificationLevel;
  message: string;
  title: string;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAppNotification(value: unknown): value is AppNotification {
  return isRecord(value)
    && typeof value.createdAt === "string"
    && typeof value.id === "string"
    && typeof value.level === "string"
    && typeof value.message === "string"
    && typeof value.title === "string";
}

function sortNotifications(items: AppNotification[]): AppNotification[] {
  return [...items].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export function createAppNotification(payload: {
  createdAt: string;
  level: NotificationLevel;
  message: string;
  title: string;
}): AppNotification {
  return {
    createdAt: payload.createdAt,
    id: `${payload.level}-${payload.createdAt}-${payload.title}`,
    level: payload.level,
    message: payload.message,
    title: payload.title
  };
}

export function appendNotification(
  items: AppNotification[],
  nextNotification: AppNotification
): AppNotification[] {
  return sortNotifications([
    nextNotification,
    ...items.filter((item) => item.id !== nextNotification.id)
  ]).slice(0, 12);
}

export function loadNotifications(
  storage: StorageReader,
  storageKey: string = NOTIFICATION_STORAGE_KEY
): AppNotification[] {
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortNotifications(parsed.filter(isAppNotification));
  } catch {
    return [];
  }
}

export function saveNotifications(
  storage: StorageWriter,
  items: AppNotification[],
  storageKey: string = NOTIFICATION_STORAGE_KEY
): void {
  storage.setItem(storageKey, JSON.stringify(sortNotifications(items)));
}
