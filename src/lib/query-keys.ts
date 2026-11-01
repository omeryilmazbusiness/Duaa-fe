export const qk = {
  me: ["session", "me"] as const,
  staff: (wid: string) => ["staff", wid] as const,
  managers: (wid: string) => ["managers", wid] as const,
  tasks: (wid: string) => ["tasks", wid] as const,
  routines: (wid: string) => ["routines", wid] as const,
  brief: (wid: string) => ["brief", wid] as const,
  portal: (wid: string) => ["portal-tasks", wid] as const,
  reports: (wid: string) => ["reports", wid] as const,
  dashboard: (wid: string) => ["dashboard", wid] as const,
  assistantStatus: (wid: string) => ["assistant", "status", wid] as const,
  assistantModels: (wid: string) => ["assistant", "models", wid] as const,
  assistantSettings: (wid: string) => ["assistant", "settings", wid] as const,
};
