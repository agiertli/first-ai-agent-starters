import { w } from './content';
const phases = ['goal', 'thinking', 'tool', 'tool_executing', 'result', 'context_updated', 'thinking', 'answer'] as const;
export type Phase = typeof phases[number] | 'idle' | 'error' | 'stopped' | 'tool_denied';
export const captions = {
 tool_denied: w('Aplikace požadavek odmítla. Žádný nástroj nebyl spuštěn. Důvod odmítnutí přidá do kontextu pro další rozhodnutí.', 'The application denied the request. No tool was executed. It adds the denial to context for the next decision.'),
 idle: w('Člověk komunikuje s aplikací. Ta propojuje model, nástroje a kontext a řídí opakování.', 'The person interacts with the application. It connects the model, tools and context and controls repetition.'),
 goal: w('1 · Člověk předá aplikaci cíl a hranice. Aplikace připraví instrukce, podklady a dostupné nástroje.', '1 · The person gives the application a goal and boundaries. It prepares instructions, materials and available tools.'),
 thinking: w('2 · Aplikace volá model s aktuálním kontextem. Model může navrhnout nástroj, odpovědět nebo se doptat.', '2 · The application calls the model with the current context. The model can request a tool, answer or ask a question.'),
 tool: w('3 · Model vrací požadavek na nástroj. Zatím nic neprovedl. Oprávnění a argumenty kontroluje aplikace.', '3 · The model returns a tool request. It has not executed anything. The application checks permissions and arguments.'),
 tool_executing: w('4 · Aplikace ověřila oprávnění a spouští povolenou operaci. Model nástroj přímo nespouští.', '4 · The application checked permissions and executes the allowed operation. The model does not execute tools directly.'),
 result: w('5 · Nástroj vrátil data nebo chybu aplikaci. Výsledek ještě není finální odpověď člověku.', '5 · The tool has returned data or an error to the application. The result is not yet the final answer to the person.'),
 context_updated: w('6 · Aplikace přidala výsledek do kontextu. Pokud zbývá čas a počet kroků, znovu zavolá model. To je návrat ve smyčce.', '6 · The application added the result to context. If time and step limits allow, it calls the model again. This is the loop back.'),
 answer: w('7 · Model vrací odpověď nebo otázku; aplikace ji předá člověku a tento běh ukončí. Dokončení nezaručuje správnost.', '7 · The model returns an answer or question; the application delivers it to the person and ends this run. Completion does not guarantee correctness.'),
 error: w('Běh skončil chybou nebo limitem. Aplikace další kroky zastaví; chybějící data nenahrazuje vymyšleným výsledkem.', 'The run ended with an error or a limit. The application stops further steps; missing data is not replaced with invented results.'),
 stopped: w('Příjem událostí byl zastaven. Rozpracovaný požadavek u poskytovatele může ještě doběhnout.', 'Event reception stopped. An in-flight provider request may still complete.'),
};
