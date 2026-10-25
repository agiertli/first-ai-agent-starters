import { useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Language } from './content';
import { captions, type Phase } from './diagramContent';

const phases = ['goal', 'thinking', 'tool', 'tool_executing', 'result', 'context_updated', 'thinking', 'answer'] as const;
export function AgentDiagram({ lang, phase = 'idle', toolName, chat = false, live = false }: {lang: Language; phase?: Phase; toolName?: string; chat?: boolean; live?: boolean}) {
 const marker = useId().replace(/:/g, ''); const reduced = useReducedMotion();
 const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
 const active = (...p: Phase[]) => p.includes(phase);
 const edge = (d: string, on: boolean) => <motion.path d={d} fill="none" stroke={on ? '#465bc4' : '#9aa8bf'} strokeWidth={on ? 3.5 : 1.8} markerEnd={`url(#${marker})`} strokeDasharray={on ? '9 6' : undefined} animate={on && !reduced ? {strokeDashoffset: [0,-30]} : {strokeDashoffset: 0}} transition={{duration: 1.5, repeat: on && !reduced ? Infinity : 0, ease: 'linear'}} />;
 const box = (x: number, y: number, width: number, label: string, sub: string, on: boolean) => <g className={on ? 'ws-diagram-node active' : 'ws-diagram-node'}><rect x={x} y={y} width={width} height={90} rx={12}/><text x={x+width/2} y={y+36} textAnchor="middle" className="ws-diagram-title">{label}</text><text x={x+width/2} y={y+65} textAnchor="middle" className="ws-diagram-sub">{sub}</text></g>;
 return <div className="ws-agent-diagram"><div className="ws-diagram-heading"><h3>{t('Aplikace drží smyčku pohromadě', 'The application holds the loop together')}</h3><span>{live ? t('Skutečné události běhu', 'Actual execution events') : t('Výkladové schéma', 'Teaching diagram')}</span></div><div className="ws-diagram-scroll"><svg viewBox="0 0 1000 430" role="img" aria-label={t('Člověk komunikuje s aplikací. Aplikace opakovaně volá model a provádí povolené nástroje. Výsledky ukládá do kontextu pro další volání modelu. Odpověď modelu předává člověku.', 'The person interacts with the application. The application repeatedly calls the model and executes permitted tools. It adds results to context for the next model call and delivers the model answer to the person.')}>
 <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0 0L8 4L0 8" fill="#687ab5"/></marker></defs>
 {edge('M205 200H325', active('goal'))}{edge('M325 240H205', active('answer'))}
 <text x="265" y="184" textAnchor="middle" className="ws-diagram-sub">{t('cíl', 'goal')}</text><text x="265" y="267" textAnchor="middle" className="ws-diagram-sub">{t('odpověď', 'answer')}</text>
 {edge('M615 98H780', active('thinking'))}{edge('M780 142H615', active('tool', 'answer'))}
 <text x="697" y="80" textAnchor="middle" className="ws-diagram-sub">{t('aktuální kontext', 'current context')}</text><text x="697" y="167" textAnchor="middle" className="ws-diagram-sub">{t('další krok / odpověď', 'next step / answer')}</text>
 {!chat && <>{edge('M615 295H780', active('tool_executing'))}{edge('M780 339H615', active('result'))}<text x="697" y="276" textAnchor="middle" className="ws-diagram-sub">{t('povolená operace', 'allowed operation')}</text><text x="697" y="366" textAnchor="middle" className="ws-diagram-sub">{t('data / chyba', 'data / error')}</text></>}
 {box(15,174,190,t('Člověk', 'Person'),t('cíl a hranice', 'goal and boundaries'),active('goal', 'answer'))}
 <g className={active('goal','tool','tool_executing','result','context_updated','tool_denied','error') ? 'ws-diagram-node active' : 'ws-diagram-node'}>
 <rect x="325" y="40" width="290" height="350" rx="18"/>
 <text x="470" y="79" textAnchor="middle" className="ws-diagram-title">{t('Agentní aplikace', 'Agent application')}</text>
 <text x="470" y="106" textAnchor="middle" className="ws-diagram-sub">{t('řídicí prostředí · harness', 'execution environment · harness')}</text>
 <line x1="348" y1="127" x2="592" y2="127" stroke="#ccd5e5"/>
 <text x="470" y="157" textAnchor="middle" className="ws-diagram-sub">{t('drží kontext a výsledky', 'holds context and results')}</text>
 <text x="470" y="187" textAnchor="middle" className="ws-diagram-sub">{t('kontroluje oprávnění', 'checks permissions')}</text>
 <text x="470" y="217" textAnchor="middle" className="ws-diagram-sub">{t('spouští nástroje', 'executes tools')}</text>
 <rect x="348" y="241" width="244" height="68" rx="10" fill={active('context_updated','thinking') ? '#e5e6ff' : '#f1f3f9'} />
 <text x="470" y="268" textAnchor="middle" className="ws-diagram-sub">{t('výsledek → nový kontext', 'result → updated context')}</text>
 <text x="470" y="293" textAnchor="middle" className="ws-diagram-sub">{t('↻ další volání modelu', '↻ call the model again')}</text>
 <text x="470" y="344" textAnchor="middle" className="ws-diagram-sub">{t('hlídá konec, čas a počet kroků', 'enforces stopping and run limits')}</text>
 </g>
 {box(780,75,205,t('Model', 'Model'),t('navrhuje další krok', 'proposes the next step'),active('thinking','tool','answer'))}
 {!chat && box(780,273,205,t('Nástroj', 'Tool'),toolName === 'get_weather' ? t('aktuální počasí', 'current weather') : toolName === 'read_materials' ? t('čtení podkladů', 'read materials') : t('data / výpočet / soubor', 'data / calculation / file'),active('tool_executing','result'))}
 {chat && <text x="883" y="310" textAnchor="middle" className="ws-diagram-sub">{t('Nástroje nepřipojené', 'No tools connected')}</text>}
 </svg></div><p aria-live="polite" className={`ws-diagram-caption ${phase === 'error' ? 'ws-error-text' : ''}`}>{captions[phase][lang]}</p></div>;
}
export function TeachingDiagram({lang}: {lang: Language}) {
 const [step, setStep] = useState(0); const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
 return <section><AgentDiagram lang={lang} phase={phases[step]} /><div className="ws-diagram-controls"><button disabled={step === 0} onClick={() => setStep(step-1)}>{t('Předchozí krok', 'Previous step')}</button><span>{step+1} / {phases.length}</span><button onClick={() => setStep((step+1)%phases.length)}>{step === phases.length-1 ? t('Znovu', 'Restart') : t('Další krok', 'Next step')}</button></div><div className="ws-context-note"><h3>{t('Co model právě vidí?', 'What can the model see right now?')}</h3><p>{t('Jen kontext předaný aplikací: instrukce, zadání, relevantní zprávy a výsledky nástrojů. Název souboru sám nepředá jeho obsah. Kontext má omezenou velikost; aplikace někdy starší část shrnuje nebo vybírá. Paměť mezi různými chaty je zvláštní funkce aplikace.', 'Only the context supplied by the application: instructions, task, relevant messages and tool results. A filename alone does not provide its contents. Context has limited capacity; the application may summarise or select earlier material. Memory across chats is a separate application feature.')}</p></div><div className="ws-loop-principle"><h3>{t('Vyhodnotit → provést → ověřit → pokračovat, nebo skončit', 'Assess → act → check → continue or finish')}</h3><p>{t('Agentní smyčka (reasoning–action loop) vrací výsledky do dalšího rozhodnutí. Model může změnit postup podle toho, co zjistil. Aplikace zajišťuje, aby tato rozhodnutí vůbec mohla vést k dalším krokům.', 'The reasoning–action loop feeds results into the next decision. The model can revise its approach based on what it discovers. The application enables those decisions to lead to further actions.')}</p><p>{t('Konec: odpověď, otázka člověku, nepřekonatelná chyba nebo limit. Čekání na schválení vyžaduje podporu aplikace. Více kroků samo o sobě ještě neznamená agenta: rozhodující je, kdo podle výsledku volí další krok.', 'Stop: an answer, a question for the person, an unrecoverable error or a limit. Waiting for approval needs application support. Several steps alone do not establish agency: what matters is who chooses the next step based on results.')}</p></div><p className="ws-muted">{t('Schéma ukazuje výměnu zpráv a řízení běhu, nikoli skryté myšlenky modelu ani fyzické umístění serverů. I v chatové aplikaci může běžet agent; rozhoduje její konkrétní režim a nástroje.', 'The diagram shows message exchange and execution control, not hidden model thoughts or physical server locations. A chat application may also run an agent; its mode and tools determine the behaviour.')}</p></section>;
}
