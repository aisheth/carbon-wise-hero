import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportLovableError } from "../../src/lib/lovable-error-reporting";

describe("reportLovableError", () => {
  const captureSpy = vi.fn();

  beforeEach(() => {
    captureSpy.mockClear();
    window.__lovableEvents = { captureException: captureSpy };
  });

  afterEach(() => {
    delete window.__lovableEvents;
  });

  it("forwards the error with route and source context", () => {
    const err = new Error("kaboom");
    reportLovableError(err, { extra: "data" });
    expect(captureSpy).toHaveBeenCalledOnce();
    const [error, context, options] = captureSpy.mock.calls[0];
    expect(error).toBe(err);
    expect(context).toMatchObject({
      source: "react_error_boundary",
      route: window.location.pathname,
      extra: "data",
    });
    expect(options).toEqual({
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    });
  });

  it("is a no-op when __lovableEvents is missing", () => {
    delete window.__lovableEvents;
    expect(() => reportLovableError(new Error("x"))).not.toThrow();
  });

  it("is a no-op when captureException is missing", () => {
    window.__lovableEvents = {};
    expect(() => reportLovableError(new Error("x"))).not.toThrow();
  });

  it("defaults context to an empty object", () => {
    reportLovableError(new Error("x"));
    expect(captureSpy).toHaveBeenCalledOnce();
  });
});
