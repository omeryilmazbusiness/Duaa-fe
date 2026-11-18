import { describe, expect, it, vi } from "vitest";
import type { TokenStore } from "@/application/ports";
import { createWorkspaceTokenBroker, readTokenClaims, workspaceIdFromPath } from "./workspace-tokens";

const CAFE = "11111111-1111-4111-8111-111111111111";
const HOTEL = "22222222-2222-4222-8222-222222222222";

function jwt(claims: Record<string, unknown>): string {
  const b64 = (v: unknown) => btoa(JSON.stringify(v)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "HS256" })}.${b64(claims)}.sig`;
}

function store(initial: string | null): TokenStore {
  let value = initial;
  return {
    get: () => value,
    set: (token: string) => {
      value = token;
    },
    clear: () => {
      value = null;
    },
  };
}

describe("workspaceIdFromPath", () => {
  it("extracts the workspace id from scoped API paths only", () => {
    expect(workspaceIdFromPath(`/v1/workspaces/${HOTEL}/hotel/pms`)).toBe(HOTEL);
    expect(workspaceIdFromPath(`/v1/workspaces/${HOTEL.toUpperCase()}`)).toBe(HOTEL);
    expect(workspaceIdFromPath("/v1/me/portfolio")).toBeNull();
    expect(workspaceIdFromPath("/v1/workspaces/not-a-uuid/x")).toBeNull();
  });
});

describe("readTokenClaims", () => {
  it("decodes workspace and expiry", () => {
    expect(readTokenClaims(jwt({ workspace_id: CAFE, exp: 100 }))).toEqual({ workspaceId: CAFE, expMs: 100_000 });
    expect(readTokenClaims("garbage")).toBeNull();
  });
});

describe("createWorkspaceTokenBroker", () => {
  const now = () => 1_000_000;
  const primary = jwt({ workspace_id: CAFE, exp: 10_000 });
  const hotelToken = jwt({ workspace_id: HOTEL, exp: 10_000 });

  it("uses the session token for its own workspace and unscoped paths", async () => {
    const issue = vi.fn();
    const broker = createWorkspaceTokenBroker(store(primary), issue, now);
    expect(await broker.tokenFor(`/v1/workspaces/${CAFE}/dashboard`)).toEqual({ token: primary, scoped: false });
    expect(await broker.tokenFor("/v1/me/portfolio")).toEqual({ token: primary, scoped: false });
    expect(issue).not.toHaveBeenCalled();
  });

  it("issues, caches and dedupes a token for another workspace", async () => {
    const issue = vi.fn().mockResolvedValue(hotelToken);
    const broker = createWorkspaceTokenBroker(store(primary), issue, now);
    const [a, b] = await Promise.all([
      broker.tokenFor(`/v1/workspaces/${HOTEL}/hotel/pms`),
      broker.tokenFor(`/v1/workspaces/${HOTEL}/hotel/profile`),
    ]);
    expect(a).toEqual({ token: hotelToken, scoped: true });
    expect(b).toEqual({ token: hotelToken, scoped: true });
    await broker.tokenFor(`/v1/workspaces/${HOTEL}/hotel/pms`);
    expect(issue).toHaveBeenCalledTimes(1);
    expect(issue).toHaveBeenCalledWith(HOTEL, primary);
  });

  it("falls back to the session token when issuing fails", async () => {
    const broker = createWorkspaceTokenBroker(store(primary), vi.fn().mockRejectedValue(new Error("no")), now);
    expect(await broker.tokenFor(`/v1/workspaces/${HOTEL}/x`)).toEqual({ token: primary, scoped: false });
  });

  it("re-issues after invalidate and after the session changes", async () => {
    const tokens = store(primary);
    const issue = vi.fn().mockResolvedValue(hotelToken);
    const broker = createWorkspaceTokenBroker(tokens, issue, now);
    await broker.tokenFor(`/v1/workspaces/${HOTEL}/x`);
    broker.invalidate(`/v1/workspaces/${HOTEL}/x`);
    await broker.tokenFor(`/v1/workspaces/${HOTEL}/x`);
    tokens.set(jwt({ workspace_id: CAFE, exp: 20_000 }));
    await broker.tokenFor(`/v1/workspaces/${HOTEL}/x`);
    expect(issue).toHaveBeenCalledTimes(3);
  });

  it("refreshes a scoped token that is about to expire", async () => {
    let clock = 1_000_000;
    const issue = vi.fn().mockResolvedValue(jwt({ workspace_id: HOTEL, exp: 1_070 }));
    const broker = createWorkspaceTokenBroker(store(primary), issue, () => clock);
    await broker.tokenFor(`/v1/workspaces/${HOTEL}/x`);
    await broker.tokenFor(`/v1/workspaces/${HOTEL}/x`);
    expect(issue).toHaveBeenCalledTimes(1);
    clock += 20_000;
    await broker.tokenFor(`/v1/workspaces/${HOTEL}/x`);
    expect(issue).toHaveBeenCalledTimes(2);
  });

  it("returns no token when signed out", async () => {
    const broker = createWorkspaceTokenBroker(store(null), vi.fn(), now);
    expect(await broker.tokenFor(`/v1/workspaces/${HOTEL}/x`)).toEqual({ token: null, scoped: false });
  });
});
