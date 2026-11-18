import type { ChatRole } from "./types";

export type SpeakerPhase = "idle" | "listening" | "transcribing" | "thinking" | "speaking";

export type SpeakerIssue = "mic_denied" | "mic_unavailable" | "unsupported" | "no_speech";

export interface SpeakerTurn {
  role: ChatRole;
  content: string;
}

/** Silence after the last heard words before the question is sent. */
export const SPEAKER_SILENCE_MS = 1500;
/** Hard cap on one spoken question. */
export const SPEAKER_MAX_LISTEN_MS = 30_000;
/** Give up when nothing is said at all. */
export const SPEAKER_NO_SPEECH_MS = 8_000;
/** Analyser level (0–1) that counts as speech / as silence for the recorder fallback. */
export const SPEAKER_SPEECH_LEVEL = 0.12;
export const SPEAKER_SILENCE_LEVEL = 0.06;
/** Previous question/answer pairs sent for follow-up context. */
export const SPEAKER_MEMORY_TURNS = 3;
const MAX_SPOKEN_CHARS = 1200;

/** BCP-47 tag for speech recognition and synthesis in the screen language. */
export function speakerLangTag(locale: string): string {
  switch (locale) {
    case "ar":
      return "ar-SA";
    case "tr":
      return "tr-TR";
    default:
      return "en-US";
  }
}

/** Strips markdown so text-to-speech never reads symbols aloud. */
export function speakableText(raw: string): string {
  let s = raw.replace(/```[\s\S]*?```/g, " ");
  s = s.replace(/`([^`]*)`/g, "$1");
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  s = s.replace(/^\s*[-*•+]\s+/gm, "");
  s = s.replace(/^\s*\d+[.)]\s+/gm, "");
  s = s.replace(/\*\*|__|[*_~]/g, "");
  s = s.replace(/\|/g, ", ");
  s = s.replace(/\s*\n+\s*/g, ". ");
  s = s.replace(/\.{2,}/g, ".").replace(/([.!?؟])\s*\./g, "$1");
  s = s.replace(/\s{2,}/g, " ").trim();
  if (s.length > MAX_SPOKEN_CHARS) {
    const cut = s.slice(0, MAX_SPOKEN_CHARS);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("؟ "), cut.lastIndexOf("? "));
    s = end > MAX_SPOKEN_CHARS / 2 ? cut.slice(0, end + 1) : cut;
  }
  return s;
}

/** Keeps the last few question/answer pairs and always starts on a user turn. */
export function trimSpeakerHistory(turns: readonly SpeakerTurn[], maxPairs = SPEAKER_MEMORY_TURNS): SpeakerTurn[] {
  const clean = turns.filter((t) => t.content.trim().length > 0);
  let out = clean.slice(-maxPairs * 2);
  while (out.length > 0 && out[0]?.role !== "user") out = out.slice(1);
  return out;
}
