import { useEffect, useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";

/**
 * One owner for the browser's history, for everything that opens over a page:
 * bottom sheets, dialogs, side sheets. A port of the Vue `useOverlayHistory`.
 *
 * An overlay only says whether it is open and what back does to it
 * (`useOverlayHistory(open, onBack)`). This file is the only one that adds
 * entries or moves through them:
 *
 * - Each overlay the user opened has one entry, and each entry carries its
 *   depth in `history.state.overlayDepth`. Whenever the depth differs from
 *   the overlays holding an entry, entries are added or gone back over until
 *   the two agree.
 * - Back on an overlay's entry calls its `onBack`. If it stays open (to ask
 *   first, say), the entry is stepped forward onto again: `history.go(1)`,
 *   never a new `pushState`.
 * - Nothing is added without a tap or key since the history last changed:
 *   Chrome marks the entry under such a push as one for back to skip, and a
 *   back press is not a tap. An overlay opened with no tap (in answer to a
 *   back, on load, after a timer) takes no entry: it rides on the one under
 *   it, and back still reaches it first. Riding on the page's own entry, a
 *   back off the page is turned down and closes it instead.
 * - A back over the entry of an overlay already closed (the app closing one
 *   and calling `navigate(-1)` in the same handler) goes on to what is on
 *   screen: the topmost open overlay, or the page.
 * - Moves between one page's own entries never reach the router: their
 *   popstate is stopped here. Install before the router, so this listener
 *   runs first.
 */

const DEPTH_KEY = "overlayDepth";
/** How long to wait for the popstate of our own `history.go()` */
const MOVE_TIMEOUT = 500;

interface Overlay {
  onBack: () => void;
  /** opened by a tap: it has an entry of its own */
  holdsEntry: boolean;
  /** unmounted while open, maybe coming back as another component */
  gap?: boolean;
}

/** open overlays, bottom first */
let overlays: Overlay[] = [];
/** a tap or key since the history last changed */
let activated = false;
/** inside a back's onBack: what opens now rides along */
let answeringBack = false;
/** our own `history.go()` calls whose popstate has not come yet */
let moving = 0;
let moveTimer: ReturnType<typeof setTimeout> | undefined;
/** overlay entries known to be still there, ahead of the current one */
let ahead = 0;
let reconcileQueued = false;

/** the entry we are on, as of the last change we saw */
let current = { href: "", index: undefined as number | undefined, depth: 0 };

type State = Record<string, unknown> | null;

const depthOf = (state: State) => Number(state?.[DEPTH_KEY] ?? 0);
// the router's own position, if it keeps one (React Router: idx)
const indexOf = (state: State) => {
  const index = state?.idx ?? state?.position;
  return typeof index === "number" ? index : undefined;
};

function remember() {
  const state = history.state as State;
  current = { href: location.href, index: indexOf(state), depth: depthOf(state) };
}

const held = () => overlays.filter((o) => o.holdsEntry).length;
const openOverlays = () => overlays.filter((o) => !o.gap);

/** `history.go(steps)`, as one of ours */
function move(steps: number) {
  moving++;
  clearTimeout(moveTimer);
  // a move that cannot be made never gets its popstate
  moveTimer = setTimeout(() => {
    moving = 0;
    scheduleReconcile();
  }, MOVE_TIMEOUT);
  history.go(steps);
}

/** Back reaches the topmost overlay: let it answer, and render that now. */
function answer(overlay: Overlay) {
  answeringBack = true;
  try {
    flushSync(() => overlay.onBack());
  } finally {
    answeringBack = false;
  }
}

function reconcile() {
  reconcileQueued = false;
  // after our move lands
  if (moving > 0) return;
  overlays = overlays.filter((o) => !o.gap);

  const depth = depthOf(history.state);
  const want = held();
  if (want > depth && ahead > 0) {
    // the entries are still there from a back: step onto them
    const steps = Math.min(want - depth, ahead);
    ahead -= steps;
    move(steps);
  } else if (want > depth) {
    for (let d = depth + 1; d <= want; d++) {
      history.pushState({ ...history.state, [DEPTH_KEY]: d }, "");
    }
  } else if (want < depth) {
    // closed: go back over their entries, which stay ahead for reuse
    ahead += depth - want;
    move(want - depth);
  }
}

// A moment later, so an overlay closing and one opening in the same update
// share the entry, and a navigation started alongside lands first.
function scheduleReconcile() {
  if (reconcileQueued) return;
  reconcileQueued = true;
  setTimeout(reconcile);
}

function onPopState(event: PopStateEvent) {
  const from = current;
  remember();
  activated = false;

  if (moving > 0) {
    // our own move: nobody else needs to hear of it
    moving--;
    clearTimeout(moveTimer);
    event.stopImmediatePropagation();
    scheduleReconcile();
    return;
  }

  const top = openOverlays().at(-1);
  // overlay entries copy the page's state, so they share its router position
  const samePage =
    from.index !== undefined && current.index !== undefined
      ? from.index === current.index
      : from.href === current.href;

  if (!samePage) {
    // Off the page. With an overlay riding on the page's own entry, turn the
    // navigation down: the router never hears of it, the overlay gets the
    // back, and we step back onto the page.
    if (top && from.depth === 0) {
      event.stopImmediatePropagation();
      const steps =
        from.index !== undefined && current.index !== undefined
          ? current.index - from.index
          : -1;
      answer(top);
      move(-steps);
      return;
    }
    // a real navigation, for the router; what was ahead is unknown now
    ahead = 0;
    scheduleReconcile();
    return;
  }

  // Between two entries of the router's own? Not ours to stop.
  if (from.depth === 0 && current.depth === 0) return;

  // Between this page's own entries: the router has nothing to do.
  event.stopImmediatePropagation();
  if (current.depth < from.depth) {
    ahead += from.depth - current.depth;
    if (!top) {
      // Nothing open: the entry left was one of an overlay already closed
      // (closing as the app went back, say). That back was meant for the
      // page, so it goes on to the router.
      ahead = 0;
      history.go(-current.depth - 1);
      return;
    }
    answer(top);
  } else {
    ahead = Math.max(0, ahead - (current.depth - from.depth));
  }
  scheduleReconcile();
}

/**
 * Starts the manager: once, before the router is created, so its popstate
 * listener comes first.
 */
export function installOverlayHistory() {
  if (typeof window === "undefined" || current.href) return;

  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  // any new entry, ours or the router's, spends the tap and drops what was ahead
  history.pushState = (...args: Parameters<History["pushState"]>) => {
    activated = false;
    ahead = 0;
    push(...args);
    remember();
  };
  // a replace keeps the entry, so it keeps the entry's depth too
  history.replaceState = (state: unknown, ...rest: [string, (string | URL | null)?]) => {
    const depth = depthOf(history.state);
    const keep = depth > 0 && typeof state === "object" && depthOf(state as State) === 0;
    replace(keep ? { ...(state as object), [DEPTH_KEY]: depth } : state, ...rest);
    remember();
  };

  window.addEventListener("popstate", onPopState, { capture: true });
  for (const type of ["pointerdown", "pointerup", "touchend", "keydown"]) {
    window.addEventListener(type, () => (activated = true), { capture: true, passive: true });
  }

  remember();
  // entries left behind by a reload with something open
  scheduleReconcile();
}

function add(onBack: () => void): Overlay {
  // in the place of one unmounted in this same update, with its entry or not
  const gap = overlays.findIndex((o) => o.gap);
  const overlay: Overlay = {
    onBack,
    holdsEntry: gap >= 0 ? overlays[gap].holdsEntry : activated && !answeringBack,
  };
  if (gap >= 0) overlays[gap] = overlay;
  else overlays.push(overlay);
  scheduleReconcile();
  return overlay;
}

function remove(overlay: Overlay, unmounted: boolean) {
  const index = overlays.indexOf(overlay);
  if (index < 0) return;
  if (unmounted) overlays[index] = { ...overlay, gap: true };
  else overlays.splice(index, 1);
  scheduleReconcile();
}

/**
 * Gives an overlay its entry in the history while `open` is true. `onBack` is
 * the back button on that entry: usually it closes the overlay; it may instead
 * ask first and stay open, and its entry is then kept.
 */
export function useOverlayHistory(open: boolean, onBack: () => void) {
  // the latest onBack, without registering again on every render
  const latest = useRef(onBack);
  useLayoutEffect(() => {
    latest.current = onBack;
  });

  // tells an unmount (maybe coming back as another component) from a close
  const unmounting = useRef(false);
  useEffect(() => {
    unmounting.current = false;
    return () => {
      unmounting.current = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const overlay = add(() => latest.current());
    return () => remove(overlay, unmounting.current);
  }, [open]);
}
