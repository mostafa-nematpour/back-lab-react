import { useEffect, useState } from "react";
import { clearHistoryLog, useHistoryLog } from "../history-log";

export function HistoryPanel() {
  const { lines, pushes, noTapPushes } = useHistoryLog();
  const [length, setLength] = useState(0);
  const [depth, setDepth] = useState(0);

  // Not every history change has an event, so just look every 200 ms
  useEffect(() => {
    const timer = setInterval(() => {
      setLength(history.length);
      setDepth(history.state?.overlayDepth ?? 0);
    }, 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="panel" data-pushes={pushes} data-no-tap={noTapPushes}>
      history.length: <b>{length}</b> · overlayDepth: <b>{depth}</b> · pushState
      with no tap: <b>{noTapPushes}</b>{" "}
      <button onClick={clearHistoryLog}>clear</button>
      <ol>
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
    </aside>
  );
}
