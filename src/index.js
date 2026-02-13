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