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
    "duedateFilter": "all",
    "priorityFilter": "all",
    "completionFilter": "all",
    "sortBy": "duedate",
    "sortOrder": "descending",
}

const view = {
    listId: "all",
    filter, sort
}

function filter(item) {
    if (viewOptions.duedateFilter !== "all") {
        if (!duedateFilter(
            new Date(item.duedate),
            viewOptions.duedateFilter
        )) {
            return false;
        }
    }

    if (viewOptions.priorityFilter !== "all") {
        if (!priorityFilter(
            Number(item.priority),
            Number(viewOptions.priorityFilter)
        )) {
            return false;
        }
    }

    if (viewOptions.completionFilter !== "all") {
        itemComplete = item.complete === "true" || item.complete === true;
        if (itemComplete !== viewOptions.completionFilter) {
            return false;
        }
    }

    function duedateFilter(itemDate, filterDate) {
        if (filterDate === "nodate") {
            return (!item);
        }

        if (filterDate === "all") {
            return true;
        }

        let today = new Date();
        today.setHours(0, 0, 0, 0);
        today = today.valueOf()

        itemDate.setHours(0, 0, 0, 0);
        itemDate = itemDate.valueOf();

        const days = {
            "today": 0,
            "tomorrow": 1
        }

        const ranges = {
            "week": 7,
            "month": 30
        }

        if (filterDate === "overdue") {
            return itemDate < today;
        }

        if (filterDate in days) {
            let date = new Date();
            date.setUTCDate(date.getUTCDate() + days[filterDate]);
            date.setHours(0, 0, 0, 0);
            date = date.valueOf();

            return itemDate === date;
        }

        if (filterDate in ranges) {
            let max = new Date();
            max.setUTCDate(max.getUTCDate() + ranges[filterDate]);
            max.setHours(0, 0, 0, 0);
            max = max.valueOf();

            return today <= itemDate && itemDate <= max;
        }

        console.log(`Unknown due date filter ${filterDate}.`);
        return false;
    }

    function priorityFilter(itemPriority, priorityFilter) {
        return itemPriority === priorityFilter;
    }

    return true;
}

function sort(a, b) {
    let comparison;

    if (viewOptions.sortBy === "duedate") {
        comparison = new Date(a.duedate) - new Date(b.duedate);
    } else if (viewOptions.sortBy === "priority") {
        comparison = Number(a.priority) - Number(b.priority);
    }

    if (!comparison) comparison = Number(a.id) - Number(b.id);

    return viewOptions.sortOrder === "ascending" ? comparison : comparison * -1;
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
    domController.displayItems(todoController.getItems(view));
});

pubSub.subscribe(events.changeViewOption, (e) => {
    viewOptions[e.option] = e.value;
    domController.displayItems(todoController.getItems(view));
})

