import type { Language } from './content';
import { Link, useLocation } from 'react-router-dom';

const lessons = [
  { id: 3, cs: 'Paměť: každý požadavek zvlášť', en: 'Memory: independent requests' },
  { id: 4, cs: 'Paměť: aplikace předává historii', en: 'Memory: the application supplies history' },
  { id: 5, cs: 'Kontext: limit a zkracování historie', en: 'Context: limits and compaction' },
  { id: 8, cs: 'Tool calling: výběr a spuštění nástroje', en: 'Tool calling: selection and execution' },
] as const;

/** Links only: keep the original lessons and their backend separate from the workshop. */
export function AdvancedLessons({ lang }: { lang: Language }) {
  const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
  const location = useLocation();
  const returnTo = encodeURIComponent(location.pathname + location.search);
  return <details className="ws-advanced-lessons">
    <summary>{t('Pokročilé lekce · volitelně', 'Advanced lessons · optional')}</summary>
    <p>{t(
      'Pro skupinu, která chce jít do větší hloubky. Lekce se otevřou v nové záložce; workshop zůstane na stejném snímku.',
      'For a group that wants to go deeper. Lessons open in a new tab; the workshop stays on the current slide.',
    )}</p>
    <p>{t('Živé ukázky běží přímo v prohlížeči a používají stejné uložené připojení modelu jako workshop.', 'Live demonstrations run directly in the browser and use the same saved model connection as the workshop.')}</p>
    <ul>{lessons.map(lesson => <li key={lesson.id}>
      <Link to={`/advanced/${lesson.id}?returnTo=${returnTo}`} target="_blank" rel="noopener noreferrer">
        <span>{t('Lekce', 'Lesson')} {lesson.id}</span> {lesson[lang]} <span aria-hidden="true">↗</span>
      </Link>
    </li>)}</ul>
  </details>;
}
