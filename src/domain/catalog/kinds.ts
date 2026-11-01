/** Workspace verticals. New industries register a catalog — they do not fork identity or tasks. */
export const WORKSPACE_KINDS = ["cafe", "hotel", "supply"] as const;

export type WorkspaceKind = (typeof WORKSPACE_KINDS)[number];

export function isWorkspaceKind(value: string): value is WorkspaceKind {
  return (WORKSPACE_KINDS as readonly string[]).includes(value);
}
