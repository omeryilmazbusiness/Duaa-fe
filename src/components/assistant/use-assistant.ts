"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  activeTab,
  canOpenTab,
  clearAllDesk,
  clearTab,
  closeTab,
  openTab,
  selectTab,
  setTabMessages,
  type ChatDesk,
} from "@/domain/assistant/desk";
import { clearDesk, loadDesk, newMessageId, saveDesk } from "@/domain/assistant/thread";
import {
  assistantErrorKind,
  toWireMessages,
  type AssistantErrorKind,
  type AssistantStatus,
  type ChatMessage,
} from "@/domain/assistant/types";
import { ApiError } from "@/infrastructure/http/errors";
import type { SessionPayload } from "@/domain/session/types";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";

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
  onFailed: (text: string, tabId: string) => void;
}

export function useAssistantChat({ workspaceId, locale, onFailed }: ChatOptions) {
  const qc = useQueryClient();
  const deskRef = useRef<ChatDesk>(emptyLoaded(workspaceId));
  const inflight = useRef(new Set<string>());
  const [desk, setDeskState] = useState<ChatDesk>(() => deskRef.current);
  const [errorByTab, setErrorByTab] = useState<Record<string, AssistantErrorKind | null>>({});
  const [streamingByTab, setStreamingByTab] = useState<Record<string, string | null>>({});
  const [pendingByTab, setPendingByTab] = useState<Record<string, boolean>>({});

  const setDesk = useCallback((next: ChatDesk | ((cur: ChatDesk) => ChatDesk)) => {
    setDeskState((cur) => {
      const resolved = typeof next === "function" ? next(cur) : next;
      deskRef.current = resolved;
      return resolved;
    });
  }, []);

  useEffect(() => {
    const loaded = loadDesk(workspaceId);
    deskRef.current = loaded;
    setDeskState(loaded);
    setErrorByTab({});
    setStreamingByTab({});
    setPendingByTab({});
    inflight.current.clear();
  }, [workspaceId]);

  useEffect(() => {
    saveDesk(workspaceId, desk);
  }, [workspaceId, desk]);

  const tab = activeTab(desk);
  const pending = !!pendingByTab[tab.id];

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      const tabId = deskRef.current.activeId;
      if (!text || inflight.current.has(tabId)) return;
      inflight.current.add(tabId);
      const userMsg: ChatMessage = { id: newMessageId(), role: "user", content: text };
      const history = [...activeTab(deskRef.current).messages, userMsg];
      setDesk((cur) => setTabMessages(cur, tabId, history));
      setErrorByTab((cur) => ({ ...cur, [tabId]: null }));
      setPendingByTab((cur) => ({ ...cur, [tabId]: true }));
      void kernel
        .chatWithAssistant(workspaceId, { messages: toWireMessages(history), locale })
        .then((res) => {
          if (!deskRef.current.tabs.some((t) => t.id === tabId)) return;
          const id = newMessageId();
          setStreamingByTab((cur) => ({ ...cur, [tabId]: id }));
          setDesk((cur) =>
            setTabMessages(cur, tabId, [...(cur.tabs.find((t) => t.id === tabId)?.messages ?? history), { id, role: "assistant", content: res.reply }]),
          );
          qc.setQueryData<AssistantStatus>(qk.assistantStatus(workspaceId), (old) =>
            old ? { ...old, usage: res.usage } : old,
          );
        })
        .catch((err: unknown) => {
          setDesk((cur) =>
            setTabMessages(
              cur,
              tabId,
              (cur.tabs.find((t) => t.id === tabId)?.messages ?? []).filter((m) => m.id !== userMsg.id),
            ),
          );
          onFailed(text, tabId);
          const code = err instanceof ApiError ? err.code : "error";
          setErrorByTab((cur) => ({ ...cur, [tabId]: assistantErrorKind(code) }));
          if (code === "ai_daily_limit" || code === "ai_not_configured") {
            void qc.invalidateQueries({ queryKey: qk.assistantStatus(workspaceId) });
          }
        })
        .finally(() => {
          inflight.current.delete(tabId);
          setPendingByTab((cur) => ({ ...cur, [tabId]: false }));
        });
    },
    [locale, onFailed, qc, setDesk, workspaceId],
  );

  const reset = useCallback(() => {
    const id = deskRef.current.activeId;
    inflight.current.delete(id);
    setDesk((cur) => clearTab(cur, id));
    setErrorByTab((cur) => ({ ...cur, [id]: null }));
    setStreamingByTab((cur) => ({ ...cur, [id]: null }));
    setPendingByTab((cur) => ({ ...cur, [id]: false }));
  }, [setDesk]);

  const clearAll = useCallback(() => {
    inflight.current.clear();
    clearDesk(workspaceId);
    const next = clearAllDesk();
    deskRef.current = next;
    setDeskState(next);
    setErrorByTab({});
    setStreamingByTab({});
    setPendingByTab({});
  }, [workspaceId]);

  const addTab = useCallback(() => {
    setDesk((cur) => (canOpenTab(cur) ? openTab(cur) : cur));
  }, [setDesk]);

  const pickTab = useCallback(
    (id: string) => {
      setDesk((cur) => selectTab(cur, id));
    },
    [setDesk],
  );

  const removeTab = useCallback(
    (id: string) => {
      inflight.current.delete(id);
      setDesk((cur) => closeTab(cur, id));
      setErrorByTab((cur) => ({ ...cur, [id]: null }));
      setStreamingByTab((cur) => ({ ...cur, [id]: null }));
      setPendingByTab((cur) => ({ ...cur, [id]: false }));
    },
    [setDesk],
  );

  return {
    desk,
    messages: tab.messages,
    activeId: tab.id,
    canAddTab: canOpenTab(desk),
    send,
    reset,
    clearAll,
    addTab,
    pickTab,
    removeTab,
    pending,
    error: errorByTab[tab.id] ?? null,
    streamingId: streamingByTab[tab.id] ?? null,
  };
}

function emptyLoaded(workspaceId: string): ChatDesk {
  return loadDesk(workspaceId);
}
