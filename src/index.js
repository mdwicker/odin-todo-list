import "./reset.css";
import "./styles.css";
import { todoController } from './todo.js'
import { createDomController } from './dom.js'


const fillerItems = [
    { title: "Pay Tributum", description: "Deliver grain tax to the local Prefect", dueDate: "2026-02-01", priority: 5, isComplete: false },
    { title: "Chariot Maintenance", description: "Grease the axles of the racing car", dueDate: "2026-02-04", priority: 4, isComplete: true },
    { title: "Feed Hounds", description: "Ensure the hunting pack is ready", dueDate: "2026-02-05", priority: 1, isComplete: true },
    { title: "Repair Aqueduct", description: "Section IV has a crack near the forum", dueDate: "2026-02-06", priority: 5 },
    { title: "Consult Augur", description: "Seek omens for the upcoming harvest", dueDate: "2026-02-07", priority: 3 },
    { title: "Visit Baths", description: "Meet with Marcus to discuss olive trade", dueDate: "2026-02-06", priority: 2 },
    { title: "Defend the Lines", description: "Report to the Germanic border immediately", dueDate: "0376-08-09", priority: 5 },
    { title: "Sack of Rome Check-in", description: "See if Alaric is actually leaving this time", dueDate: "0410-08-24", priority: 5 },
    { title: "Council of Nicaea", description: "Argue about the nature of the Son", dueDate: "0325-05-20", priority: 4 },
    { title: "Scribe Duties", description: "Transcribe the Governor's latest edict", dueDate: "2026-02-08", priority: 4 },
    { title: "Mend Toga", description: "Stitch the hem of the formal wool toga", dueDate: "2026-02-09", priority: 1 },
    { title: "Sacrifice to Lares", description: "Offer wine to the household gods", dueDate: "2026-02-08", priority: 4 },
    { title: "Finish Aeneid", description: "Re-read Book VI for the tenth time", dueDate: "2026-02-15", priority: 0 },
    { title: "Wine Cellar", description: "Check seals on Falernian amphorae", dueDate: "2026-02-10", priority: 3 },
    { title: "Colosseum Tickets", description: "Secure seating for the gladiator games", dueDate: "2026-02-12", priority: 2 },
    { title: "Censor Census", description: "Register the new freedmen in the district", dueDate: "2026-02-20", priority: 5 },
    { title: "Olive Harvest", description: "Hire extra laborers for the north grove", dueDate: "2026-02-14", priority: 3 },
    { title: "Garum Supply", description: "Buy fermented fish sauce from the docks", dueDate: "2026-02-07", priority: 1 },
    { title: "Vesta’s Flame", description: "Ensure the eternal fire is attended", dueDate: "2026-02-07", priority: 5 },
    { title: "Letter to Pliny", description: "Ask about the eruption in the south", dueDate: "2026-02-18", priority: 2 },
    { title: "Senate Session", description: "Listen to the debate on Germanic borders", dueDate: "2026-02-11", priority: 4 }
];

// const fillerLists = 

for (const item of fillerItems) {
    todoController.addItem(item);
}

todoController.addList({ title: "Work" });

todoController.moveItem(2, 2);

console.log(todoController.getLists());

const domController = createDomController(todoController.getItems(), todoController.getLists());



/*
PLAN:

todo.js
- contains a TodoItem class
- contains a TodoList class (project? No, I like list)

DomManager.js
- Manages all the dom stuff, lol.
- initializes the page
- handles user requests
- MAYBE a pubsub? might be too complicated for this, but I'm just a big fan
    of the pattern, lol. 

Maybe instead I have a third module for wiring...or the main.js handles it, lol
it would request for certain buttons from the dom manager, and pass
requests to todo.js. It would also get the state from todo.js, and
serve it to DomManager.js. Yeah, that could work. Any buttons that are more than
just DISPLAY changes would run through that. Display change stuff
could just be handled by the DomManager tho.

question: where am I handling storage stuff? is that in index.js, or todo.js?
probably in todo.js, honestly.
*/