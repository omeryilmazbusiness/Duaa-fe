"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceIO } from "@/components/assistant/use-voice";
import {
  SPEAKER_MAX_LISTEN_MS,
  SPEAKER_NO_SPEECH_MS,
  SPEAKER_SILENCE_LEVEL,
  SPEAKER_SILENCE_MS,
  SPEAKER_SPEECH_LEVEL,
  speakableText,
  speakerLangTag,
  trimSpeakerHistory,
  type SpeakerIssue,
  type SpeakerPhase,
  type SpeakerTurn,
} from "@/domain/assistant/speaker";
import { assistantErrorKind, type AssistantErrorKind, type AssistantStatus } from "@/domain/assistant/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";

interface RecognitionResult {
  readonly isFinal: boolean;
  readonly 0?: { readonly transcript?: string };
}
interface RecognitionEvent {
  readonly results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  readonly error: string;
}
interface BrowserRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((ev: RecognitionEvent) => void) | null;
  onerror: ((ev: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => BrowserRecognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function canRecord(): boolean {
  return typeof MediaRecorder !== "undefined";
}

function recorderMime(): string {
  if (!canRecord() || typeof MediaRecorder.isTypeSupported !== "function") return "";
  for (const mime of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

function fileExt(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function isDenied(err: unknown): boolean {
  return err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
}

function errorKind(err: unknown): AssistantErrorKind {
  return err instanceof ApiError ? assistantErrorKind(err.code) : "generic";
}

/** iOS only lets speech play after a gesture; a silent utterance inside the tap unlocks it. */
function primeSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    // Speech synthesis is optional; server audio still plays.
  }
}

export interface AiSpeaker {
  phase: SpeakerPhase;
  transcript: string;
  amplitude: number;
  question: string;
  answer: string;
  error: AssistantErrorKind | null;
  issue: SpeakerIssue | null;
  canListen: boolean;
  start: () => Promise<void>;
  finish: () => void;
  cancel: () => void;
  ask: (text: string) => Promise<void>;
  replay: () => void;
  stopSpeaking: () => void;
  reset: () => void;
}

export function useAiSpeaker({ workspaceId, locale }: { workspaceId: string; locale: string }): AiSpeaker {
  const qc = useQueryClient();
  const voice = useVoiceIO(workspaceId);
  const [phase, setPhase] = useState<SpeakerPhase>("idle");
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<AssistantErrorKind | null>(null);
  const [issue, setIssue] = useState<SpeakerIssue | null>(null);
  const [canListen, setCanListen] = useState(false);

  const localeRef = useRef(locale);
  localeRef.current = locale;
  const historyRef = useRef<SpeakerTurn[]>([]);
  const sessionRef = useRef(0);
  const requestRef = useRef(0);
  const modeRef = useRef<"recognition" | "recorder" | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferRef = useRef("");
  const committedRef = useRef(false);
  const vadRef = useRef({ startedAt: 0, lastLoudAt: 0, heard: false });
  const speakRef = useRef(voice.speak);
  speakRef.current = voice.speak;
  const stopSpeechRef = useRef(voice.stopSpeaking);
  stopSpeechRef.current = voice.stopSpeaking;

  useEffect(() => {
    const hasMic = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    setCanListen(!!recognitionCtor() || (hasMic && canRecord()));
  }, []);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    silenceTimerRef.current = null;
    maxTimerRef.current = null;
  }, []);

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (audioCtxRef.current) void audioCtxRef.current.close().catch(() => undefined);
    audioCtxRef.current = null;
    setAmplitude(0);
  }, []);

  const releaseMedia = useCallback(
    (discardRecording: boolean) => {
      stopMeter();
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try {
          rec.abort();
        } catch {
          // Already stopped.
        }
      }
      const mr = recorderRef.current;
      recorderRef.current = null;
      if (mr && mr.state !== "inactive") {
        if (discardRecording) mr.onstop = null;
        try {
          mr.stop();
        } catch {
          // Already stopped.
        }
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      modeRef.current = null;
    },
    [stopMeter],
  );

  const ask = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q) return;
      stopSpeechRef.current();
      const req = ++requestRef.current;
      setQuestion(q);
      setAnswer("");
      setError(null);
      setIssue(null);
      setTranscript("");
      setPhase("thinking");
      const history = trimSpeakerHistory(historyRef.current);
      try {
        const res = await kernel.chatWithAssistant(workspaceId, {
          messages: [...history, { role: "user", content: q }],
          locale: localeRef.current,
          voice: true,
        });
        if (req !== requestRef.current) return;
        historyRef.current = trimSpeakerHistory([
          ...history,
          { role: "user", content: q },
          { role: "assistant", content: res.reply },
        ]);
        setAnswer(res.reply);
        setPhase("idle");
        qc.setQueryData<AssistantStatus>(qk.assistantStatus(workspaceId), (old) => (old ? { ...old, usage: res.usage } : old));
        void speakRef.current(speakableText(res.reply), localeRef.current);
      } catch (err) {
        if (req !== requestRef.current) return;
        setPhase("idle");
        const kind = errorKind(err);
        setError(kind);
        if (kind === "limit" || kind === "not_configured") {
          void qc.invalidateQueries({ queryKey: qk.assistantStatus(workspaceId) });
        }
      }
    },
    [qc, workspaceId],
  );

  const commit = useCallback(
    (session: number, text: string) => {
      if (committedRef.current || session !== sessionRef.current) return;
      committedRef.current = true;
      clearTimers();
      releaseMedia(true);
      const trimmed = text.trim();
      if (!trimmed) {
        setPhase("idle");
        setIssue("no_speech");
        return;
      }
      void ask(trimmed);
    },
    [ask, clearTimers, releaseMedia],
  );

  const transcribe = useCallback(
    async (session: number, blob: Blob, mime: string) => {
      if (session !== sessionRef.current) return;
      if (blob.size < 1024) {
        setPhase("idle");
        setIssue("no_speech");
        return;
      }
      setPhase("transcribing");
      const fd = new FormData();
      fd.append("audio", blob, `voice.${fileExt(mime)}`);
      fd.append("language", localeRef.current);
      try {
        const res = await kernel.transcribeAudio(workspaceId, fd);
        if (session !== sessionRef.current) return;
        const text = res.text.trim();
        if (!text) {
          setPhase("idle");
          setIssue("no_speech");
          return;
        }
        setTranscript(text);
        committedRef.current = false;
        commit(session, text);
      } catch (err) {
        if (session !== sessionRef.current) return;
        setPhase("idle");
        setError(errorKind(err));
      }
    },
    [commit, workspaceId],
  );

  const finish = useCallback(() => {
    const session = sessionRef.current;
    if (committedRef.current) return;
    clearTimers();
    if (modeRef.current === "recognition") {
      if (bufferRef.current.trim()) {
        commit(session, bufferRef.current);
        return;
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        commit(session, "");
      }
      return;
    }
    if (modeRef.current === "recorder") {
      committedRef.current = true;
      stopMeter();
      const mr = recorderRef.current;
      recorderRef.current = null;
      if (mr && mr.state !== "inactive") mr.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      modeRef.current = null;
      setPhase("transcribing");
    }
  }, [clearTimers, commit, stopMeter]);

  const startRecorder = useCallback(
    (session: number) => {
      const stream = streamRef.current;
      if (!stream || !canRecord()) {
        releaseMedia(true);
        setPhase("idle");
        setIssue("unsupported");
        return;
      }
      const mime = recorderMime();
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      mr.onstop = () => {
        const type = mr.mimeType || mime || "audio/webm";
        void transcribe(session, new Blob(chunks, { type }), type);
      };
      recorderRef.current = mr;
      modeRef.current = "recorder";
      const now = performance.now();
      vadRef.current = { startedAt: now, lastLoudAt: now, heard: false };
      mr.start(250);
    },
    [releaseMedia, transcribe],
  );

  const startMeter = useCallback(
    (stream: MediaStream, session: number) => {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (session !== sessionRef.current) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (const v of data) sum += v;
        const level = Math.min(1, sum / data.length / 128);
        setAmplitude(level);
        if (modeRef.current === "recorder" && !committedRef.current) {
          const now = performance.now();
          const vad = vadRef.current;
          if (level >= SPEAKER_SPEECH_LEVEL) {
            vad.heard = true;
            vad.lastLoudAt = now;
          } else if (level > SPEAKER_SILENCE_LEVEL) {
            vad.lastLoudAt = now;
          }
          if ((vad.heard && now - vad.lastLoudAt > SPEAKER_SILENCE_MS) || (!vad.heard && now - vad.startedAt > SPEAKER_NO_SPEECH_MS)) {
            finish();
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    },
    [finish],
  );

  const startRecognition = useCallback(
    (Ctor: RecognitionCtor, session: number) => {
      const rec = new Ctor();
      rec.lang = speakerLangTag(localeRef.current);
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      rec.onresult = (ev) => {
        if (session !== sessionRef.current) return;
        let finalText = "";
        let interim = "";
        for (let i = 0; i < ev.results.length; i++) {
          const r = ev.results[i];
          const text = r?.[0]?.transcript ?? "";
          if (r?.isFinal) finalText += text;
          else interim += text;
        }
        const text = `${finalText} ${interim}`.replace(/\s+/g, " ").trim();
        bufferRef.current = text;
        setTranscript(text);
        if (finalText.trim() && !interim.trim()) {
          commit(session, text);
          return;
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (text) {
          silenceTimerRef.current = setTimeout(() => commit(session, bufferRef.current), SPEAKER_SILENCE_MS);
        }
      };
      rec.onerror = (ev) => {
        if (session !== sessionRef.current || modeRef.current !== "recognition") return;
        const code = ev.error;
        if (code === "aborted") return;
        if (code === "not-allowed") {
          committedRef.current = true;
          clearTimers();
          releaseMedia(true);
          setPhase("idle");
          setIssue("mic_denied");
          return;
        }
        if (bufferRef.current.trim()) {
          commit(session, bufferRef.current);
          return;
        }
        if (code === "no-speech") {
          commit(session, "");
          return;
        }
        // network, service-not-allowed, language-not-supported: hand over to server transcription.
        recognitionRef.current = null;
        rec.onend = null;
        if (streamRef.current && canRecord()) {
          startRecorder(session);
          return;
        }
        committedRef.current = true;
        clearTimers();
        releaseMedia(true);
        setPhase("idle");
        setIssue("mic_unavailable");
      };
      rec.onend = () => {
        if (session !== sessionRef.current || modeRef.current !== "recognition") return;
        commit(session, bufferRef.current);
      };
      recognitionRef.current = rec;
      modeRef.current = "recognition";
      rec.start();
    },
    [clearTimers, commit, releaseMedia, startRecorder],
  );

  const start = useCallback(async () => {
    stopSpeechRef.current();
    requestRef.current++;
    primeSpeech();
    const session = ++sessionRef.current;
    clearTimers();
    releaseMedia(true);
    bufferRef.current = "";
    committedRef.current = false;
    setError(null);
    setIssue(null);
    setTranscript("");

    const Ctor = recognitionCtor();
    const hasMic = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    if (!Ctor && !(hasMic && canRecord())) {
      setIssue("unsupported");
      return;
    }
    let stream: MediaStream | null = null;
    if (hasMic) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch (err) {
        if (session !== sessionRef.current) return;
        if (isDenied(err)) {
          setIssue("mic_denied");
          return;
        }
        if (!Ctor) {
          setIssue("mic_unavailable");
          return;
        }
      }
    }
    if (session !== sessionRef.current) {
      stream?.getTracks().forEach((track) => track.stop());
      return;
    }
    streamRef.current = stream;
    setPhase("listening");
    maxTimerRef.current = setTimeout(() => finish(), SPEAKER_MAX_LISTEN_MS);
    if (Ctor) {
      try {
        startRecognition(Ctor, session);
      } catch {
        startRecorder(session);
      }
    } else {
      startRecorder(session);
    }
    if (stream) startMeter(stream, session);
  }, [clearTimers, finish, releaseMedia, startMeter, startRecognition, startRecorder]);

  const cancel = useCallback(() => {
    sessionRef.current++;
    requestRef.current++;
    committedRef.current = true;
    clearTimers();
    releaseMedia(true);
    stopSpeechRef.current();
    setTranscript("");
    setPhase("idle");
  }, [clearTimers, releaseMedia]);

  const replay = useCallback(() => {
    if (answer) void speakRef.current(speakableText(answer), localeRef.current);
  }, [answer]);

  const reset = useCallback(() => {
    cancel();
    historyRef.current = [];
    setQuestion("");
    setAnswer("");
    setError(null);
    setIssue(null);
  }, [cancel]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && modeRef.current) cancel();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [cancel]);

  useEffect(
    () => () => {
      sessionRef.current++;
      requestRef.current++;
      clearTimers();
      releaseMedia(true);
    },
    [clearTimers, releaseMedia],
  );

  useEffect(() => {
    historyRef.current = [];
  }, [workspaceId, locale]);

  const shownPhase: SpeakerPhase = phase === "idle" && voice.speaking ? "speaking" : phase;

  return {
    phase: shownPhase,
    transcript,
    amplitude,
    question,
    answer,
    error,
    issue,
    canListen,
    start,
    finish,
    cancel,
    ask,
    replay,
    stopSpeaking: voice.stopSpeaking,
    reset,
  };
}
