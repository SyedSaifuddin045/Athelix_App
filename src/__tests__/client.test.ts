describe("ApiError", () => {
  const { ApiError } = require("../api/client");

  it("creates error with message and status", () => {
    const err = new ApiError("Not found", 404);
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.name).toBe("ApiError");
  });

  it("extracts field errors", () => {
    const fieldErrors = [{ field: "email", message: "Invalid email" }];
    const err = new ApiError("Validation failed", 422, {}, fieldErrors);
    expect(err.fieldErrors).toHaveLength(1);
    expect(err.fieldErrors[0].field).toBe("email");
  });
});

describe("getApiErrorMessage / getFieldError", () => {
  const { ApiError, getApiErrorMessage, getFieldError } = require("../api/client");

  it("returns message from ApiError", () => {
    expect(getApiErrorMessage(new ApiError("Not found", 404))).toBe("Not found");
  });

  it("returns message from generic Error", () => {
    expect(getApiErrorMessage(new Error("generic"))).toBe("generic");
  });

  it("returns fallback for unknown error", () => {
    expect(getApiErrorMessage("string")).toBe("Something went wrong.");
  });

  it("finds field error by field name", () => {
    const err = new ApiError("Validation error", 422, {}, [
      { field: "email", message: "Invalid email" },
    ]);
    expect(getFieldError(err, "email")).toBe("Invalid email");
  });

  it("returns undefined when field not found", () => {
    const err = new ApiError("Validation error", 422);
    expect(getFieldError(err, "email")).toBeUndefined();
  });
});

function setupMockFetch(mockImpl?: jest.Mock) {
  const mockFetch = mockImpl ?? jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
  jest.spyOn(globalThis, "fetch").mockImplementation(mockFetch);
  return mockFetch;
}

function getAuthHeader(mockFetch: jest.Mock, callIndex = 0): string | null {
  const headers: Headers = mockFetch.mock.calls[callIndex][1].headers;
  return headers.get?.("Authorization") ?? null;
}

describe("updateClerkToken", () => {
  beforeEach(() => {
    jest.resetModules();
    delete (globalThis as any).__athelixOriginalFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sets token and apiFetch includes it in Authorization header", async () => {
    const mockFetch = setupMockFetch();
    const { updateClerkToken, apiFetch } = require("../api/client");
    updateClerkToken("my-token");
    await apiFetch("https://api.athelix.fit/test");

    expect(getAuthHeader(mockFetch)).toBe("Bearer my-token");
  });

  it("overwrites previous token", async () => {
    const mockFetch = setupMockFetch();
    const { updateClerkToken, apiFetch } = require("../api/client");
    updateClerkToken("first");
    updateClerkToken("second");
    await apiFetch("https://api.athelix.fit/test");

    expect(getAuthHeader(mockFetch)).toBe("Bearer second");
  });

  it("skips Authorization for public paths", async () => {
    const mockFetch = setupMockFetch();
    const { updateClerkToken, apiFetch } = require("../api/client");
    updateClerkToken("my-token");
    await apiFetch("/health");

    expect(getAuthHeader(mockFetch)).toBeNull();
  });
});

describe("apiFetch error handling", () => {
  beforeEach(() => {
    jest.resetModules();
    delete (globalThis as any).__athelixOriginalFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws ApiError on non-OK response", async () => {
    const mockFetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Bad request" }), { status: 400 }),
    );
    jest.spyOn(globalThis, "fetch").mockImplementation(mockFetch);

    const { updateClerkToken, apiFetch } = require("../api/client");
    updateClerkToken("test-token");
    await expect(apiFetch("/test")).rejects.toThrow("Bad request");
  });

  it("throws ApiError with 401 and no refresh handler", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response(null, { status: 401 }));
    jest.spyOn(globalThis, "fetch").mockImplementation(mockFetch);

    const { updateClerkToken, apiFetch } = require("../api/client");
    updateClerkToken("test-token");
    await expect(apiFetch("/test")).rejects.toThrow("Session expired. Please sign in again.");
  });

  it("retries on 401 when refresh handler returns new token", async () => {
    let callCount = 0;
    const mockFetch = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return new Response(null, { status: 401 });
      return new Response(null, { status: 200 });
    });
    jest.spyOn(globalThis, "fetch").mockImplementation(mockFetch);

    const { updateClerkToken, setRefreshTokenHandler, apiFetch } = require("../api/client");
    updateClerkToken("expired-token");
    setRefreshTokenHandler(() => Promise.resolve("new-token"));
    await apiFetch("/test");

    expect(callCount).toBe(2);
    expect(getAuthHeader(mockFetch, 1)).toBe("Bearer new-token");
  });

  it("retries only once on 401", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response(null, { status: 401 }));
    jest.spyOn(globalThis, "fetch").mockImplementation(mockFetch);

    const { updateClerkToken, setRefreshTokenHandler, apiFetch } = require("../api/client");
    updateClerkToken("expired-token");
    setRefreshTokenHandler(() => Promise.resolve("still-expired"));

    await expect(apiFetch("/test")).rejects.toThrow("Your session has expired.");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("ensureToken timeout", () => {
  beforeEach(() => {
    jest.resetModules();
    delete (globalThis as any).__athelixOriginalFetch;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("waits for token to be set", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    jest.spyOn(globalThis, "fetch").mockImplementation(mockFetch);

    const { updateClerkToken, apiFetch } = require("../api/client");

    const fetchPromise = apiFetch("/test");
    jest.advanceTimersByTime(100);
    updateClerkToken("delayed");
    await fetchPromise;

    expect(getAuthHeader(mockFetch)).toBe("Bearer delayed");
  });

  it("throws after ensureToken 6s timeout", async () => {
    const mockFetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    );
    jest.spyOn(globalThis, "fetch").mockImplementation(mockFetch);

    const { apiFetch } = require("../api/client");

    const fetchPromise = apiFetch("/test");
    jest.advanceTimersByTime(6000);
    await expect(fetchPromise).rejects.toThrow("Session expired. Please sign in again.");
  });
});

describe("getTokenWithTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves with token when getTokenFn resolves quickly", async () => {
    const { getTokenWithTimeout } = require("../api/client");
    const getTokenFn = () => Promise.resolve("my-token");

    const result = getTokenWithTimeout(getTokenFn, 5000);
    jest.advanceTimersByTime(100);

    await expect(result).resolves.toBe("my-token");
  });

  it("resolves with null when getTokenFn times out", async () => {
    const { getTokenWithTimeout } = require("../api/client");
    const getTokenFn = () => new Promise<string | null>(() => {});

    const result = getTokenWithTimeout(getTokenFn, 5000);
    jest.advanceTimersByTime(5000);

    await expect(result).resolves.toBeNull();
  });

  it("resolves with null when getTokenFn rejects", async () => {
    const { getTokenWithTimeout } = require("../api/client");
    const getTokenFn = () => Promise.reject(new Error("fail"));

    const result = getTokenWithTimeout(getTokenFn, 5000);
    jest.advanceTimersByTime(100);

    await expect(result).resolves.toBeNull();
  });

  it("resolves with null when getTokenFn returns null", async () => {
    const { getTokenWithTimeout } = require("../api/client");
    const getTokenFn = () => Promise.resolve(null);

    const result = getTokenWithTimeout(getTokenFn, 5000);
    jest.advanceTimersByTime(100);

    await expect(result).resolves.toBeNull();
  });
});
