"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { kernel } from "@/lib/kernel";

interface SpeechRecResult {
  readonly 0?: { readonly transcript?: string };
}
interface SpeechRecEvent {
  readonly results?: ArrayLike<SpeechRecResult>;
}
interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechRecognitionCtor(): (new () => BrowserSpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechLocaleTag(lang: string): string {
  switch (lang) {
    case "ar":
      return "ar-SA";
    case "tr":
      return "tr-TR";
    default:
      return "en-US";
  }
}

export function useVoiceIO(workspaceId: string) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const speechRecRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const resolveStopRef = useRef<((res: { text: string; language?: string } | null) => void) | null>(null);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  useEffect(() => stopSpeaking, [stopSpeaking]);

  const speak = useCallback(
    async (text: string, language: string) => {
      const clean = text.trim();
      if (!clean) return;
      stopSpeaking();
      setSpeaking(true);
      try {
        const blob = await kernel.speakAudio(workspaceId, { text: clean, language });
        if (blob) {
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;
          const el = new Audio(url);
          audioRef.current = el;
          el.onended = () => {
            stopSpeaking();
          };
          el.onerror = () => {
            stopSpeaking();
          };
          await el.play();
          return;
        }
      } catch {
        // Fall through cleanly to native browser synthesis.
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(clean);
        const tag = speechLocaleTag(language);
        utter.lang = tag;
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find((v) => v.lang.toLowerCase().startsWith(language.toLowerCase()));
        if (match) utter.voice = match;
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
      } else {
        setSpeaking(false);
      }
    },
    [stopSpeaking, workspaceId],
  );

  const startRecording = useCallback(
    async (languageHint: string, onTranscript: (text: string, detectedLanguage?: string) => void) => {
      if (recording) return;
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
          const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          chunksRef.current = [];
          recorder.ondataavailable = (ev) => {
            if (ev.data.size > 0) chunksRef.current.push(ev.data);
          };
          recorder.onstop = async () => {
            stream.getTracks().forEach((tr) => tr.stop());
            streamRef.current = null;
            setRecording(false);
            const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
            if (blob.size === 0) {
              resolveStopRef.current?.(null);
              return;
            }
            setTranscribing(true);
            try {
              const fd = new FormData();
              fd.append("audio", blob, "voice.webm");
              fd.append("language", languageHint || "auto");
              const res = await kernel.transcribeAudio(workspaceId, fd);
              if (res.text) {
                onTranscript(res.text, res.detectedLanguage);
                resolveStopRef.current?.({ text: res.text, language: res.detectedLanguage });
              } else {
                resolveStopRef.current?.(null);
              }
            } catch {
              resolveStopRef.current?.(null);
            } finally {
              setTranscribing(false);
              resolveStopRef.current = null;
            }
          };
          recorderRef.current = recorder;
          recorder.start();
          setRecording(true);
          return;
        } catch {
          // Fall back to SpeechRecognition when mic permissions/MediaRecorder aren't used.
        }
      }

      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = speechLocaleTag(languageHint === "auto" ? "ar" : languageHint);
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (ev) => {
        const transcript = ev.results?.[0]?.[0]?.transcript?.trim() ?? "";
        if (transcript) onTranscript(transcript, languageHint);
      };
      rec.onerror = () => setRecording(false);
      rec.onend = () => setRecording(false);
      speechRecRef.current = rec;
      setRecording(true);
      rec.start();
    },
    [recording, workspaceId],
  );

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (speechRecRef.current) {
      speechRecRef.current.stop();
      speechRecRef.current = null;
      setRecording(false);
    }
  }, []);

  return {
    recording,
    transcribing,
    speaking,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
  };
}
