import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SettingsPanel } from '../components/SettingsPanel';
import { type Language } from './content';
import { slides, programme } from './presentationContent';
import { SlideContent } from './SlideContent';
import { Practice } from './Practice';
import { practiceSteps, type PracticeStep } from './practiceContent';
import { WeatherLab } from './LiveLab';
import { PresentationDemo } from './PresentationDemo';
import { BrowserConnectionPanel } from './BrowserConnectionPanel';
import { browserRuntime, publicAsset } from './runtime';
import './workshop.css';
import './presentation.css';

type Overlay = 'lecturer' | 'notes' | 'connection' | 'share' | 'weather' | 'presentation' | null;
export default function Workshop(){
 const [lang,setLang]=useState<Language>(()=>{try{return localStorage.getItem('first-agent-language')==='en'?'en':'cs';}catch{return 'cs';}});
 const [search,setSearch]=useSearchParams();
 const isPractice=search.get('view')==='exercises';
 const requestedSlide=slides.findIndex(s=>s.id===search.get('slide'));
 const requestedChapter=Number(search.get('chapter')||1);
 const slideIndex=requestedSlide>=0?requestedSlide:Math.max(0,slides.findIndex(s=>s.chapter===requestedChapter));
 const slide=slides[slideIndex];
 const step=practiceSteps.find(p=>p.id===search.get('exercise'))?.id||'brief';
 const [overlay,setOverlay]=useState<Overlay>(null);
 const [shareStatus,setShareStatus]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 const returnFocus=useRef<HTMLElement|null>(null);
 const [returnToDemo,setReturnToDemo]=useState(false);
 const main=useRef<HTMLElement>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 const t=(cs:string,en:string)=>lang==='cs'?cs:en;
 const exerciseUrl=new URL(window.location.href);exerciseUrl.hash='/workshop?view=exercises';
 const navigate=useCallback((i:number)=>{const next=slides[Math.max(0,Math.min(slides.length-1,i))];setSearch({slide:next.id,chapter:String(next.chapter)});},[setSearch]);
 function practice(next:PracticeStep){setSearch({slide:slide.id,chapter:String(slide.chapter),view:'exercises',exercise:next});main.current?.scrollTo({top:0});}
 function present(){navigate(slideIndex);}
 function open(next:Overlay){if(!dialog.current?.open)returnFocus.current=document.activeElement as HTMLElement;setOverlay(next);}
 function close(){if(overlay==='connection'&&returnToDemo){setReturnToDemo(false);setOverlay('weather');return;}dialog.current?.close();setOverlay(null);returnFocus.current?.focus();}
 useEffect(()=>{if(overlay&&!dialog.current?.open)dialog.current?.showModal();},[overlay]);
 useEffect(()=>{document.documentElement.lang=lang;try{localStorage.setItem('first-agent-language',lang);}catch{/* Optional preference. */}return()=>{document.documentElement.lang='en';};},[lang]);
 useEffect(()=>{const handler=()=>{setReturnToDemo(overlay==='weather');returnFocus.current=document.activeElement as HTMLElement;setOverlay('connection');};window.addEventListener('first-agent-open-connection',handler);return()=>window.removeEventListener('first-agent-open-connection',handler);},[overlay]);
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(isPractice||dialog.current?.open||document.querySelector('dialog[open]')||event.altKey||event.metaKey||event.ctrlKey)return;const target=event.target as HTMLElement;if(target.closest('input,textarea,select,[contenteditable]'))return;if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();navigate(slideIndex+1);}if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();navigate(slideIndex-1);}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[isPractice,navigate,slideIndex]);
 useEffect(()=>{main.current?.scrollTo({top:0});},[slideIndex,isPractice,step]);
 const title=overlay==='weather'?t('Počasí v Řevnicích','Weather in Řevnice'):overlay==='presentation'?t('Tvorba prezentačního skillu','Creating a presentation skill'):overlay==='connection'?t('Připojení modelu','Model connection'):overlay==='notes'?t('Poznámky pro lektory','Facilitator notes'):overlay==='share'?t('Sdílet cvičení','Share exercises'):t('Lektorské nástroje','Facilitator tools');
 return <div className="ws-shell ws-deck-shell">
 <a href="#workshop-main" className="ws-skip" onClick={e=>{e.preventDefault();main.current?.focus();}}>{t('Přejít k obsahu','Skip to content')}</a>
 <header className="ws-deck-header"><Link to="/workshop" className="ws-brand"><span aria-hidden="true">✳</span>Dny AI</Link><nav aria-label={t('Hlavní navigace','Main navigation')} className="ws-main-tabs"><button aria-current={!isPractice?'page':undefined} onClick={present}>{t('Prezentace','Presentation')}</button><button aria-current={isPractice?'page':undefined} onClick={()=>practice(step)}>{t('Cvičení','Exercises')}</button></nav><div className="ws-deck-tools"><div className="ws-language" aria-label={t('Jazyk','Language')}><button aria-pressed={lang==='cs'} onClick={()=>setLang('cs')}>Česky</button><button aria-pressed={lang==='en'} onClick={()=>setLang('en')}>English</button></div><button onClick={()=>open('lecturer')}>{t('Lektor','Facilitator')}</button></div></header>
 <main id="workshop-main" ref={main} className={`ws-deck-main ${isPractice?'practice-mode':''}`} tabIndex={-1}>
 <section className="ws-slide" hidden={isPractice} aria-labelledby="slide-title" key={slide.id}><header><h1 ref={heading} id="slide-title">{slide.title[lang]}</h1><p className="ws-slide-lead">{slide.lead[lang]}</p></header><div className={`ws-slide-body slide-${slide.id}`}><SlideContent slide={slide} lang={lang} onDemo={open} onPractice={practice}/></div></section>
 {isPractice&&<><nav className="ws-practice-nav" aria-label={t('Cvičení','Exercises')}>{practiceSteps.map(p=><button key={p.id} aria-current={step===p.id?'step':undefined} onClick={()=>practice(p.id)}>{p.title[lang]}</button>)}<button className="ws-share-inline" onClick={()=>open('share')}>{t('Sdílet odkaz','Share link')} ↗</button></nav><Practice key={`${step}-${lang}`} lang={lang} step={step} onStep={practice}/></>}
 </main>
 {!isPractice&&<footer className="ws-deck-footer"><label>{t('Program','Programme')}<select aria-label={t('Přejít na část programu','Jump to a programme section')} value={slide.chapter} onChange={e=>navigate(slides.findIndex(s=>s.chapter===Number(e.target.value)))}>{programme.map((p,i)=><option key={i} value={i+1}>{i+1}. {p.title[lang]} · {p.minutes} min</option>)}</select></label><div className="ws-slide-pagination"><button disabled={slideIndex===0} onClick={()=>navigate(slideIndex-1)} aria-label={t('Předchozí snímek','Previous slide')}>←</button><span aria-label={t('Číslo snímku','Slide number')}>{slideIndex+1} / {slides.length}</span><button disabled={slideIndex===slides.length-1} onClick={()=>navigate(slideIndex+1)} aria-label={t('Další snímek','Next slide')}>→</button></div></footer>}
 <dialog ref={dialog} className={`ws-overlay ${overlay==='weather'||overlay==='presentation'?'ws-demo-overlay':''} ${overlay==='weather'?'weather-overlay':''}`} aria-labelledby="overlay-title" onCancel={e=>{e.preventDefault();close();}} onClose={()=>{setOverlay(null);returnFocus.current?.focus();}}><header className="ws-overlay-header"><h2 id="overlay-title">{title}</h2><button onClick={close}>{overlay==='connection'&&returnToDemo?t('Zpět k ukázce','Back to demo'):t('Zavřít','Close')} ×</button></header><div className="ws-overlay-body">
 {/* Keep the live demo mounted while opening connection settings; closing never fakes or resets a run. */}
 <div hidden={overlay!=='weather'}><WeatherLab lang={lang} onRecord={()=>{}} stage/></div>
 {overlay==='presentation'&&<PresentationDemo lang={lang}/>}
 {overlay==='connection'&&(browserRuntime?<BrowserConnectionPanel lang={lang}/>:<div className="ws-local-settings"><SettingsPanel open onClose={close}/></div>)}
 {overlay==='notes'&&<><p className="ws-projection-note">{t('Toto okno je vidět i na projektoru.','This window is also visible on the projector.')}</p><h3>{slide.title[lang]}</h3><p className="ws-notes-text">{slide.notes[lang]}</p><a href={publicAsset(`runbook/facilitator-${lang}.pdf`)} download>{t('Stáhnout lektorský tahák (A4)','Download facilitator guide (A4)')}</a></>}
 {overlay==='lecturer'&&<div className="ws-lecturer-menu"><button onClick={()=>open('notes')}>{t('Poznámky k tomuto snímku','Notes for this slide')}</button><button onClick={()=>open('connection')}>{t('Připojení modelu','Model connection')}</button><button onClick={()=>open('share')}>{t('Odkaz a QR pro účastníky','Participant link and QR')}</button><a href={publicAsset(`runbook/facilitator-${lang}.pdf`)} download>{t('Lektorský tahák · A4','Facilitator guide · A4')}</a>{!browserRuntime&&<Link to="/">{t('Původní technické lekce','Original technical lessons')}</Link>}<p>{t('Šipky ← → přepínají snímky. Esc zavře ukázku. Poznámky a nastavení jsou vidět i na projektoru.','Use ← → to change slides. Esc closes a demo. Notes and settings are visible on the projector.')}</p></div>}
 {overlay==='share'&&<div className="ws-share"><img src={publicAsset('workshop-exercises-qr.svg')} alt={t('QR kód na veřejnou stránku cvičení','QR code for the public exercises page')}/><h3>{t('Cvičení bez registrace','Exercises without registration')}</h3><p>{t('Naskenujte QR kód nebo pošlete odkaz skupině. Prompty lze kopírovat přímo ze stránky.','Scan the QR or share the link with the group. Prompts can be copied directly from the page.')}</p><a href={exerciseUrl.href}>{t('Otevřít cvičení','Open exercises')}</a><button onClick={async()=>{try{await navigator.clipboard.writeText(exerciseUrl.href);setShareStatus(t('Odkaz zkopírován.','Link copied.'));}catch{setShareStatus(t('Kopírování se nezdařilo. Použijte odkaz výše.','Could not copy. Use the link above.'));}}}>{t('Kopírovat odkaz','Copy link')}</button><p role="status">{shareStatus}</p><small>{t('QR vede na veřejný web; kopírovaný odkaz používá právě otevřenou adresu.','The QR opens the public site; the copied link uses the address currently open.')}</small></div>}
 </div></dialog>
 </div>;
}
