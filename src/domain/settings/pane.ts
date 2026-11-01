export const SETTINGS_PANES = ["root", "ai", "team", "language"] as const;

export type SettingsPane = (typeof SETTINGS_PANES)[number];

export function parseSettingsPane(raw: string | null | undefined): SettingsPane {
  const value = (raw ?? "").trim().toLowerCase();
  return (SETTINGS_PANES as readonly string[]).includes(value) ? (value as SettingsPane) : "root";
}

export function settingsQuery(pane: SettingsPane): string {
  return pane === "root" ? "view=settings" : `view=settings&pane=${pane}`;
}
