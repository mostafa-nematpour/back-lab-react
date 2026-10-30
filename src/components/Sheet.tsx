import type { ReactNode } from "react";
import { useOverlayHistory } from "../overlay-history";

interface Props {
  open: boolean;
  title: string;
  /** ✕, a tap outside and the back button all call this */
  onClose: () => void;
  children?: ReactNode;
}

export function Sheet({ open, title, onClose, children }: Props) {
  // the one line: while open, back on this sheet's entry calls onClose
  useOverlayHistory(open, onClose);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <section className="sheet">
        <div className="bar">
          <strong>{title}</strong>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </section>
    </>
  );
}
