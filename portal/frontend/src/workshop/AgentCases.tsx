import { useState } from 'react';
import { starters, type Language } from './content';

export function AgentCases({lang}: {lang: Language}) {
  const [selected, setSelected] = useState(0);
  const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
  const example = starters[selected];
  return <section className="ws-agent-cases">
    <h2>{t('Tři cíle, u kterých agent rozhoduje', 'Three goals that require agent decisions')}</h2>
    <p>{t('Samotné napsání textu tuto hranici neukazuje. Hledejte volbu dalšího kroku podle výsledku nástroje — v předem určených mezích.', 'Generating text alone does not show this boundary. Look for the next step being chosen from a tool result, within agreed limits.')}</p>
    <div className="ws-case-tabs">{starters.map((s,i)=><button key={s.id} aria-pressed={i===selected} onClick={()=>setSelected(i)}><strong>{s.title[lang]}</strong><span>{s.subtitle[lang]}</span></button>)}</div>
    <div className="ws-case-detail"><p className="ws-case-goal">{example[lang].goal}</p>
      <div className="ws-case-branch" aria-label={t('Možný průběh, nikoli záznam běhu', 'Possible flow, not an execution record')}>
        <div>{example.branch[lang][0]}</div><span aria-hidden="true">↓</span><div>{example.branch[lang][1]}</div><span aria-hidden="true">↓</span><div className="ws-case-decision">{example.branch[lang][2]}</div><div className="ws-case-outcomes"><div><span aria-hidden="true">↶</span>{example.branch[lang][3]}</div><div><span aria-hidden="true">↓</span>{example.branch[lang][4]}</div></div>
      </div>
      <dl className="ws-case-facts"><div><dt>{t('Rozhoduje samostatně', 'Decides independently')}</dt><dd>{example.autonomy[lang]}</dd></div><div><dt>{t('Potřebuje skutečné nástroje', 'Needs actual tools')}</dt><dd>{example.tools[lang]}</dd></div><div><dt>{t('Předává rozhodnutí člověku', 'Hands the decision to a person')}</dt><dd>{example.stop[lang]}</dd></div></dl>
      <p className="ws-case-proof"><strong>{t('Jak ukázat změnu rozhodnutí:', 'How to demonstrate a changed decision:')}</strong> {example.proof[lang]}</p>
      <p className="ws-muted">{t('Schéma možností, ne záznam skutečného běhu. Skill může tento postup popsat; autonomii ukáže až konkrétní běh aplikace s nástroji. Automatické plánování v čase je další schopnost, nikoli podmínka agentnosti.', 'A diagram of possibilities, not a recording. A skill can describe this procedure; autonomy is demonstrated by actual execution with tools. Scheduled execution is a separate capability, not a requirement for an agent.')}</p>
    </div>
  </section>;
}
