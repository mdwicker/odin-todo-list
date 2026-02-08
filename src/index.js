import "./reset.css";
import "./styles.css";
import { todoController } from './todo.js';
import { ItemDetailsForm, createDomController } from './dom.js';
import { events, pubSub } from './pubSub.js';


const fillerItems = [
    { title: "Pay Tributum", description: "Deliver grain tax to the local Prefect", duedate: "2026-02-01", priority: 5, isComplete: false },
    { title: "Chariot Maintenance", description: "Grease the axles of the racing car", duedate: "2026-02-04", priority: 4, isComplete: true },
    { title: "Feed Hounds", description: "Ensure the hunting pack is ready", duedate: "2026-02-05", priority: 1, isComplete: true },
    { title: "Repair Aqueduct", description: "Section IV has a crack near the forum", duedate: "2026-02-06", priority: 5 },
    { title: "Consult Augur", description: "Seek omens for the upcoming harvest", duedate: "2026-02-07", priority: 3 },
    { title: "Visit Baths", description: "Meet with Marcus to discuss olive trade", duedate: "2026-02-06", priority: 2 },
    { title: "Defend the Lines", description: "Report to the Germanic border immediately", duedate: "0376-08-09", priority: 5 },
    { title: "Sack of Rome Check-in", description: "See if Alaric is actually leaving this time", duedate: "0410-08-24", priority: 5 },
    { title: "Council of Nicaea", description: "Argue about the nature of the Son", duedate: "0325-05-20", priority: 4 },
    { title: "Scribe Duties", description: "Transcribe the Governor's latest edict", duedate: "2026-02-08", priority: 4 },
    { title: "Mend Toga", description: "Stitch the hem of the formal wool toga", duedate: "2026-02-09", priority: 1 },
    { title: "Sacrifice to Lares", description: "Offer wine to the household gods", duedate: "2026-02-08", priority: 4 },
    { title: "Finish Aeneid", description: "Re-read Book VI for the tenth time", duedate: "2026-02-15", priority: 0 },
    { title: "Wine Cellar", description: "Check seals on Falernian amphorae", duedate: "2026-02-10", priority: 3 },
    { title: "Colosseum Tickets", description: "Secure seating for the gladiator games", duedate: "2026-02-12", priority: 2 },
    { title: "Censor Census", description: "Register the new freedmen in the district", duedate: "2026-02-20", priority: 5 },
    { title: "Olive Harvest", description: "Hire extra laborers for the north grove", duedate: "2026-02-14", priority: 3 },
    { title: "Garum Supply", description: "Buy fermented fish sauce from the docks", duedate: "2026-02-07", priority: 1 },
    { title: "Vesta’s Flame", description: "Ensure the eternal fire is attended", duedate: "2026-02-07", priority: 5 },
    { title: "Letter to Pliny", description: "Ask about the eruption in the south", duedate: "2026-02-18", priority: 2 },
    { title: "Senate Session", description: "Listen to the debate on Germanic borders", duedate: "2026-02-11", priority: 4 }
];

// const fillerLists = 

for (const item of fillerItems) {
    todoController.addItem(item);
}

todoController.addList({ title: "Work" });

todoController.moveItem(2, 2);


const viewOptions = {
    filterDuedate: "all",
    filterPriority: "all",
    filterCompletion: "all",
    sort: "duedate",
    order: "descending",
}

const view = {
    listId: "all",
    filter, sort
}

function filter(item) {
    if (viewOptions.filterDuedate !== "all") {
        const itemDate = new Date(item.duedate);
        if (!filterDuedate(itemDate, viewOptions.filterDuedate)) {
            return false;
        }
    }

    if (viewOptions.filterPriority !== "all") {
        const itemPriority = Number(item.priority);
        if (!filterPriority(itemPriority, viewOptions.filterPriority)) {
            return false;
        }
    }

    if (viewOptions.filterCompletion !== "all") {
        itemComplete = item.complete === "true" || item.complete === true;
        if (itemComplete !== viewOptions.filterCompletion) {
            return false;
        }
    }

    function filterDuedate(itemDate, filterDate) {
        const today = new Date();

        if (filterDate <= today) {
            return itemDate <= today;
        }

        return today <= itemDate && itemDate <= filterDate;
    }

    function filterPriority(itemPriority, filterPriority) {
        return itemPriority === filterPriority;
    }

    return true;
}

function sort(a, b) {
    let comparison;

    if (viewOptions.sort === "duedate") {
        comparison = new Date(a.duedate) - new Date(b.duedate);
    } else if (viewOptions.sort === "priority") {
        comparison = Number(a.priority) - Number(b.priority);
    }

    if (!comparison) comparison = Number(a.id) - Number(b.id);

    return viewOptions.order === "ascending" ? comparison : comparison * -1;
}

// App initialization

const domController = createDomController({
    lists: todoController.getLists(),
    items: todoController.getItems(view)
});

domController.updateSelectedList({ id: "all", title: "All Items" });


// Event wiring

pubSub.subscribe(events.changeList, (target) => {
    let list;
    if (target.id === "all") {
        list = { id: "all", title: "All Items" }
    } else {
        list = todoController.getList(target.id);
    }
    if (!list) return;
    view.listId = list.id;

    domController.updateSelectedList(list);
    domController.displayItems(todoController.getItems(view));
})

pubSub.subscribe(events.itemChecked, (e) => {
    todoController.toggleItemCompletion(e.id, { complete: e.checked });
})

pubSub.subscribe(events.saveItemDetails, (e) => {
    const details = {};
    for (const [key, value] of e.data) {
        details[key] = value;
    }
    if (e.id) {
        todoController.editItem(e.id, details);
    } else {
        todoController.addItem(details);
    }

    domController.displayItems(todoController.getItems(view))
});

pubSub.subscribe(events.deleteItem, (id) => {
    todoController.removeItem(id);
    domController.displayItems(view);
});

