/**
 * Badge / select trigger styles for inquiry workflow states.
 * Semantics: new lead → work in progress → offer sent → closed.
 */
export function customerRequestStatusBadgeClasses(status: string): string {
  switch (status) {
    case "NEW":
      return "bg-teal-500/12 text-teal-900 ring-1 ring-teal-500/30 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-500/25"
    case "IN_PROGRESS":
      return "bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/35 dark:bg-amber-950/35 dark:text-amber-300 dark:ring-amber-500/30"
    case "OFFER_SENT":
      return "bg-violet-500/12 text-violet-900 ring-1 ring-violet-500/30 dark:bg-violet-950/45 dark:text-violet-300 dark:ring-violet-500/25"
    case "CLOSED":
      return "bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20 dark:bg-slate-900/60 dark:text-slate-400 dark:ring-slate-600/30"
    default:
      return "bg-muted text-muted-foreground ring-1 ring-border"
  }
}
