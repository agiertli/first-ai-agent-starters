# Další nápady

## Obchodní nabídka
Z poptávky vybrat jediného dodavatele, který splní množství, rozpočet a termín. Samostatně porovnat možnosti a změnit návrh, pokud kontrola selže.

Čtení souborů + výpočet/kontrola podmínek + vytvoření návrhu souboru. SDK šablona poskytuje tyto nástroje přímo.

Změňte dostupnost Bety z 20 na 8. Správný výsledek už není stejná nabídka: je nutné přehodnotit plán.

## Prezentace na míru
Z podkladů vytvořit stručnou prezentaci pro konkrétní publikum. Samostatně zvolit strukturu, vytvořit HTML, spustit dostupnou kontrolu a opravit zjištěné chyby.

Čtení podkladů, tvorba souborů, renderer, validátor, případně prohlížeč pro vizuální kontrolu. Skill popisuje postup; nástroje zajišťuje aplikace.

Odstraňte poznámky z jednoho slidu. Ukažte chybu validátoru, opravu agentem a nový výsledek kontroly.

## Plán na volné odpoledne
Vybrat mezi Řevnicemi a Dobřichovicemi místo na dnešní procházku podle zadaných limitů. Podle zjištění doplnit potřebné údaje nebo doporučení změnit.

Aktuální počasí nebo webové vyhledávání v aplikaci. Portál má skutečný nástroj počasí; textová šablona sama přístup k internetu nepřidá.

Zpřísněte limit větru. Sledujte, zda agent přehodnotí doporučení podle týchž dat, místo aby jen přepsal formulaci.

## Kompletní alternativní zadání pro UI / Markdown
Tyto příklady vyžadují nástroje vaší aplikace. SDK a n8n šablony jsou připraveny pro nabídku; změna textu sama jejich nástroje nepřepíše.

## Prezentace na míru

### Jméno
Prezentační agent

### Komu pomáhá a s čím
Z podkladů vytvořit stručnou prezentaci pro konkrétní publikum. Samostatně zvolit strukturu, vytvořit HTML, spustit dostupnou kontrolu a opravit zjištěné chyby.

### Vstupy a nástroje
Publikum, délka, téma, osobní cíl, schválené podklady a pravidla značky.

### Výstup
Jeden samostatný HTML soubor s poznámkami řečníka a přehledem provedených kontrol.

### Samostatnost a hranice
Smí číst zadané podklady, vytvořit soubory ve výstupní složce a spustit určený renderer a validátor. Chybějící brief si vyžádá. Nic nepublikuje. Nejvýše 3 opravy; neprovedenou vizuální kontrolu přizná.

### Ověřitelný úspěch
Soubor jde otevřít, má poznámky ke každému slidu, odpovídá publiku a času; neúspěšná kontrola vyvolá opravu, ne pouhé prohlášení „hotovo“.

### materials.md
Ukázkový brief: dospělá veřejnost, 6 minut, téma Můj první AI agent, cíl vysvětlit rozdíl model/nástroj. Neověřené aktuální počasí neuvádět. Použij instalovaný personal-presentation skill, pokud je dostupný; jinak si vyžádej pravidla a nástroje pro tvorbu souboru.

### task.txt
Vytvoř z briefu prezentaci. Chybějící zadání si doplň otázkou, vyber strukturu, vytvoř HTML a ověř jej dostupnými nástroji. Nalezenou chybu oprav a ověř znovu. Vrať soubor a skutečné výsledky kontrol.

### Zkouška změny podmínek
Odstraňte poznámky z jednoho slidu. Ukažte chybu validátoru, opravu agentem a nový výsledek kontroly.

## Plán na volné odpoledne

### Jméno
Plánovač odpoledne

### Komu pomáhá a s čím
Vybrat mezi Řevnicemi a Dobřichovicemi místo na dnešní procházku podle zadaných limitů. Podle zjištění doplnit potřebné údaje nebo doporučení změnit.

### Vstupy a nástroje
Dnešní datum, dvě místa, čas a preference; aktuální počasí z povoleného zdroje.

### Výstup
Doporučení nebo zpráva, že žádná varianta nesplňuje limity, se zdroji a časy dat.

### Samostatnost a hranice
Smí vyhledat aktuální informace dostupným nástrojem; nesmí rezervovat ani platit. Neznámý údaj nenahrazuje odhadem. Nepotvrzuje bezpečnost trasy ani vhodnost pro konkrétní dítě.

### Ověřitelný úspěch
Zjištěná data skutečně podporují volbu. Při dešti či nedostupných datech doporučení změní nebo položí otázku.

### materials.md
Procházka dnes. Řevnice nebo Dobřichovice. Preference: žádné předpovídané srážky a vítr nejvýše 20 km/h. Pokud ani jedna varianta nevyhovuje, zeptej se, zda změnit čas nebo zvolit vnitřní program. Tato preference není bezpečnostní limit.

### task.txt
Vyber proveditelné místo na dnešní procházku. Sám zjisti potřebná aktuální data dostupným nástrojem, porovnej je s preferencemi a rozhodni, zda doporučit místo, doplnit údaj nebo se zeptat na změnu plánu. Uveď zdroje a čas.

### Zkouška změny podmínek
Zpřísněte limit větru. Sledujte, zda agent přehodnotí doporučení podle týchž dat, místo aby jen přepsal formulaci.
