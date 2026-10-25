import { useEffect, useRef, useState } from 'react';
import { w, type Language } from './content';

export function Timer({ minutes, lang }: { minutes: number; lang: Language }) {
  const [left, setLeft] = useState(minutes * 60); const [on, setOn] = useState(false); const end = useRef(0);
  useEffect(() => {
    if (!on) return;
    const timer = window.setInterval(() => { const remaining = Math.max(0, Math.ceil((end.current - Date.now()) / 1000)); setLeft(remaining); if (!remaining) setOn(false); }, 250);
    return () => clearInterval(timer);
  }, [on]);
  return <div className="ws-timer"><output aria-label={w('Zbývající čas', 'Time remaining')[lang]}>{Math.floor(left / 60).toString().padStart(2, '0')}:{(left % 60).toString().padStart(2, '0')}</output><button onClick={() => { if (!on) end.current = Date.now() + left * 1000; setOn(!on); }} disabled={left === 0}>{on ? w('Pauza', 'Pause')[lang] : w('Spustit čas', 'Start timer')[lang]}</button><button onClick={() => { setOn(false); setLeft(minutes * 60); }}>{w('Obnovit', 'Reset')[lang]}</button>{left === 0 && <strong role="status">{w('Čas na kontrolní bod.', 'Time for the checkpoint.')[lang]}</strong>}</div>;
}
