"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, BookOpen, CheckSquare, FileText, Mic, Square, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AssistantUsage, TranslateMode, TranslateView } from "@/domain/assistant/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { useVoiceIO } from "./use-voice";

export function AssistantTranslatorPane({
  workspaceId,
  onUsage,
}: {
  workspaceId: string;
  onUsage: (u: AssistantUsage) => void;
}) {
  const { t } = useLocale();
  const voice = useVoiceIO(workspaceId);
  const [direction, setDirection] = useState<"en-ar" | "ar-en" | "explain">("en-ar");
  const [text, setText] = useState("");
  const [result, setResult] = useState<TranslateView | null>(null);

  const sourceLang = direction === "ar-en" ? "ar" : "en";
  const targetLang = direction === "ar-en" ? "en" : "ar";
  const mode: TranslateMode = direction === "explain" ? "explain_term" : "translate";

  const translate = useMutation({
    mutationFn: (payload: string) =>
      kernel.translateWithAssistant(workspaceId, {
        text: payload,
        sourceLang,
        targetLang,
        mode,
      }),
    onSuccess: (res) => {
      setResult(res);
      onUsage(res.usage);
      void voice.speak(res.translated, res.targetLang);
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3" data-testid="ai-translate-pane">
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setDirection("en-ar")}
          className={cn(
            "rounded-2xl border px-2 py-2 text-[11px] font-semibold transition",
            direction === "en-ar" ? "border-violet-300 bg-violet-50 text-violet-900" : "border-zinc-200 bg-white text-zinc-600",
          )}
        >
          {t.aiTranslateDirEnAr}
        </button>
        <button
          type="button"
          onClick={() => setDirection("ar-en")}
          className={cn(
            "rounded-2xl border px-2 py-2 text-[11px] font-semibold transition",
            direction === "ar-en" ? "border-violet-300 bg-violet-50 text-violet-900" : "border-zinc-200 bg-white text-zinc-600",
          )}
        >
          {t.aiTranslateDirArEn}
        </button>
        <button
          type="button"
          onClick={() => setDirection("explain")}
          className={cn(
            "rounded-2xl border px-2 py-2 text-[11px] font-semibold transition",
            direction === "explain" ? "border-violet-300 bg-violet-50 text-violet-900" : "border-zinc-200 bg-white text-zinc-600",
          )}
        >
          {t.aiExplainTerm}
        </button>
      </div>

      <div className="rounded-[20px] border border-zinc-200 bg-zinc-50/70 p-2.5">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.aiTranslatePlaceholder}
          className="w-full resize-none bg-transparent px-1 text-[13px] leading-snug text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={voice.transcribing || translate.isPending}
            onClick={() => {
              if (voice.recording) {
                voice.stopRecording();
              } else {
                void voice.startRecording(sourceLang, (spoken) => {
                  setText(spoken);
                  translate.mutate(spoken);
                });
              }
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
              voice.recording ? "bg-rose-600 text-white" : "bg-white text-zinc-800 ring-1 ring-zinc-200",
            )}
          >
            {voice.recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {voice.recording ? t.aiVoiceStop : t.aiVoiceMic}
          </button>

          <button
            type="button"
            disabled={!text.trim() || translate.isPending}
            onClick={() => translate.mutate(text.trim())}
            className="duaa-ai-orb inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {t.aiTranslateCta}
          </button>
        </div>
      </div>

      {result ? (
        <div className="space-y-2.5 rounded-[20px] border border-violet-100 bg-violet-50/40 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[14px] font-semibold leading-relaxed text-zinc-950" dir={result.targetLang === "ar" ? "rtl" : "ltr"}>
              {result.translated}
            </p>
            <button
              type="button"
              onClick={() => (voice.speaking ? voice.stopSpeaking() : void voice.speak(result.translated, result.targetLang))}
              aria-label={voice.speaking ? t.aiStopSpeaking : t.aiSpeakReply}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-violet-700 ring-1 ring-violet-200"
            >
              {voice.speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          {result.simpleExplanation ? (
            <div className="rounded-2xl bg-white/90 p-2.5 text-[12.5px] leading-snug text-zinc-700" dir="auto">
              <p className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-violet-700">
                <BookOpen className="h-3.5 w-3.5" />
                {t.aiSimpleExplain}
              </p>
              <p>{result.simpleExplanation}</p>
            </div>
          ) : null}

          {result.suggestedReply ? (
            <div className="rounded-2xl bg-white/90 p-2.5 text-[12.5px] leading-snug text-zinc-800">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-teal-700">{t.aiSuggestedReply}</span>
                <button
                  type="button"
                  onClick={() => void voice.speak(result.suggestedReply!, "en")}
                  className="text-[11px] font-semibold text-teal-700 underline"
                >
                  {t.aiSpeakReply}
                </button>
              </div>
              <p>{result.suggestedReply}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AssistantMeetingPane({ workspaceId }: { workspaceId: string }) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const voice = useVoiceIO(workspaceId);
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [transcript, setTranscript] = useState("");

  const meetings = useQuery({
    queryKey: qk.assistantMeetings(workspaceId),
    queryFn: () => kernel.listMeetings(workspaceId),
    staleTime: 20_000,
  });

  const summarize = useMutation({
    mutationFn: () =>
      kernel.summarizeMeeting(workspaceId, {
        title: title.trim() || "Executive Meeting",
        participants: participants.split(",").map((s) => s.trim()).filter(Boolean),
        transcript: transcript.trim(),
        sourceLocale: "auto",
        targetLocale: locale,
      }),
    onSuccess: (created) => {
      toast.success(created.title);
      setTitle("");
      setParticipants("");
      setTranscript("");
      void qc.invalidateQueries({ queryKey: qk.assistantMeetings(workspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3" data-testid="ai-meeting-pane">
      <p className="rounded-xl bg-amber-50/80 px-2.5 py-1.5 text-[11px] text-amber-900">{t.aiMeetingRecordingNote}</p>

      <div className="space-y-2 rounded-[20px] border border-zinc-200 bg-zinc-50/70 p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.aiMeetingTitlePlaceholder}
          className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[12.5px] outline-none"
        />
        <input
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder={t.aiMeetingParticipantsPlaceholder}
          className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[12.5px] outline-none"
        />
        <textarea
          rows={3}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={t.aiMeetingTranscriptPlaceholder}
          className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12.5px] outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={voice.transcribing || summarize.isPending}
            onClick={() => {
              if (voice.recording) {
                voice.stopRecording();
              } else {
                void voice.startRecording("auto", (spoken) => {
                  setTranscript((cur) => (cur ? `${cur}\n${spoken}` : spoken));
                });
              }
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
              voice.recording ? "bg-rose-600 text-white" : "bg-white text-zinc-800 ring-1 ring-zinc-200",
            )}
          >
            {voice.recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {voice.recording ? t.aiVoiceStop : t.aiVoiceMic}
          </button>
          <button
            type="button"
            disabled={!transcript.trim() || summarize.isPending}
            onClick={() => summarize.mutate()}
            className="duaa-ai-orb inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            <FileText className="h-3.5 w-3.5" />
            {t.aiMeetingSummarizeCta}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t.aiMeetingHistory}</p>
        {(meetings.data ?? []).length === 0 ? (
          <p className="text-[12.5px] text-zinc-500">{t.aiMeetingEmpty}</p>
        ) : (
          (meetings.data ?? []).slice(0, 5).map((m) => (
            <div key={m.id} className="space-y-1.5 rounded-2xl border border-zinc-200/70 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-zinc-950">{m.title}</p>
                <button
                  type="button"
                  onClick={() => (voice.speaking ? voice.stopSpeaking() : void voice.speak(m.summary, m.targetLocale || locale))}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-700"
                  aria-label={t.aiSpeakReply}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[12.5px] leading-snug text-zinc-700" dir="auto">{m.summary}</p>
              {m.decisions.length > 0 ? (
                <div className="space-y-1 pt-1">
                  <p className="text-[11px] font-semibold text-violet-700">{t.aiMeetingDecisions}</p>
                  {m.decisions.map((d, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-[12px] text-zinc-700">
                      <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                      <span>
                        {d.text} {d.ambiguous ? <em className="text-amber-700">({t.aiMeetingAmbiguous})</em> : d.owner ? `· ${d.owner}` : ""}
                      </span>
                    </p>
                  ))}
                </div>
              ) : null}
              {m.actionItems.length > 0 ? (
                <div className="space-y-1 pt-1">
                  <p className="text-[11px] font-semibold text-teal-700">{t.aiMeetingActions}</p>
                  {m.actionItems.map((a, i) => (
                    <p key={i} className="text-[12px] text-zinc-700">
                      • {a.text} {a.ambiguous ? <em className="text-amber-700">({t.aiMeetingAmbiguous})</em> : a.owner ? `· ${a.owner}` : ""}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
