"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  assistantErrorKind,
  toWireMessages,
  type AssistantErrorKind,
  type AssistantStatus,
  type ChatMessage,
} from "@/domain/assistant/types";
import { clearThread, loadThread, saveThread } from "@/domain/assistant/thread";
import type { SessionPayload } from "@/domain/session/types";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/infrastructure/http/errors";

export function useAssistantStatus(session: SessionPayload) {
  const wid = session.workspace.id;
  return useQuery({
    queryKey: qk.assistantStatus(wid),
    queryFn: () => kernel.getAssistantStatus(wid),
    enabled: session.scope === "general_manager",
    staleTime: 30_000,
    retry: false,
  });
}

interface ChatOptions {
  workspaceId: string;
  locale: string;
  /** Called with the text of a message that failed, so the UI can put it back in the input. */
  onFailed: (text: string) => void;
}

export function useAssistantChat({ workspaceId, locale, onFailed }: ChatOptions) {
  const qc = useQueryClient();
  const seq = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadThread(workspaceId));
  const [error, setError] = useState<AssistantErrorKind | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadThread(workspaceId);
    seq.current = loaded.length;
    setMessages(loaded);
    setError(null);
    setStreamingId(null);
  }, [workspaceId]);

  useEffect(() => {
    saveThread(workspaceId, messages);
  }, [workspaceId, messages]);

  const mutation = useMutation({
    mutationFn: (history: ChatMessage[]) =>
      kernel.chatWithAssistant(workspaceId, { messages: toWireMessages(history), locale }),
  });

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || mutation.isPending) return;
      const userMsg: ChatMessage = { id: `u${++seq.current}`, role: "user", content: text };
      const history = [...messages, userMsg];
      setError(null);
      setMessages(history);
      mutation.mutate(history, {
        onSuccess: (res) => {
          const id = `a${++seq.current}`;
          setStreamingId(id);
          setMessages((cur) => [...cur, { id, role: "assistant", content: res.reply }]);
          qc.setQueryData<AssistantStatus>(qk.assistantStatus(workspaceId), (old) =>
            old ? { ...old, usage: res.usage } : old,
          );
        },
        onError: (err) => {
          // Roll the failed turn back so history stays strictly alternating.
          setMessages((cur) => cur.filter((m) => m.id !== userMsg.id));
          onFailed(text);
          const code = err instanceof ApiError ? err.code : "error";
          setError(assistantErrorKind(code));
          if (code === "ai_daily_limit" || code === "ai_not_configured") {
            void qc.invalidateQueries({ queryKey: qk.assistantStatus(workspaceId) });
          }
        },
      });
    },
    [messages, mutation, onFailed, qc, workspaceId],
  );

  const reset = useCallback(() => {
    clearThread(workspaceId);
    setMessages([]);
    setError(null);
    setStreamingId(null);
    mutation.reset();
  }, [mutation, workspaceId]);

  return { messages, send, reset, pending: mutation.isPending, error, streamingId };
}
