/**
 * @jest-environment jsdom
 */
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import {
  clearPendingCopyIntent,
  consumePendingCopyIntent,
  peekAnyPendingCopyIntent,
  peekPendingCopyIntent,
  savePendingCopyIntent,
} from "@/lib/utils/pending-copy";

const INTENT = {
  sourceListId: "list-1",
  placeIds: ["p1", "p2"],
  target: { type: "new" as const, name: "My copy", isPublic: false },
};

afterEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe("pending-copy intent storage", () => {
  test("saves and restores the intent for the matching list", () => {
    savePendingCopyIntent(INTENT);
    const restored = consumePendingCopyIntent("list-1");
    expect(restored).toMatchObject(INTENT);
    expect(typeof restored?.ts).toBe("number");
  });

  test("is one-shot: a second consume returns null", () => {
    savePendingCopyIntent(INTENT);
    expect(consumePendingCopyIntent("list-1")).not.toBeNull();
    expect(consumePendingCopyIntent("list-1")).toBeNull();
  });

  test("returns null when the list id does not match", () => {
    savePendingCopyIntent(INTENT);
    expect(consumePendingCopyIntent("other-list")).toBeNull();
  });

  test("returns null after the TTL has elapsed", () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000);
    savePendingCopyIntent(INTENT);
    // 31分後
    nowSpy.mockReturnValue(1_000_000 + 31 * 60 * 1000);
    expect(consumePendingCopyIntent("list-1")).toBeNull();
  });

  test("returns null when nothing was saved", () => {
    expect(consumePendingCopyIntent("list-1")).toBeNull();
  });

  test("peek is non-destructive: repeated peeks still return the intent", () => {
    savePendingCopyIntent(INTENT);
    expect(peekPendingCopyIntent("list-1")).toMatchObject(INTENT);
    expect(peekPendingCopyIntent("list-1")).toMatchObject(INTENT);
  });

  test("peek respects list id and TTL", () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000);
    savePendingCopyIntent(INTENT);
    expect(peekPendingCopyIntent("other-list")).toBeNull();
    nowSpy.mockReturnValue(1_000_000 + 31 * 60 * 1000);
    expect(peekPendingCopyIntent("list-1")).toBeNull();
  });

  test("clear removes a peeked intent", () => {
    savePendingCopyIntent(INTENT);
    expect(peekPendingCopyIntent("list-1")).not.toBeNull();
    clearPendingCopyIntent();
    expect(peekPendingCopyIntent("list-1")).toBeNull();
  });

  test("peekAny returns the intent regardless of current list, respecting TTL", () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000);
    savePendingCopyIntent(INTENT);
    // リスト非限定で取得できる
    expect(peekAnyPendingCopyIntent()?.sourceListId).toBe("list-1");
    // TTL 超過では null
    nowSpy.mockReturnValue(1_000_000 + 31 * 60 * 1000);
    expect(peekAnyPendingCopyIntent()).toBeNull();
  });

  test("peekAny returns null when nothing saved", () => {
    expect(peekAnyPendingCopyIntent()).toBeNull();
  });
});
