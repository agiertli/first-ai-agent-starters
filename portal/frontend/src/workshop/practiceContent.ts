import prompts from '../../../workshop-content/practice-prompts.json';
import { w } from './content';
export const practiceSteps = [
 {id:'brief', title:w('Popis problému','Describe the problem')},
 {id:'build', title:w('Návrh a tvorba','Design and build')},
 {id:'test', title:w('Testování','Test')},
 {id:'save', title:w('Uložení práce','Save your work')},
 {id:'templates', title:w('Šablony ke stažení','Download templates')},
] as const;
export type PracticeStep = typeof practiceSteps[number]['id'];
export const ideas = [
 {title:w('Příprava prezentací','Presentation preparation'),text:w('Z podkladů připraví prezentaci, zkontroluje délku a chybějící části doplní. Nejasnosti si ověří u mě; hotový návrh neposílá dál.','Creates a presentation from source material, checks its length and fills gaps. Asks me about uncertainties; does not send the draft to anyone.')},
 {title:w('Pořádek ve screenshotech','Organising screenshots'),text:w('Projde ukázkovou složku receptů a cvičení, rozpozná obsah a navrhne rozdělení. U nečitelných obrázků se zeptá; originály nemaže.','Reviews a sample folder of recipes and exercise screenshots, identifies their content and proposes categories. Asks about unreadable images; never deletes originals.')},
 {title:w('Výběr dodavatele','Choosing a supplier'),text:w('Porovná nabídky pro malou akci a ověří cenu, množství i termín. Když první volba nevyhoví, hledá jinou; objednávku nechá na mně.','Compares quotations for a small event and checks price, quantity and delivery. If the first choice fails, looks for another; leaves ordering to me.')},
];
export const problemTemplate = prompts.problemTemplate;
export const discoveryPrompt = prompts.discoveryPrompt;
export const buildPrompt = prompts.buildPrompt;
export const testTemplate = prompts.testTemplate;
export const saveTemplate = prompts.saveTemplate;
