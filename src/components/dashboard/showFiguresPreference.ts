// Remembers whether a user wants the dashboard's headline figures shown.
// Kept per user so the choice doesn't leak between people sharing a computer;
// hidden by default so figures only appear when someone opts in.
const storageKey = (userId: string | number | undefined) =>
  `proserp_dashboard_show_figures_${userId ?? 'anonymous'}`;

export function readShowFigures(userId: string | number | undefined): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(storageKey(userId)) === '1';
  } catch {
    // Storage can be blocked (private mode, policy); fall back to hidden.
    return false;
  }
}

export function writeShowFigures(
  userId: string | number | undefined,
  show: boolean
) {
  try {
    window.localStorage.setItem(storageKey(userId), show ? '1' : '0');
  } catch {
    // Not persisted, but the switch still works for this visit.
  }
}
