/** True when a lazy chunk failed to load, which happens after a deploy or dev rebuild replaced the files. */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ChunkLoadError" ||
    /loading chunk [\w-]+ failed|failed to fetch dynamically imported module|importing a module script failed/i.test(error.message)
  );
}

const RELOAD_KEY = "dua.chunk-reload";
const RELOAD_WINDOW_MS = 30_000;

/** Reloads once per window so a persistent failure cannot loop. Returns whether a reload started. */
export function reloadOnceForChunkError(now: number = Date.now()): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (now - last < RELOAD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
