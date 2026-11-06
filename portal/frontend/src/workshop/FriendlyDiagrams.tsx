import { useId, useState, type ReactNode } from 'react';
import { type Language } from './content';

// Plain-language pictures for the two teaching slides ("What an agent needs", "How an agent works").
// The live weather demo keeps using RunDiagram; these are only a gentler first look at the same ideas.

export const Icon = ({children}:{children:ReactNode}) => <svg viewBox="0 0 64 64" aria-hidden="true" className="ws-fd-icon">{children}</svg>;
export const PersonIcon = () => <Icon><circle cx="32" cy="20" r="9"/><path d="M13 54c0-13 8-20 19-20s19 7 19 20"/></Icon>;
export const PapersIcon = () => <Icon><rect x="19" y="8" width="30" height="40" rx="3"/><path d="M13 16v38a3 3 0 0 0 3 3h27M26 20h16M26 28h16M26 36h10"/></Icon>;
export const BrainIcon = () => <Icon><path d="M32 7a15 15 0 0 0-8 27.7V41h16v-6.3A15 15 0 0 0 32 7z"/><path d="M26 47h12M28 53h8M28 22l4 6 4-6"/></Icon>;
export const HandsIcon = () => <Icon><path d="M46 9a11 11 0 0 0-10 15L11 49a4 4 0 0 0 6 6l25-25a11 11 0 0 0 15-10l-7 6-6-1-1-6z"/></Icon>;
export const ManagerIcon = () => <Icon><rect x="14" y="12" width="36" height="44" rx="4"/><rect x="24" y="7" width="16" height="9" rx="2"/><path d="M23 35l6 6 12-13"/></Icon>;


export type Actor='you'|'app'|'model'|'tool';
interface Step {from:Actor;to:Actor|null;round:0|1|2;speaker:string;quote:string;caption:string}

// The application sits in the middle: you, the model and the tool only ever talk to it. The arrow shows which way one message travels.
export function AgentStage({lang,from,to,also=[],loopback=false,noTool=false,tool,model}:{lang:Language;from:Actor|null;to:Actor|null;also?:Actor[];loopback?:boolean;noTool?:boolean;tool?:string;model?:string}) {
 const t=(cs:string,en:string)=>lang==='cs'?cs:en;
 const head='ws-fd-head-'+useId().replace(/:/g,'');
 const actors:{id:Actor;x:number;y:number;w:number;h:number;name:string;sub:string}[]=[
  {id:'you',x:0,y:150,w:130,h:100,name:t('Vy','You'),sub:''},
  {id:'app',x:268,y:135,w:176,h:130,name:t('Aplikace','Application'),sub:t('Lektorský portál','Lecturer portal')},
  {id:'model',x:562,y:14,w:158,h:104,name:t('Mozek','Brain'),sub:model || 'model (AI)'},
  ...(noTool?[]:[{id:'tool' as Actor,x:562,y:282,w:158,h:104,name:t('Nástroj','Tool'),sub:tool || t('podle úkolu','as needed')}]),
 ];
 const by=Object.fromEntries(actors.map(a=>[a.id,a])) as Record<Actor,typeof actors[number]>;
 const edge=(a:Actor,b:Actor)=>{const A=by[a],B=by[b];const ax=A.x+A.w/2,ay=A.y+A.h/2,bx=B.x+B.w/2,by2=B.y+B.h/2;const clip=(P:typeof A,fx:number,fy:number,tx:number,ty:number)=>{const dx=tx-fx,dy=ty-fy;const k=Math.min(Math.abs(dx)>0?(P.w/2+6)/Math.abs(dx):Infinity,Math.abs(dy)>0?(P.h/2+6)/Math.abs(dy):Infinity);return [fx+dx*k,fy+dy*k] as const;};const [x1,y1]=clip(A,ax,ay,bx,by2);const [x2,y2]=clip(B,bx,by2,ax,ay);return {x1,y1,x2,y2};};
 const spokes:[Actor,Actor][]=[['you','app'],['app','model'],...(noTool?[]:[['app','tool'] as [Actor,Actor]])];
 const lit=(id:Actor)=>id===from||id===to||also.includes(id);
 const arrow=from&&to&&from!==to&&by[from]&&by[to]?edge(from,to):null;
 return <svg viewBox="0 0 720 400" className="ws-fd-stage" role="img" aria-label={t('Aplikace je uprostřed. Vy, mozek (model) a nástroj komunikují jen přes ni.','The application is in the middle. You, the brain (model) and the tool communicate only through it.')}>
  <defs><marker id={head} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#315bce"/></marker></defs>
  {spokes.filter(([a,b])=>!(arrow&&((a===from&&b===to)||(a===to&&b===from)))).map(([a,b])=>{const e=edge(a,b);return <line key={a+b} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="ws-fd-spoke"/>;})}
  {arrow&&<line x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2} className="ws-fd-active-spoke" markerEnd={`url(#${head})`}/>}
  {actors.map(a=><g key={a.id} className={`ws-fd-actor actor-${a.id}${lit(a.id)?' is-lit':''}`}><rect x={a.x} y={a.y} width={a.w} height={a.h} rx="14"/><text x={a.x+a.w/2} y={a.y+a.h/2+(a.sub?-2:8)} textAnchor="middle" className="ws-fd-actor-name">{a.name}</text>{a.sub&&<text x={a.x+a.w/2} y={a.y+a.h/2+24} textAnchor="middle" className="ws-fd-actor-sub" aria-label={a.sub}><title>{a.sub}</title>{a.sub.length>16?a.sub.slice(0,15)+'…':a.sub}</text>}</g>)}
  {loopback&&<g className="ws-fd-loopback"><path d="M318 135 C 318 60, 420 60, 435 120" fill="none" markerEnd={`url(#${head})`}/></g>}
  <text x="356" y="300" textAnchor="middle" className="ws-fd-hub-note">{t('Všechno vede přes aplikaci','Everything goes through the application')}</text>
 </svg>;
}

export function LoopStory({lang}:{lang:Language}) {
 const t=(cs:string,en:string)=>lang==='cs'?cs:en;
 const [step,setStep]=useState(0);
 const steps:Step[]=[
  {from:'you',to:'app',round:0,speaker:t('Vy','You'),quote:t('„Mám dnes jít na procházku v Řevnicích?“','“Should I go for a walk in Řevnice today?”'),caption:t('Řeknete aplikaci, co chcete. Aplikace k tomu přidá pokyny, podklady a seznam nástrojů, které smí použít.','You tell the application what you want. It adds instructions, papers and the list of tools it may use.')},
  {from:'app',to:'model',round:1,speaker:t('Aplikace','Application'),quote:t('„Uživatel se ptá na procházku. Tady jsou pokyny a nástroje. Co dál?“','“The user asks about a walk. Here are the instructions and tools. What next?”'),caption:t('Aplikace se zeptá mozku (modelu), co dál. Mozek vidí jen to, co mu aplikace předá.','The application asks the brain (the model) what to do next. The brain sees only what the application hands over.')},
  {from:'model',to:'app',round:1,speaker:t('Mozek (model)','Brain (model)'),quote:t('„Potřebuji počasí pro Řevnice. Prosím, použij nástroj na počasí.“','“I need the weather for Řevnice. Please use the weather tool.”'),caption:t('Mozek nic neprovede. Jen požádá o nástroj. Je to návrh, ne čin.','The brain does not do anything. It only asks for a tool. This is a suggestion, not an action.')},
  {from:'app',to:'tool',round:1,speaker:t('Aplikace','Application'),quote:t('„Čtení počasí je povolené. Spouštím nástroj.“','“Reading the weather is allowed. Running the tool.”'),caption:t('Aplikace zkontroluje, jestli to smí, a teprve potom nástroj sama spustí.','The application checks that this is allowed and only then runs the tool itself.')},
  {from:'tool',to:'app',round:1,speaker:t('Nástroj (ukázka)','Tool (example)'),quote:t('„Dnes 14 °C, od 16:00 déšť.“','“Today 14 °C, rain from 4 pm.”'),caption:t('Nástroj vrátí data, nebo chybu. Je to zatím jen surový výsledek, ještě ne odpověď pro vás.','The tool returns data, or an error. This is only a raw result, not yet an answer for you.')},
  {from:'app',to:null,round:1,speaker:t('Aplikace','Application'),quote:t('„Přidávám výsledek k podkladům. Ještě mám čas i kroky.“','“Adding the result to the papers. I still have time and steps left.”'),caption:t('Aplikace přidá výsledek k podkladům a hlídá počet kroků a čas. Odtud se smyčka vrací zpět k mozku.','The application adds the result to the papers and watches the number of steps and the time. From here the loop goes back to the brain.')},
  {from:'app',to:'model',round:2,speaker:t('Aplikace','Application'),quote:t('„Tady je počasí. Co dál?“','“Here is the weather. What next?”'),caption:t('Mozek se rozhoduje znovu, tentokrát už s novými informacemi. To je smyčka.','The brain decides again, this time with new information. That is the loop.')},
  {from:'app',to:'you',round:2,speaker:t('Odpověď pro vás','Your answer'),quote:t('„Jděte před 16:00, pak začne pršet.“','“Go before 4 pm, then it starts to rain.”'),caption:t('Mozek napíše odpověď a aplikace ji předá vám. Hotovo ještě neznamená správně: ověřte zdroj, místo a čas.','The brain writes the answer and the application hands it to you. Finished does not mean correct: check source, place and time.')},
 ];
 const s=steps[step];
 const roundLabel=s.round===0?t('Zadání','The request'):t(`Kolo ${s.round} ze 2`,`Round ${s.round} of 2`);
 return <div className="ws-fd-loop">
  <AgentStage lang={lang} from={s.from} to={s.to} loopback={s.to===null} tool="get_weather"/>
  <div className="ws-fd-panel">
   <div className="ws-fd-meta"><span>{step+1} / {steps.length}</span><span className="ws-fd-round">{roundLabel}</span></div>
   <blockquote className={`ws-fd-quote speaker-${s.from}`}><cite>{s.speaker}</cite>{s.quote}</blockquote>
   <p aria-live="polite">{s.caption}</p>
   <div className="ws-fd-buttons"><button disabled={step===0} onClick={()=>setStep(step-1)}>{t('Předchozí krok','Previous step')}</button><button onClick={()=>setStep((step+1)%steps.length)}>{step===steps.length-1?t('Znovu','Restart'):t('Další krok','Next step')}</button></div>
  </div>
 </div>;
}

export function ContextDesk({lang}:{lang:Language}) {
 const t=(cs:string,en:string)=>lang==='cs'?cs:en;
 const pieces:[ReactNode,string][]=[[<ManagerIcon key="icon"/>,t('Instrukce','Instructions')],[<PersonIcon key="icon"/>,t('Zadání','Task')],[<PapersIcon key="icon"/>,t('Načtené podklady','Retrieved sources')],[<HandsIcon key="icon"/>,t('Výsledky nástrojů','Tool results')]];
 return <div className="ws-fd-context">
  <div className="ws-fd-desk">
   <h2>{t('Stůl asistenta','The assistant’s desk')}<small>{t('Místo na něm je omezené.','Space on it is limited.')}</small></h2>
   <div className="ws-fd-desk-top">{pieces.map(([icon,label])=><div className="ws-fd-sheet" key={label}>{icon}<span>{label}</span></div>)}</div>
  </div>
  <div className="ws-fd-compare">
   <article className="ws-fd-case is-missing">
    <h3>{t('Pouhé zmínění','Mentioning it')}</h3>
    <div className="ws-fd-bubble">{t('„Shrň nabídku.pdf“','“Summarise proposal.pdf”')}</div>
    <div className="ws-fd-file ghost"><PapersIcon/><span><strong>✕ {t('obsah na stole chybí','not on the desk')}</strong><small>{t('Aplikace má jen název.','The app has only the name.')}</small></span></div>
    <p>{t('Soubor z vašeho počítače se tím nezpřístupní.','This does not give access to a file on your computer.')}</p>
   </article>
   <article className="ws-fd-case is-given">
    <h3>{t('Zpřístupnění obsahu','Providing access')}</h3>
    <div className="ws-fd-bubble">{t('Přiložený soubor nebo povolený nástroj','An attached file or a permitted tool')}</div>
    <div className="ws-fd-file"><PapersIcon/><span><strong>✓ {t('obsah leží na stole','on the desk')}</strong><small>{t('Model ho může přečíst.','The model can read it.')}</small></span></div>
    <p>{t('Ověřte, že ho aplikace opravdu přečetla.','Check that the app really read it.')}</p>
   </article>
  </div>
 </div>;
}
