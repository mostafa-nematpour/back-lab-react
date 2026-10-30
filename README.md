# Overlay back

The browser's back button for sheets and dialogs, in React. One rule:
**back closes the topmost thing that is open.** Not the page, never the site.

```bash
pnpm install
pnpm dev
```

## Using it

Two calls, from one file: [`src/overlay-history.ts`](src/overlay-history.ts).

```tsx
// main.tsx: once, before the router, so its popstate listener comes first
installOverlayHistory();

// in each base overlay component (sheet, dialog, ...)
function Sheet({ open, onClose }) {
  useOverlayHistory(open, onClose); // back on this sheet's entry calls onClose
  ...
}
```

`onClose` usually closes. It may instead ask first (“Discard changes?”) and
stay open; the sheet keeps its entry. Pages never touch `history.*`.

## How it works

- **One entry per overlay the user opened**, with its depth in
  `history.state.overlayDepth`. When that differs from the overlays open, the
  manager adds entries or goes back over them until the two agree.
- **Back reaches the topmost overlay first.** If it stays open, the manager
  steps forward onto its entry again with `history.go(1)`, never `pushState`.
- **No `pushState` without a tap.** Chrome marks the entry under such a push
  as one for back to skip, and a back press is not a tap. So whatever opens
  in answer to a back, or by itself, takes no entry: it rides on the one
  under it.

## Examples

| Page | What it shows |
| --- | --- |
| `/stacked` | Six deep, sheets and dialogs mixed: each back closes only the top one |
| `/ask-first` | Back asks before closing; the question takes no entry |
| `/no-tap` | An overlay opened with no tap rides on the page's entry |

The dark panel at the top shows `history.length`, `overlayDepth`, and every
`pushState` made with no tap (it should stay at 0). Use the browser's or the
phone's own back button: Chrome's skip rule does not apply to a back driven
from DevTools.

Built with React 19 and React Router 7 (`BrowserRouter`).
