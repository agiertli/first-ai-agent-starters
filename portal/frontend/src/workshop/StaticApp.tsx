import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Workshop from './Workshop';

/** Hash navigation works on Pages and ordinary file servers without rewrite rules. */
export default function StaticApp() {
  return <HashRouter><Routes><Route path="/workshop" element={<Workshop />} /><Route path="*" element={<Navigate to="/workshop" replace />} /></Routes></HashRouter>;
}
