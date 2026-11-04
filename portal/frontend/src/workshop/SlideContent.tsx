import { type Language } from './content';
import { programme, type Slide } from './presentationContent';
import { AssistantTeam, ContextDesk, LoopStory } from './FriendlyDiagrams';
import { Agenda, Brief, Build, Compare, DataPath, Decision, Extensions, Introductions, Permissions, Routes, Save, Test, PromptCard, WeatherSteps } from './ConceptSlides';
import { Timer } from './WorkshopTimer';
import { publicAsset } from './runtime';
import type { PracticeStep } from './practiceContent';

export function SlideContent({slide,lang,onDemo,onPractice}:{slide:Slide;lang:Language;onDemo:(demo:'weather'|'presentation')=>void;onPractice:(step:PracticeStep)=>void}) {
 const t=(cs:string,en:string)=>lang==='cs'?cs:en;
 switch(slide.id){
 case 'opening':return <><div className="ws-opening-outcome"><span aria-hidden="true">↻</span><p>{t('Vlastní zadání. Skutečný výstup. Ověřené hranice.','Your brief. A real output. Tested boundaries.')}</p></div><p className="ws-slide-footnote">{t('180 minut · Anton a Ondra · pracujeme ve vašich aplikacích','180 minutes · Anton and Ondra · work in your own applications')}</p></>;
 case 'agenda':return <Agenda lang={lang}/>;
 case 'introductions':return <Introductions lang={lang}/>;
 case 'compare':return <Compare lang={lang}/>;
 case 'house':return <AssistantTeam lang={lang}/>;
 case 'loop':return <LoopStory lang={lang}/>;
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
