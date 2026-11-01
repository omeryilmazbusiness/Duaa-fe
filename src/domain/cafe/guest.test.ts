import { describe, expect, it } from "vitest";
import { canSubmitGuest, guestAskKey, guestIntentTone, guestKindKey, guestNeedsNote, guestNeedsRating, guestNoteKey, toGuestSubmit } from "./guest";

describe("guest voice page", () => {
  it("never invents stars and keeps the door closed until the workshop is ready", () => {
    expect(canSubmitGuest({ kind: "review", rating: 0, comment: "", open: true })).toBe(false);
    expect(canSubmitGuest({ kind: "review", rating: 5, comment: "", open: false })).toBe(false);
    expect(canSubmitGuest({ kind: "review", rating: 5, comment: "", open: true })).toBe(true);
  });

  it("asks for a note on complaint and request, not a fake score", () => {
    expect(guestNeedsRating("complaint")).toBe(false);
    expect(guestNeedsNote("request")).toBe(true);
    expect(canSubmitGuest({ kind: "complaint", rating: 0, comment: "", open: true })).toBe(false);
    expect(canSubmitGuest({ kind: "request", rating: 0, comment: "water", open: true })).toBe(true);
    expect(guestNoteKey("complaint")).toBe("voiceComplaintBody");
    expect(guestIntentTone("complaint")).toBe("rose");
    expect(guestAskKey("review")).toBe("voiceAskReview");
    expect(guestKindKey("request")).toBe("voiceKindRequest");
    expect(toGuestSubmit({ kind: "request", rating: 4, comment: " water " })).toEqual({
      kind: "request",
      rating: undefined,
      comment: "water",
    });
  });
});

