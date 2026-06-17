import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { consumeLastCapturedError } from "../../src/lib/error-capture";

describe("error-capture", () => {
  beforeEach(() => {
    // Drain any previous state
    consumeLastCapturedError();
  });

  it("returns undefined when nothing has been captured", () => {
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("captures errors dispatched on the global error event", () => {
    const err = new Error("boom");
    const evt = new ErrorEvent("error", { error: err });
    globalThis.dispatchEvent(evt);
    expect(consumeLastCapturedError()).toBe(err);
    // Consumed — subsequent read empty
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("captures unhandled rejections", () => {
    const reason = new Error("rejected");
    // PromiseRejectionEvent isn't constructable in jsdom; fake it
    const evt = new Event("unhandledrejection") as Event & { reason: unknown };
    evt.reason = reason;
    globalThis.dispatchEvent(evt);
    expect(consumeLastCapturedError()).toBe(reason);
  });

  it("expires captured errors after the TTL", () => {
    vi.useFakeTimers();
    try {
      const err = new Error("stale");
      globalThis.dispatchEvent(new ErrorEvent("error", { error: err }));
      vi.advanceTimersByTime(10_000);
      expect(consumeLastCapturedError()).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  afterEach(() => {
    consumeLastCapturedError();
  });
});
