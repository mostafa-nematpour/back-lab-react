import { Link } from "react-router";

export function Home() {
  return (
    <>
      <h1>Overlay back</h1>
      <p>
        One rule: <b>back closes the topmost thing that is open</b>. Not the
        page, never the site. Every sheet and dialog makes one call,{" "}
        <code>useOverlayHistory(open, onClose)</code>, and the pages that open
        them write no history code at all.
      </p>
      <ul>
        <li>
          <Link to="/stacked">Stacked</Link>: six deep, sheets and dialogs mixed
        </li>
        <li>
          <Link to="/ask-first">Ask first</Link>: back asks before closing
        </li>
        <li>
          <Link to="/no-tap">No tap</Link>: an overlay that opens by itself
        </li>
      </ul>
      <p>
        The dark panel shows <code>history.length</code>, the current entry's{" "}
        <code>overlayDepth</code>, and every <code>pushState</code> made with no
        tap. That last number should stay at 0. Open each page from here, and
        use the browser's or the phone's own back button.
      </p>
    </>
  );
}
