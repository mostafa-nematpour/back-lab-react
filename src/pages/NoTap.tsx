import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Sheet } from "../components/Sheet";

// No history code here: a sheet that opens by itself once the URL asks for
// it. Nobody tapped for it, so it rides on the page's entry.
export function NoTap() {
  const [params] = useSearchParams();
  const welcome = params.has("welcome");
  const [welcomeOpen, setWelcomeOpen] = useState(welcome);
  useEffect(() => setWelcomeOpen(welcome), [welcome]);

  return (
    <>
      <h1>No tap: an overlay that opens by itself</h1>
      <ol>
        <li>
          <Link to="/no-tap?welcome">Open with a welcome sheet</Link>: it opens
          after the navigation, with no tap of its own and no entry.
        </li>
        <li>Press back: the sheet closes and you stay on the page.</li>
      </ol>

      <Sheet open={welcomeOpen} title="Welcome" onClose={() => setWelcomeOpen(false)}>
        <p>This opened by itself, with no tap: it rides on the page's entry.</p>
      </Sheet>
    </>
  );
}
