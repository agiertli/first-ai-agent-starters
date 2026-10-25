# More ideas

## Customer quotation
Choose a single supplier that meets the requested quantity, budget and deadline. Compare options independently and change the proposal if validation fails.

File reading + calculation/constraint validation + draft-file creation. The SDK starter provides these tools directly.

Change Beta stock from 20 to 8. The same quotation is no longer valid: the plan must be reconsidered.

## Personal presentation
Turn source materials into a concise presentation for a specific audience. Choose the structure, create HTML, run available checks and repair detected errors.

Read sources, write files, renderer, validator, optionally a browser for visual review. The skill describes the procedure; the application provides tools.

Remove notes from one slide. Show the validator failure, the agent’s repair and the new validation result.

## An afternoon plan
Choose between Řevnice and Dobřichovice for a walk today against stated constraints. Retrieve missing information or change the recommendation based on findings.

Current-weather or web-search tools in the application. The portal has a real weather tool; a text template does not create internet access.

Tighten the wind constraint. Observe whether the agent reconsiders the recommendation using the same data, rather than merely rewording it.

## Complete alternative briefs for UI / Markdown
These examples need your application’s tools. SDK and n8n starters implement quotations; changing text does not rewrite their tools.

## Personal presentation

### Name
Presentation agent

### Who it helps and how
Turn source materials into a concise presentation for a specific audience. Choose the structure, create HTML, run available checks and repair detected errors.

### Inputs and tools
Audience, duration, topic, personal goal, approved source materials and brand rules.

### Output
One standalone HTML file with speaker notes and a record of checks performed.

### Autonomy and boundaries
May read designated materials, create files in the output folder and run the specified renderer and validator. Ask for missing brief details. Do not publish. At most 3 repair attempts; disclose any visual review not performed.

### Testable success
The file opens, every slide has notes, and the deck fits the audience and duration; a failed check causes a repair, not merely a claim of completion.

### materials.md
Sample brief: adult general audience, 6 minutes, My first AI agent, goal: explain model versus tool. Do not invent current weather. Use the installed personal-presentation skill if available; otherwise request the rules and file-generation tools.

### task.txt
Create a presentation from the brief. Ask for missing input, choose the structure, create HTML and check it with available tools. Repair an identified error and check again. Return the file and actual validation results.

### Changed-constraints test
Remove notes from one slide. Show the validator failure, the agent’s repair and the new validation result.

## An afternoon plan

### Name
Afternoon planner

### Who it helps and how
Choose between Řevnice and Dobřichovice for a walk today against stated constraints. Retrieve missing information or change the recommendation based on findings.

### Inputs and tools
Today’s date, two locations, time and preferences; current weather from an allowed source.

### Output
A recommendation, or a report that no option meets the constraints, with sources and data timestamps.

### Autonomy and boundaries
May retrieve current information using an available tool; must not book or pay. Never replace unknown data with invented estimates. Does not certify route safety or suitability for a particular child.

### Testable success
Retrieved data actually supports the choice. Rain or missing data causes an updated recommendation or a question.

### materials.md
A walk today in Řevnice or Dobřichovice. Preference: no forecast precipitation and wind at most 20 km/h. If neither fits, ask whether to change time or choose an indoor activity. This preference is not a safety threshold.

### task.txt
Choose a feasible location for today’s walk. Retrieve the current data you need using an available tool, compare with preferences and decide whether to recommend a location, retrieve more information or ask about changing the plan. Include sources and timestamps.

### Changed-constraints test
Tighten the wind constraint. Observe whether the agent reconsiders the recommendation using the same data, rather than merely rewording it.
