import type { VoiceKind } from "./qr";

export const GUEST_STARS = [1, 2, 3, 4, 5] as const;

export const GUEST_INTENTS: readonly VoiceKind[] = ["review", "complaint", "request"];

export type GuestIntentTone = "amber" | "rose" | "sky";

export function guestNeedsRating(kind: VoiceKind): boolean {
  return kind === "review";
}

export function guestNeedsNote(kind: VoiceKind): boolean {
  return kind === "complaint" || kind === "request";
}

export function guestIntentTone(kind: VoiceKind): GuestIntentTone {
  if (kind === "complaint") return "rose";
  if (kind === "request") return "sky";
  return "amber";
}

export function canSubmitGuest(input: { kind: VoiceKind; rating: number; comment: string; open: boolean }): boolean {
  if (!input.open) return false;
  if (guestNeedsRating(input.kind) && (input.rating < 1 || input.rating > 5)) return false;
  if (guestNeedsNote(input.kind) && input.comment.trim().length < 2) return false;
  return true;
}

export function guestNoteKey(kind: VoiceKind): "voiceComment" | "voiceComplaintBody" | "voiceRequestBody" {
  if (kind === "complaint") return "voiceComplaintBody";
  if (kind === "request") return "voiceRequestBody";
  return "voiceComment";
}

export function guestSendKey(kind: VoiceKind): "voiceSendReview" | "voiceSendComplaint" | "voiceSendRequest" {
  if (kind === "complaint") return "voiceSendComplaint";
  if (kind === "request") return "voiceSendRequest";
  return "voiceSendReview";
}

export function guestAskKey(kind: VoiceKind): "voiceAskReview" | "voiceAskComplaint" | "voiceAskRequest" {
  if (kind === "complaint") return "voiceAskComplaint";
  if (kind === "request") return "voiceAskRequest";
  return "voiceAskReview";
}

export function guestKindKey(kind: VoiceKind): "voiceKindReview" | "voiceKindComplaint" | "voiceKindRequest" {
  if (kind === "complaint") return "voiceKindComplaint";
  if (kind === "request") return "voiceKindRequest";
  return "voiceKindReview";
}

export function toGuestSubmit(input: { kind: VoiceKind; rating: number; comment: string }) {
  return {
    kind: input.kind,
    rating: guestNeedsRating(input.kind) ? input.rating : undefined,
    comment: input.comment.trim(),
  };
}
