import "./reset.css";
import "./styles.css";
import todo from './todo.js';
import viewQuery from './viewQuery.js';
import { createDomController } from './dom.js';
import { events, pubSub } from './pubSub.js';




// Initialize DOM state

const domController = createDomController({
    lists: todo.getLists(),
    items: todo.getItems(viewQuery)
});

// initialize lists
const initialList = todo.getList(viewQuery.listId);
domController.setActiveList(initialList);
domController.setLists(todo.getLists());

// initialize view options
const initialViewOptions = viewQuery.getOptions();
domController.setViewOptions(initialViewOptions);

setUpSubscriptions();


// Populate with dummy data


// const fillerItems = [
//     { title: "Pay Tributum", description: "Deliver grain tax to the local Prefect", duedate: "2026-02-01", priority: 5, isComplete: false },
//     { title: "Chariot Maintenance", description: "Grease the axles of the racing car", duedate: "2026-02-04", priority: 4, isComplete: true },
//     { title: "Feed Hounds", description: "Ensure the hunting pack is ready", duedate: "2026-02-05", priority: 1, isComplete: true },
//     { title: "Repair Aqueduct", description: "Section IV has a crack near the forum", duedate: "2026-02-06", priority: 5 },
//     { title: "Consult Augur", description: "Seek omens for the upcoming harvest", duedate: "2026-02-07", priority: 3 },
//     { title: "Visit Baths", description: "Meet with Marcus to discuss olive trade", duedate: "2026-02-06", priority: 2 },
//     { title: "Defend the Lines", description: "Report to the Germanic border immediately", duedate: "0376-08-09", priority: 5 },
//     { title: "Sack of Rome Check-in", description: "See if Alaric is actually leaving this time", duedate: "0410-08-24", priority: 5 },
//     { title: "Council of Nicaea", description: "Argue about the nature of the Son", duedate: "0325-05-20", priority: 4 },
//     { title: "Scribe Duties", description: "Transcribe the Governor's latest edict", duedate: "2026-02-08", priority: 4 },
//     { title: "Mend Toga", description: "Stitch the hem of the formal wool toga", duedate: "2026-02-09", priority: 1 },
//     { title: "Sacrifice to Lares", description: "Offer wine to the household gods", duedate: "2026-02-08", priority: 4 },
//     { title: "Finish Aeneid", description: "Re-read Book VI for the tenth time", duedate: "2026-02-15", priority: 0 },
//     { title: "Wine Cellar", description: "Check seals on Falernian amphorae", duedate: "2026-02-10", priority: 3 },
//     { title: "Colosseum Tickets", description: "Secure seating for the gladiator games", duedate: "2026-02-12", priority: 2 },
//     { title: "Censor Census", description: "Register the new freedmen in the district", duedate: "2026-02-20", priority: 5 },
//     { title: "Olive Harvest", description: "Hire extra laborers for the north grove", duedate: "2026-02-14", priority: 3 },
//     { title: "Garum Supply", description: "Buy fermented fish sauce from the docks", duedate: "2026-02-07", priority: 1 },
//     { title: "Vesta’s Flame", description: "Ensure the eternal fire is attended", duedate: "2026-02-07", priority: 5 },
//     { title: "Letter to Pliny", description: "Ask about the eruption in the south", duedate: "2026-02-18", priority: 2 },
//     { title: "Senate Session", description: "Listen to the debate on Germanic borders", duedate: "2026-02-11", priority: 4 }
// ];

// for (const item of fillerItems) {
//     todo.addItem(item);
// }

// todo.addList("Work");




// Supporting functions

function setUpSubscriptions() {
    pubSub.subscribe(events.clickNavList, handleNavListClick);
    pubSub.subscribe(events.checkItem, handleCheckedItem);
    pubSub.subscribe(events.saveItemDetails, handleSavedDetails);
    pubSub.subscribe(events.deleteItem, handleItemDeletion);
    pubSub.subscribe(events.changeViewOption, handleChangedViewOption);
    pubSub.subscribe(events.addList, handleListAddition);
    pubSub.subscribe(events.deleteList, handleListDeletion);
    pubSub.subscribe(events.listsChanged, updateDomLists);
}

function handleNavListClick(id) {
    let list;
    if (id === "all") {
        list = { id: "all", title: "All Items" }
    } else {
        list = todo.getList(id);
    }
    if (!list) return;

    domController.setActiveList(list);
    viewQuery.setActiveList(list);

    domController.displayItems(todo.getItems(viewQuery));
}

function handleCheckedItem(checkedItem) {
    const item = todo.getItem(checkedItem.id);
    item.toggleComplete(checkedItem.checked);
    domController.displayItems(todo.getItems(viewQuery));
}

function handleSavedDetails(form) {
    const details = {};
    for (const [key, value] of form.data) {
        details[key] = value;
    }

    // normalize data
    if ('priority' in details) details.priority = Number(details.priority);
    if ('isComplete' in details) details.isComplete = details.isComplete === true || details.isComplete === 'true';
    if ('listId' in details) details.listId = Number(details.listId);

    if (form.id) {
        todo.editItem(form.id, details);
    } else {
        todo.addItem(details);
    }

    domController.displayItems(todo.getItems(viewQuery));
}

function handleItemDeletion(id) {
    todo.removeItem(id);
    domController.displayItems(todo.getItems(viewQuery));
}

function handleChangedViewOption(changed) {
    viewQuery.setOptions({ option: changed.option, selection: changed.value });
    domController.displayItems(todo.getItems(viewQuery));
}

function handleListAddition(listName) {
    todo.addList(listName);
    pubSub.publish(events.listsChanged, todo.getLists());
}

function handleListDeletion(id) {
    todo.removeList(id);
    pubSub.publish(events.listsChanged, todo.getLists());
}

function updateDomLists() {
    domController.setLists(todo.getLists());
}