import "./reset.css";
import "./styles.css";
import { todo } from './todo.js';
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
    todo.addItem(item);
}

todo.addList("Work");



const DEFAULT_LIST = "all";

const viewQuery = (function () {
    let list = "all"
    const options = {
        "duedateFilter": DEFAULT_LIST,
        "priorityFilter": "all",
        "completionFilter": "all",
        "sortBy": "duedate",
        "sortOrder": "desc",
    }

    function setList(targetList) {
        list = targetList.id ?? targetList;
    }

    function setOptions({ option, selection } = {}) {
        if (!(option in options)) {
            throw new Error(`Option ${option} does not exist in viewQuery.`);
        }

        options[option] = selection;
    }

    function filter(item) {
        if (options.duedateFilter !== "all") {
            if (!duedateFilter(item, options.duedateFilter)) return false;
        }

        if (options.priorityFilter !== "all") {
            const priority = Number(options.priorityFilter);
            if (!item.matchesPriority(priority)) return false;
        }

        if (options.completionFilter !== "all") {
            let completeFilter;

            // normalize input from UI
            if (options.completionFilter === "true") completeFilter = true;
            if (options.completionFilter === "false") completeFilter = false;

            if (!(item.isComplete === completeFilter)) return false;
        }

        return true;
    }

    function sort(a, b) {
        let comparison;

        if (options.sortBy === "duedate") {
            comparison = a.compareDuedate(b);
        } else if (options.sortBy === "priority") {
            comparison = a.comparePriority(b);
        }

        if (!comparison) comparison = a.id - b.id;

        if (options.sortOrder === "asc") {
            return comparison;
        } else if (options.sortOrder === "desc") {
            return comparison * -1;
        } else {
            console.log(`${options.sortOrder} is not a valid sort order. Should be 'asc' or 'desc'.`);
            return comparison;
        }
    }

    function duedateFilter(item, dateFilter) {
        const filters = {
            "overdue": () => item.isOverdue(),
            "today": () => item.isDueInExactly(0),
            "tomorrow": () => item.isDueInExactly(1),
            "week": () => item.isDueWithin(7),
            "month": () => item.isDueWithin(30)
        }

        if (dateFilter === "all") return true;
        if (!(dateFilter in filters)) return true;

        return filters[dateFilter]();
    }


    return {
        setList, setOptions,
        get listId() {
            if (list === "all") return "all";
            return Number(list);
        },
        filter, sort
    }
})();

// App initialization

const domController = createDomController({
    lists: todo.getLists(),
    items: todo.getItems(viewQuery)
});

domController.updateSelectedList({ id: "all", title: "All Items" });


// Event wiring

pubSub.subscribe(events.changeSelectedList, (target) => {
    let list;
    if (target.id === "all") {
        list = { id: "all", title: "All Items" }
    } else {
        list = todo.getList(target.id);
    }
    if (!list) return;

    domController.updateSelectedList(list);

    viewQuery.setList(list);
    domController.displayItems(todo.getItems(viewQuery));
})

pubSub.subscribe(events.itemChecked, (e) => {
    const item = todo.getItem(e.id);
    item.toggleComplete(e.checked);
});

pubSub.subscribe(events.saveItemDetails, (e) => {
    const details = {};
    for (const [key, value] of e.data) {
        details[key] = value;
    }

    // normalize data
    if ('priority' in details) details.priority = Number(details.priority);
    if ('isComplete' in details) details.isComplete = details.isComplete === true || details.isComplete === 'true';
    if ('listId' in details) details.listId = Number(details.listId);

    if (e.id) {
        todo.editItem(e.id, details);
    } else {
        todo.addItem(details);
    }

    domController.displayItems(todo.getItems(viewQuery))
});

pubSub.subscribe(events.deleteItem, (id) => {
    todo.removeItem(id);
    domController.displayItems(todo.getItems(viewQuery));
});

pubSub.subscribe(events.changeViewOption, (e) => {
    viewQuery.setOptions({ option: e.option, selection: e.value });
    domController.displayItems(todo.getItems(viewQuery));
});

pubSub.subscribe(events.addList, (listName) => {
    todo.addList(listName);
    pubSub.publish(events.listsChanged, todo.getLists());
});

pubSub.subscribe(events.deleteList, (id) => {
    todo.removeList(id);
    pubSub.publish(events.listsChanged, todo.getLists());
    domController.displayItems(todo.getItems(viewQuery));
});

