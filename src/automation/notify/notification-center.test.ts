import { describe, expect, it } from "vitest";
import {
  appendNotification,
  createAppNotification,
  loadNotifications,
  saveNotifications
} from "./notification-center";

function createMemoryStorage(): Storage {
  const bucket = new Map<string, string>();
  return {
    clear: () => bucket.clear(),
    getItem: (key: string) => bucket.get(key) ?? null,
    key: (index: number) => Array.from(bucket.keys())[index] ?? null,
    get length() {
      return bucket.size;
    },
    removeItem: (key: string) => {
      bucket.delete(key);
    },
    setItem: (key: string, value: string) => {
      bucket.set(key, value);
    }
  };
}

describe("notification center", () => {
  it("appends notifications in reverse chronological order", () => {
    const first = createAppNotification({
      createdAt: "2026-05-17T08:00:00.000Z",
      level: "info",
      message: "小米已进入待自动重评估队列。",
      title: "自选股调度"
    });
    const second = createAppNotification({
      createdAt: "2026-05-17T09:00:00.000Z",
      level: "success",
      message: "小米重评估已完成。",
      title: "重评估完成"
    });

    const notifications = appendNotification([first], second);
    expect(notifications[0].title).toBe("重评估完成");
    expect(notifications[1].title).toBe("自选股调度");
  });

  it("round-trips persisted notifications", () => {
    const storage = createMemoryStorage();
    const notification = createAppNotification({
      createdAt: "2026-05-17T08:00:00.000Z",
      level: "info",
      message: "小米已进入待自动重评估队列。",
      title: "自选股调度"
    });

    saveNotifications(storage, [notification], "notifications-test");
    expect(loadNotifications(storage, "notifications-test")).toEqual([notification]);
  });
});
