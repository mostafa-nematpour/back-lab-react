import { useSyncExternalStore } from "react";

// Only for the panel at the top: writes every pushState and popstate down, and
// counts pushes with no tap or key since the history last changed (the ones
// Chrome punishes). Nothing here is needed to use overlay-history.ts.

let log = { lines: [] as string[], pushes: 0, noTapPushes: 0 };
const listeners = new Set<() => void>();

function write(line: string, push?: { tapped: boolean }) {
  const time = new Date().toLocaleTimeString();
  log = {
    lines: [`${time}  ${line}`, ...log.lines].slice(0, 6),
    pushes: log.pushes + (push ? 1 : 0),
    noTapPushes: log.noTapPushes + (push && !push.tapped ? 1 : 0),
  };
  listeners.forEach((listener) => listener());
}

export function clearHistoryLog() {
  log = { lines: [], pushes: 0, noTapPushes: 0 };
  listeners.forEach((listener) => listener());
}

/** Install before installOverlayHistory, so this hears every popstate first. */
export function installHistoryLog() {
  let tapped = false;
  for (const type of ["pointerdown", "keydown"]) {
    window.addEventListener(type, () => (tapped = true), { capture: true });
  }

  const pushState = history.pushState.bind(history);
  history.pushState = (...args: Parameters<History["pushState"]>) => {
    write(tapped ? "pushState" : "pushState with no tap ⚠ Chrome may skip the entry below", { tapped });
    tapped = false;
    pushState(...args);
  };

  window.addEventListener(
    "popstate",
    () => {
      tapped = false;
      write("popstate (back or forward)");
    },
    { capture: true },
  );
}

export function useHistoryLog() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => log,
  );
}
