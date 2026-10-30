import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { installHistoryLog } from "./history-log";
import { installOverlayHistory } from "./overlay-history";
import "./styles.css";

// only for the panel at the top
installHistoryLog();
// once, before the router: its popstate listener has to come first
installOverlayHistory();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
