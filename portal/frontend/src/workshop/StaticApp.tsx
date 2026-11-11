import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Workshop from './Workshop';
import { lazy, Suspense } from 'react';
const AdvancedPage = lazy(() => import('./AdvancedPage'));

/** Hash navigation works on Pages and ordinary file servers without rewrite rules. */
export default function StaticApp() {
  return <HashRouter><Routes><Route path="/workshop" element={<Workshop />} /><Route path="/advanced/:id" element={<Suspense fallback={<p>Načítání / Loading…</p>}><AdvancedPage /></Suspense>} /><Route path="*" element={<Navigate to="/workshop" replace />} /></Routes></HashRouter>;
}
