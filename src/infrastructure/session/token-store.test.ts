import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageTokenStore } from "./token-store";

const mem = new Map<string, string>();

const sampleSession = {
  user: { id: "u1", email: "duaa@example.com", firstName: "Duaa", lastName: "Al-Hayani" },
  membership: { id: "m1", role: "manager", staffDepartment: "" },
  workspace: { id: "w1", name: "Duaa Cafe", kind: "cafe", slug: "duaa-cafe" },
  scope: "general_manager",
  scopeLabel: "General manager",
  tabs: ["today"],
  defaultTab: "today",
  surface: "manager",
};

describe("LocalStorageTokenStore", () => {
  beforeEach(() => {
    mem.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => mem.get(key) ?? null,
        setItem: (key: string, value: string) => {
          mem.set(key, value);
        },
        removeItem: (key: string) => {
          mem.delete(key);
        },
        clear: () => mem.clear(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the SSR snapshot empty so hydration cannot see a stored token", () => {
    const store = new LocalStorageTokenStore();
    store.set("jwt-from-previous-session");
    expect(store.get()).toBe("jwt-from-previous-session");
    expect(store.getServerSnapshot()).toBeNull();
  });

  it("notifies subscribers after set and clear", () => {
    const store = new LocalStorageTokenStore();
    const seen: Array<string | null> = [];
    const unsubscribe = store.subscribe(() => seen.push(store.get()));

    store.set("a");
    store.clear();
    unsubscribe();
    store.set("ignored");

    expect(seen).toEqual(["a", null]);
  });

  it("keeps the session next to the token across a reload", () => {
    const a = new LocalStorageTokenStore();
    a.set("jwt-1", 3600);
    a.writeSession(sampleSession as never);
    const b = new LocalStorageTokenStore();
    expect(b.get()).toBe("jwt-1");
    expect(b.readSession()?.user.email).toBe("duaa@example.com");
  });

  it("clears an expired token so refresh cannot keep a dead session", () => {
    const store = new LocalStorageTokenStore();
    store.set("jwt-old", 1);
    mem.set("duaos_token_exp", String(Date.now() - 1000));
    expect(store.get()).toBeNull();
    expect(store.readSession()).toBeNull();
  });
});
