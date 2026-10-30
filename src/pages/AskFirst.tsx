import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { Sheet } from "../components/Sheet";

// No history code here: back does what ✕ does, and ✕ asks while there are
// changes. The question opens in answer to a back, so it takes no entry.
export function AskFirst() {
  const [editOpen, setEditOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [text, setText] = useState("");

  function closeEditor() {
    if (text) setAskOpen(true);
    else setEditOpen(false);
  }

  function discard() {
    setAskOpen(false);
    setEditOpen(false);
    setText("");
  }

  return (
    <>
      <h1>Ask first: back asks before closing</h1>
      <ol>
        <li>Open the editor, type something, press back.</li>
        <li>The question opens with no entry of its own: no pushState in the log.</li>
        <li>Back again closes the question. “Discard” closes both.</li>
      </ol>
      <button onClick={() => setEditOpen(true)}>Edit address</button>

      <Sheet open={editOpen} title="Edit address" onClose={closeEditor}>
        <p>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type something" />
        </p>
      </Sheet>
      <Dialog open={askOpen} title="Discard changes?" onClose={() => setAskOpen(false)}>
        <button onClick={() => setAskOpen(false)}>Keep editing</button>
        <button onClick={discard}>Discard</button>
      </Dialog>
    </>
  );
}
