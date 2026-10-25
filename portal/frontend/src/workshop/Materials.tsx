import { useState } from 'react';
import { publicAsset } from './runtime';
import type { Language } from './content';

export function Materials({ lang }: { lang: Language }) {
  const [showHelp, setShowHelp] = useState(false);
  const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
  return <section className="ws-materials" aria-label={t('Materiály pro vlastní práci', 'Materials for your own work')}>
    <div><h3>{t('Materiály pro vlastní práci', 'Materials for your own work')}</h3><p>{t('Otevřete tento odkaz na svém počítači. Bez registrace do portálu.', 'Open this address on your computer. No portal registration needed.')}</p><a className="ws-materials-url" href="https://agiertli.github.io/first-ai-agent-starters/">agiertli.github.io/first-ai-agent-starters</a></div>
    <div className="ws-actions"><a className="ws-primary" href={publicAsset(`workshop-starters/ui-${lang}.zip`)} download>{t('Stáhnout balíček bez kódu', 'Download no-code starter')}</a><button aria-expanded={showHelp} onClick={() => setShowHelp(!showHelp)}>{t('Jak použít soubory', 'How to use the files')}</button></div>
    {showHelp && <p>{t('ZIP rozbalte. Pro první vyplněný příklad otevřete start-here.txt a vložte jeho obsah do svého chatu. Pro vlastní nápad začněte souborem README.md: upravte brief.md a vložte create-agent.md spolu s brief.md, instructions.md a materials.md. Soubory .md jsou obyčejný text, otevřete je v textovém editoru. Výsledky testů zapište do test-record.md. Pokud potřebný nástroj ve svém účtu nemáte, oslovte lektora nebo pracujte ve dvojici. Technické varianty jsou v kapitole 7.', 'Extract the ZIP. For the first completed example, open start-here.txt and paste its contents into your own chat. For your own idea, start with README.md: adapt brief.md and paste create-agent.md along with brief.md, instructions.md and materials.md. Files ending in .md are plain text; open them in a text editor. Record test results in test-record.md. If a required tool is unavailable in your account, ask a facilitator or pair up. Technical routes are in chapter 7.')}</p>}
  </section>;
}
