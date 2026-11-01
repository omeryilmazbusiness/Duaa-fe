import { describe, expect, it } from "vitest";
import { canActRecovery, canCompensate, isOpenRecovery } from "./recovery";
import type { CafeVoice } from "./qr";

function voice(partial: Partial<CafeVoice>): CafeVoice {
  return {
    id: "v1",
    siteId: "s1",
    label: "12",
    area: "table",
    kind: "review",
    rating: 2,
    comment: "cold",
    contactName: "",
    contactPhone: "",
    unhappy: true,
    needsRecovery: true,
    recoveryId: "r1",
    recoveryStatus: "open",
    assigneeUserId: "",
    linkedTaskId: "",
    compensationAmount: 0,
    compensationCurrency: "",
    compensationLimit: 20,
    ackDue: "",
    resolveDue: "",
    lateAck: false,
    lateResolve: false,
    createdAt: "",
    ...partial,
  };
}

describe("recovery file", () => {
  it("does not invent actions on a happy review", () => {
    const happy = voice({ rating: 5, unhappy: false, needsRecovery: false, recoveryStatus: "" });
    expect(canActRecovery(happy)).toBe(false);
    expect(isOpenRecovery("")).toBe(false);
  });

  it("records compensation only when a limit exists and the file is open", () => {
    expect(canCompensate(voice({}))).toBe(true);
    expect(canCompensate(voice({ compensationLimit: 0 }))).toBe(false);
    expect(canCompensate(voice({ compensationAmount: 10 }))).toBe(false);
    expect(canCompensate(voice({ recoveryStatus: "closed" }))).toBe(false);
  });
});
