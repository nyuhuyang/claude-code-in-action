import { test, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

const mockSignJWT = {
  setProtectedHeader: vi.fn(),
  setExpirationTime: vi.fn(),
  setIssuedAt: vi.fn(),
  sign: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn(() => mockSignJWT),
  jwtVerify: vi.fn(),
}));

import { createSession, getSession } from "../auth";
import type { SessionPayload } from "../auth";

beforeEach(() => {
  vi.clearAllMocks();

  mockSignJWT.setProtectedHeader.mockReturnValue(mockSignJWT);
  mockSignJWT.setExpirationTime.mockReturnValue(mockSignJWT);
  mockSignJWT.setIssuedAt.mockReturnValue(mockSignJWT);
  mockSignJWT.sign.mockResolvedValue("mock-jwt-token");
});

afterEach(() => {
  vi.clearAllMocks();
});

test("createSession creates a JWT token and sets cookie", async () => {
  const userId = "user-123";
  const email = "test@example.com";

  await createSession(userId, email);

  const { SignJWT } = await import("jose");
  expect(SignJWT).toHaveBeenCalledWith(
    expect.objectContaining({
      userId,
      email,
      expiresAt: expect.any(Date),
    })
  );

  expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith("7d");
  expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
  expect(mockSignJWT.sign).toHaveBeenCalled();

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      expires: expect.any(Date),
      path: "/",
    })
  );
});

test("createSession sets secure flag in production", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      secure: true,
    })
  );

  process.env.NODE_ENV = originalEnv;
});

test("createSession does not set secure flag in development", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      secure: false,
    })
  );

  process.env.NODE_ENV = originalEnv;
});

test("createSession sets expiration to 7 days", async () => {
  const beforeTime = Date.now();
  await createSession("user-123", "test@example.com");
  const afterTime = Date.now();

  const callArgs = mockCookieStore.set.mock.calls[0];
  const expiresDate = callArgs[2].expires;

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const expectedMinTime = beforeTime + sevenDaysInMs;
  const expectedMaxTime = afterTime + sevenDaysInMs;

  expect(expiresDate.getTime()).toBeGreaterThanOrEqual(expectedMinTime);
  expect(expiresDate.getTime()).toBeLessThanOrEqual(expectedMaxTime);
});


test("createSession handles different user IDs and emails", async () => {
  const testCases = [
    { userId: "123", email: "user1@test.com" },
    { userId: "abc-def-456", email: "user2@example.org" },
    { userId: "user_with_underscore", email: "test+tag@domain.co.uk" },
  ];

  for (const { userId, email } of testCases) {
    vi.clearAllMocks();
    await createSession(userId, email);

    const { SignJWT } = await import("jose");
    expect(SignJWT).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        email,
      })
    );
  }
});


test("createSession creates unique tokens for different sessions", async () => {
  const tokens: string[] = [];

  mockSignJWT.sign.mockImplementation(async () => {
    const token = `token-${Math.random()}`;
    tokens.push(token);
    return token;
  });

  await createSession("user-1", "user1@test.com");
  await createSession("user-2", "user2@test.com");

  expect(tokens).toHaveLength(2);
  expect(tokens[0]).not.toBe(tokens[1]);
});

test("session payload includes correct date format", async () => {
  const beforeTime = Date.now();
  await createSession("user-123", "test@example.com");
  const afterTime = Date.now();

  const { SignJWT } = await import("jose");
  const callArgs = (SignJWT as any).mock.calls[0][0];

  expect(callArgs.expiresAt).toBeInstanceOf(Date);
  expect(callArgs.expiresAt.getTime()).toBeGreaterThanOrEqual(
    beforeTime + 7 * 24 * 60 * 60 * 1000
  );
  expect(callArgs.expiresAt.getTime()).toBeLessThanOrEqual(
    afterTime + 7 * 24 * 60 * 60 * 1000
  );
});

test("getSession returns session payload when token is valid", async () => {
  const mockPayload: SessionPayload = {
    userId: "user-123",
    email: "test@example.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  mockCookieStore.get.mockReturnValue({ value: "valid-token" });

  const { jwtVerify } = await import("jose");
  (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

  const result = await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).toHaveBeenCalledWith("valid-token", expect.anything());
  expect(result).toEqual(mockPayload);
});

test("getSession returns null when no token exists", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const result = await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(result).toBeNull();
});

test("getSession returns null when token is empty string", async () => {
  mockCookieStore.get.mockReturnValue({ value: "" });

  const result = await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(result).toBeNull();
});

test("getSession returns null when token verification fails", async () => {
  mockCookieStore.get.mockReturnValue({ value: "invalid-token" });

  const { jwtVerify } = await import("jose");
  (jwtVerify as any).mockRejectedValue(new Error("Invalid token"));

  const result = await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).toHaveBeenCalledWith("invalid-token", expect.anything());
  expect(result).toBeNull();
});

test("getSession returns null when token is expired", async () => {
  mockCookieStore.get.mockReturnValue({ value: "expired-token" });

  const { jwtVerify } = await import("jose");
  (jwtVerify as any).mockRejectedValue(new Error("Token expired"));

  const result = await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).toHaveBeenCalledWith("expired-token", expect.anything());
  expect(result).toBeNull();
});

test("getSession returns null when cookie has no value property", async () => {
  mockCookieStore.get.mockReturnValue({});

  const result = await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(result).toBeNull();
});

test("getSession returns null when jwtVerify throws generic error", async () => {
  mockCookieStore.get.mockReturnValue({ value: "malformed-token" });

  const { jwtVerify } = await import("jose");
  (jwtVerify as any).mockRejectedValue(new Error("JWT verification failed"));

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession handles whitespace-only token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "   " });

  const { jwtVerify } = await import("jose");
  (jwtVerify as any).mockRejectedValue(new Error("Invalid token format"));

  const result = await getSession();

  expect(jwtVerify).toHaveBeenCalledWith("   ", expect.anything());
  expect(result).toBeNull();
});

test("getSession correctly returns all session payload fields", async () => {
  const mockPayload: SessionPayload = {
    userId: "abc-123",
    email: "user@test.com",
    expiresAt: new Date("2026-12-31"),
  };

  mockCookieStore.get.mockReturnValue({ value: "valid-token" });

  const { jwtVerify } = await import("jose");
  (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

  const result = await getSession();

  expect(result).toEqual({
    userId: "abc-123",
    email: "user@test.com",
    expiresAt: new Date("2026-12-31"),
  });
});

test("getSession handles different token formats", async () => {
  const testTokens = [
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
    "short-token",
    "very-long-token-with-many-characters-that-might-be-valid-or-not",
  ];

  for (const token of testTokens) {
    vi.clearAllMocks();
    mockCookieStore.get.mockReturnValue({ value: token });

    const mockPayload: SessionPayload = {
      userId: "user-123",
      email: "test@example.com",
      expiresAt: new Date(),
    };

    const { jwtVerify } = await import("jose");
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const result = await getSession();

    expect(jwtVerify).toHaveBeenCalledWith(token, expect.anything());
    expect(result).toEqual(mockPayload);
  }
});
