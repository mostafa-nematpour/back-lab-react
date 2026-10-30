import { Link, Route, Routes } from "react-router";
import { HistoryPanel } from "./components/HistoryPanel";
import { AskFirst } from "./pages/AskFirst";
import { Home } from "./pages/Home";
import { NoTap } from "./pages/NoTap";
import { Stacked } from "./pages/Stacked";

export function App() {
  return (
    <>
      <header className="top">
        <Link to="/">
          <b>Overlay back</b>
        </Link>
        <nav>
          <Link to="/stacked">Stacked</Link>
          <Link to="/ask-first">Ask first</Link>
          <Link to="/no-tap">No tap</Link>
        </nav>
      </header>
      <main>
        <HistoryPanel />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stacked" element={<Stacked />} />
          <Route path="/ask-first" element={<AskFirst />} />
          <Route path="/no-tap" element={<NoTap />} />
        </Routes>
      </main>
    </>
  );
}
