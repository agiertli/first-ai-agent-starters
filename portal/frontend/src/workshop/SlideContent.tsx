import { type Language } from './content';
import { programme, type Slide } from './presentationContent';
import { ContextDesk, LoopStory } from './FriendlyDiagrams';
import { Agenda, Brief, Build, Compare, DataPath, Decision, Extensions, Introductions, Permissions, Routes, Save, Test, PromptCard, WeatherSteps } from './ConceptSlides';
import { Timer } from './WorkshopTimer';
import { publicAsset } from './runtime';
import type { PracticeStep } from './practiceContent';

function House({lang,floor,setFloor}:{lang:Language;floor:number;setFloor:(floor:number)=>void}) {
 const t=(cs:string,en:string)=>lang==='cs'?cs:en;
 const layers=[
 [t('Základy: potřeba člověka','Foundation: a human need'),t('Co řeším, pro koho a proč.','What I need to solve, for whom and why.')],
 [t('Podklady a instrukce','Sources and instructions'),t('Informace a pravidla, které aplikace předá modelu.','Information and rules the app supplies to the model.')],
 [t('Model a nástroje','Model and tools'),t('Model navrhne krok. Nástroj získá data nebo provede akci.','The model proposes a step. A tool gets data or performs an action.')],
 [t('Řídicí aplikace','The controlling application'),t('Propojí části, opakuje kroky a hlídá oprávnění i konec.','Connects the parts, repeats steps and enforces permissions and stopping.')],
 ];
 return <div className="ws-house-slide"><div className="ws-house-cutaway" role="group" aria-label={t('Dům agenta: vyberte část','Agent house: choose a part')}>
  <svg viewBox="0 0 600 480" aria-hidden="true" className="ws-house-building">
   <path d="M445 65 V27 H478 V84" className="ws-house-wall"/>
   <path d="M35 108 L300 12 L565 108 Z" className="ws-house-roof"/>
   <path d="M55 108 V434 H545 V108" className="ws-house-wall"/>
   <path d="M20 354 H580" className="ws-house-ground"/>
   <path d="M40 444 H560 M40 456 H560" className="ws-house-foundation"/>
   {[0,1,2].map(i=><g key={i} transform={`translate(0 ${i*80})`}><path d="M55 194 H425 M515 194 H545" className="ws-house-floor"/><path d="M425 194 h18 v-16 h18 v-16 h18 v-16 h18 v-16 h18 v-16" className="ws-house-stairs"/></g>)}
   <g className="ws-house-marker" style={{transform:`translate(530px, ${391-floor*80}px)`}}><circle cy="-11" r="6"/><path d="M0 -3 V12 M-8 2 H8 M0 12 L-7 22 M0 12 L7 22"/></g>
  </svg>
  <div className="ws-house-rooms">{[3,2,1,0].map(i=><button key={i} aria-pressed={floor===i} onClick={()=>setFloor(i)}><span aria-hidden="true">{i===0?'↓':i}</span>{layers[i][0]}</button>)}</div>
 </div><div className="ws-house-definition"><p aria-live="polite">{layers[floor][1]}</p><button onClick={()=>setFloor((floor+1)%4)}>{floor===3?t('Zpět k základům','Back to the foundations'):t('Další část domu ↑','Next floor ↑')}</button><small>{t('Schodiště propojuje části. Řídicí aplikace je používá podle potřeby a oprávnění, ne v pevném pořadí.','The stairs connect the parts. The app uses them as needed and permitted, not in a fixed order.')}</small></div></div>;
}

export function SlideContent({slide,lang,step,onStepChange,onDemo,onPractice}:{slide:Slide;lang:Language;step:number;onStepChange:(step:number)=>void;onDemo:(demo:'weather'|'presentation')=>void;onPractice:(step:PracticeStep)=>void}) {
 const t=(cs:string,en:string)=>lang==='cs'?cs:en;
 switch(slide.id){
 case 'opening':return <><div className="ws-opening-outcome"><span aria-hidden="true">↻</span><p>{t('Vlastní zadání. Skutečný výstup. Ověřené hranice.','Your brief. A real output. Tested boundaries.')}</p></div><p className="ws-slide-footnote">{t('180 minut · Anton a Ondra · pracujeme ve vašich aplikacích','180 minutes · Anton and Ondra · work in your own applications')}</p></>;
 case 'agenda':return <Agenda lang={lang}/>;
 case 'introductions':return <Introductions lang={lang}/>;
 case 'compare':return <Compare lang={lang}/>;
 case 'house':return <House lang={lang} floor={step} setFloor={onStepChange}/>;
 case 'loop':return <LoopStory lang={lang} step={step} setStep={onStepChange}/>;
 case 'context':return <><ContextDesk lang={lang}/><p className="ws-slide-footnote">{t('Kontext má omezenou kapacitu. Paměť mezi chaty je samostatná funkce aplikace.','Context has limited capacity. Memory between chats is a separate application feature.')}</p></>;
 case 'decision':return <Decision lang={lang}/>;
 case 'weather':return <><WeatherSteps lang={lang}/><button className="ws-primary ws-demo-launch" onClick={()=>onDemo('weather')}>{t('Otevřít živou ukázku','Open live demo')} ↗</button><p className="ws-slide-footnote">{t('Sledujte zdroj, místo a čas. Plynulá odpověď sama není důkaz.','Check source, location and time. A fluent answer is not evidence.')}</p></>;
 case 'brief':return <Brief lang={lang} actions={<div className="ws-slide-task-actions"><Timer minutes={programme[3].minutes} lang={lang}/><button onClick={()=>onPractice('brief')}>{t('Otevřít zadání a prompt','Open questions and prompt')} →</button></div>}/>;
 case 'break':return <div className="ws-break-slide"><Timer minutes={10} lang={lang}/></div>;
 case 'data':return <><DataPath lang={lang}/><p className="ws-slide-footnote">{t('Hesla a API klíče patří do nastavení připojení, ne do promptu. Soukromé výsledky nemusíte promítat.','Passwords and API keys belong in connection settings, not prompts. You do not have to project private results.')}</p></>;
 case 'permissions':return <Permissions lang={lang}/>;
 case 'extensions':return <Extensions lang={lang}/>;
 case 'presentation':return <><PromptCard lang={lang}>{t('„Chci pomocníka na prezentace. Ať se zeptá na publikum, délku, téma a můj cíl. Výstup má být HTML s poznámkami řečníka.“','“I want a presentation creator. Ask about audience, duration, topic and my goal. Produce HTML with speaker notes.”')}</PromptCard><button className="ws-primary ws-demo-launch" onClick={()=>onDemo('presentation')}>{t('Ukázat prompt, instalaci a výsledek','Show prompt, installation and result')} ↗</button><p className="ws-slide-footnote">{t('Zkrácené zadání. Původní prompt je součástí ukázky.','A shortened brief. The original prompt is included in the demo.')}</p></>;
 case 'routes':return <Routes lang={lang} actions={<div className="ws-slide-task-actions"><button onClick={()=>onPractice('templates')}>{t('Prohlédnout šablony','Browse templates')} →</button></div>}/>;
 case 'build':return <Build lang={lang} actions={<div className="ws-slide-task-actions"><Timer minutes={40} lang={lang}/><button onClick={()=>onPractice('build')}>{t('Otevřít prompt pro tvorbu','Open the creation prompt')} →</button></div>}/>;
 case 'test':return <Test lang={lang} actions={<div className="ws-slide-task-actions"><Timer minutes={30} lang={lang}/><button onClick={()=>onPractice('test')}>{t('Otevřít záznam testů','Open the test record')} →</button></div>}/>;
 case 'save':return <Save lang={lang} actions={<div className="ws-slide-task-actions"><button onClick={()=>onPractice('save')}>{t('Otevřít přehled k uložení','Open the save checklist')} →</button></div>}/>;
 case 'closing':return <div className="ws-closing"><div><p>{t('Jaký problém řešíte? Co se podařilo nebo vás překvapilo? Co zůstalo na vás?','What problem did you solve? What worked or surprised you? What stayed with you?')}</p><p className="ws-slide-footnote">{t('Citlivé podklady neukazujte. Sdílet zkušenost má stejnou hodnotu jako živá ukázka.','Keep sensitive materials private. Sharing what you learned is as valuable as a live demo.')}</p><button onClick={()=>onPractice('brief')}>{t('Cvičení a materiály','Exercises and materials')} →</button></div><img src={publicAsset('workshop-exercises-qr.svg')} alt={t('QR kód na cvičení a materiály','QR code for exercises and materials')}/></div>;
 }
}
