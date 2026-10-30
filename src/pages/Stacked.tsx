import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { Sheet } from "../components/Sheet";

// No history code here: each Sheet and Dialog holds its own entry.

// Six levels, sheets and dialogs mixed, each opening the next;
// level i is open while more than i are
const levels = [Sheet, Sheet, Dialog, Sheet, Dialog, Dialog];

export function Stacked() {
  const [depth, setDepth] = useState(0);

  return (
    <>
      <h1>Stacked: six deep</h1>
      <ol>
        <li>Open level 1, then the next one on each, up to 6: overlayDepth goes 1 to 6.</li>
        <li>Press back: only the top one closes, sheet or dialog alike.</li>
        <li>Close one with ✕ instead: its entry is given up, no dead entry left.</li>
        <li>“Close all” on the top one gives all six entries up in one go.</li>
      </ol>
      <button onClick={() => setDepth(1)}>Open level 1</button>

      {levels.map((Level, i) => (
        <Level
          key={i}
          open={depth > i}
          title={`Level ${i + 1} of ${levels.length}`}
          onClose={() => setDepth(i)}
        >
          <p>
            A {Level === Sheet ? "sheet" : "dialog"}, over {i} more.
          </p>
          {i < levels.length - 1 ? (
            <button onClick={() => setDepth(i + 2)}>Open level {i + 2}</button>
          ) : (
            <button onClick={() => setDepth(0)}>Close all</button>
          )}
        </Level>
      ))}
    </>
  );
}
