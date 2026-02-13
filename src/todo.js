const DEFAULT_LIST_ID = 1;

class TodoItem {
    static usedIds = new Set();

    static #addUsedId(id) {
        if (this.usedIds.has(id)) {
            throw new Error(`ID ${id} already used.`)
        }
        else this.usedIds.add(id);
    }

    static #nextId() {
        const id = Math.max(0, ...this.usedIds) + 1;
        this.#addUsedId(id);
        return id;
    }

    #id;
    listId;
    listTitle;
    title;
    description;
    #duedate;
    #priority;
    isComplete;

    constructor({ id, listId = DEFAULT_LIST_ID, listTitle = null, title, description, duedate, priority, isComplete = false } = {}) {
        if (id === undefined) {
            this.#id = TodoItem.#nextId();
        } else {
            TodoItem.#addUsedId(Number(id));
            this.#id = Number(id);
        }
        this.listId = Number(listId);
        this.listTitle = listTitle;

        this.title = title;
        this.description = description;
        this.duedate = duedate;
        this.priority = priority;
        this.isComplete = isComplete;
    }

    get id() {
        return this.#id;
    }

    get duedate() {
        return new Date(this.#duedate);
    }

    set duedate(duedate) {
        const date = duedate === undefined ? new Date() : new Date(duedate);

        if (isNaN(date)) {
            throw new Error(`${duedate} is not a valid date.`);
        }
        date.setHours(0, 0, 0, 0);
        this.#duedate = date;
    }

    get priority() {
        return this.#priority;
    }

    set priority(priority = 0) {
        priority = Number(priority);

        if (!Number.isInteger(priority) || priority < 0 || priority > 5) {
            throw new Error("Priority must be an integer between 0 and 5.");
        }

        this.#priority = priority;
    }

    toggleComplete(complete = null) {
        if (complete === null) {
            this.isComplete = !this.isComplete;
        } else if (!(typeof complete === "boolean")) {
            throw TypeError("toggleComplete can only take a Boolean value.")
        } else {
            this.isComplete = complete;
        }
    }

    isOverdue() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.#duedate.valueOf() < today.valueOf();
    }

    isDueInExactly(numberOfDays) {
        if (!Number.isInteger(numberOfDays) || numberOfDays < 0) {
            throw new TypeError("isDueInExactly requires a non-negative integer.");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + numberOfDays);

        return this.#duedate.valueOf() === targetDate.valueOf();
    }

    isDueWithin(numberOfDays) {
        if (!Number.isInteger(numberOfDays) || numberOfDays < 0) {
            throw new TypeError("isDueWithin requires a non-negative integer.");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0)

        const max = new Date(today);
        max.setDate(max.getDate() + numberOfDays);

        return this.#duedate.valueOf() >= today.valueOf()
            && this.#duedate.valueOf() <= max.valueOf();
    }

    matchesPriority(priority) {
        if (!Number.isInteger(priority) || priority < 0) {
            throw new TypeError("matchesPriority requires a non-negative integer.");
        }

        return priority === this.priority;
    }

    compareDuedate(otherItem) {
        if (!(otherItem instanceof TodoItem)) {
            throw new TypeError("compareDueDate expects a TodoItem");
        }

        return this.#duedate.valueOf() - otherItem.duedate.valueOf();
    }

    comparePriority(otherItem) {
        if (!(otherItem instanceof TodoItem)) {
            throw new TypeError("comparePriority expects a TodoItem");
        }
        return this.priority - otherItem.priority;
    }

    getAll() {
        return {
            id: this.#id,
            listId: this.listId,
            listTitle: this.listTitle,
            title: this.title,
            description: this.description,
            duedate: new Date(this.#duedate),
            priority: this.#priority,
            isComplete: this.isComplete
        }
    }
}

class TodoList {
    static usedIds = new Set();

    static #addUsedId(id) {
        this.usedIds.add(id);
    }

    static #nextId() {
        const id = Math.max(0, ...this.usedIds) + 1;
        this.#addUsedId(id);
        return id;
    }

    #id;
    #title;
    canDelete;

    constructor({ title = "List", id } = {}) {
        if (id === undefined) {
            this.#id = TodoList.#nextId();
        } else {
            TodoList.#addUsedId(Number(id));
            this.#id = Number(id);
        }

        this.canDelete = id === DEFAULT_LIST_ID ? false : true;
        this.title = title;
    }

    get id() {
        return this.#id;
    }

    get title() {
        return this.#title;
    }

    set title(title) {
        if (!title) {
            this.#title = "";
        } else {
            // convert to title case
            title = title.toLowerCase();
            const words = title.split(" ");
            const titleCased = words.map(word => {
                return word.charAt(0).toUpperCase() + word.slice(1);
            });

            this.#title = titleCased.join(" ");
        }
    }

    getAll() {
        return {
            id: this.#id,
            title: this.#title
        }
    }
}


const todoStorage = (function () {
    const DATA = "data";
    const VIEWOPTIONS = "viewOptions";

    initializeStorage();


    function getItems() {
        return Object.values(get(DATA)["items"]);
    }

    function saveItem(item) {
        if (!item) {
            console.log("Sorry, no item to save.");
            return;
        }

        const items = get(DATA)["items"];
        items[item.id] = item.getAll();
        saveItems(items);
    }

    function removeItem(id) {
        const items = get(DATA)["items"];
        if (!(id in items)) {
            console.log(`Item #${id} not found in local storage.`);
            return;
        }

        delete items[id];

        saveItems(items);
    }

    function getLists() {
        return Object.values(get(DATA)["lists"]);
    }

    function saveList(list) {
        if (!list) {
            console.log("Sorry, no list to save.");
            return;
        }

        const lists = get(DATA)["lists"];
        lists[list.id] = list.getAll();
        saveLists(lists);
    }

    function removeList(id) {
        const lists = get(DATA)["lists"];
        if (!(id in lists)) {
            console.log(`List #${id} not found in local storage.`);
            return;
        }

        delete lists[id];

        saveLists(lists);
    }

    function saveItems(items) {
        if (!items) {
            console.log("No items to save.");
            return;
        }

        const data = get(DATA);
        data["items"] = items;
        save({ key: DATA, data });
    }

    function saveLists(lists) {
        if (!lists) {
            console.log("No lists to save.");
            return;
        }

        const data = get(DATA);
        data["lists"] = lists;
        save({ key: DATA, data });
    }

    function get(key) {
        const data = localStorage.getItem(key);

        if (!data) {
            console.log("Could not get local storage data.");
            return {};
        }

        return JSON.parse(data);
    }

    function save({ key = DATA, data = {} } = {}) {
        if (storageAvailable("localStorage")) {
            localStorage.setItem(key, JSON.stringify(data));
        } else {
            console.log("Sorry, no local storage available.");
        }
    }

    function initializeStorage() {
        if (!(DATA in localStorage)) {
            save({ key: DATA });
        }

        const data = get(DATA);

        if (!("items" in data)) {
            data["items"] = {};
        }

        if (!("lists" in data)) {
            data["lists"] = {}
        }

        save({ key: DATA, data });

        if (!(VIEWOPTIONS in localStorage)) {
            save({ key: VIEWOPTIONS });
        }
    }

    function storageAvailable(type) {
        let storage;
        try {
            storage = window[type];
            const x = "__storage_test__";
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return (
                e instanceof DOMException &&
                e.name === "QuotaExceededError" &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage &&
                storage.length !== 0
            );
        }
    }

    return {
        getItems, getLists,
        saveItem, saveList,
        removeItem, removeList
    }
})();


export const todo = (function () {
    const items = {};
    const lists = {};

    loadStoredData();

    if (!(DEFAULT_LIST_ID in lists)) {
        lists[DEFAULT_LIST_ID] = new TodoList({
            title: "Main",
            id: DEFAULT_LIST_ID
        });
    }


    function getItem(id) {
        const item = items[id];
        if (!item) {
            throw new Error(`Item ${id} not found.`);
        }
        return item;
    }

    function getList(id) {
        const list = lists[id];
        if (!list) {
            throw new Error(`List ${id} not found.`);
        }
        return list;
    }

    function getItems({ listId = null, filter, sort } = {}) {
        let itemsToGet = Object.values(items).map(item => {
            // populate with list titles if necessary
            if (!item.listTitle) {
                item.listTitle = getList(item.listId).title;
            }
            return item;
        });

        if (listId) {
            itemsToGet = itemsToGet.filter(item => item.listId === listId);
        }

        if (filter) {
            itemsToGet = itemsToGet.filter(filter);
        }

        if (sort) {
            itemsToGet = itemsToGet.sort(sort);
        }

        return itemsToGet;
    }

    function getLists() {
        return Object.values(lists);
    }

    function addItem(info) {
        const item = new TodoItem(info);
        items[item.id] = item;

        item.listTitle = getList(item.listId).title;
        todoStorage.saveItem(item);

        return item;
    }

    function editItem(id, fieldsToEdit) {
        const item = items[id];
        if (!item) return;

        const skipFields = new Set(["id"]);

        for (const [field, value] of Object.entries(fieldsToEdit)) {
            if (skipFields.has(field)) continue;
            if (field in item) item[field] = value;
        }

        item.listTitle = getList(item.listId).title;
        todoStorage.saveItem(item);

        return item;
    }

    function removeItem(id) {
        if (id in items) {
            delete items[id];
            todoStorage.removeItem(id);
        }
    }

    function moveItem(itemId, targetListId) {
        if (!lists[targetListId]) {
            throw new Error(`List ${targetListId} not found.`);
        }
        const item = items[itemId];
        if (!item) return;
        item.listId = targetListId;
        item.listTitle = getList(targetListId).title;
        todoStorage.saveItem(item);
    }

    function addList(title) {
        const list = new TodoList({ title });
        lists[list.id] = list;
        todoStorage.saveList(list);
        return list;
    }


    function removeList(id) {
        const list = lists[id];
        if (!list) {
            console.log("Couldn't find list to delete: ", id);
        }

        // Don't allow deletion of disallowed liists
        if (!list.canDelete) {
            return;
        }

        // Move items to default list
        const listItems = getItems({ listId: id });
        listItems.forEach(item => moveItem(item.id, DEFAULT_LIST_ID));

        // delete list
        todoStorage.removeList(id);
        delete lists[id];

        return { list, items: listItems };
    }

    function loadStoredData() {
        // Load saved lists
        TodoList.usedIds.clear();
        const savedLists = todoStorage.getLists();

        for (const listInfo of savedLists) {
            const list = new TodoList(listInfo);
            lists[list.id] = list;
        }

        // Load saved items
        TodoItem.usedIds.clear();
        const savedItems = todoStorage.getItems();

        for (const itemInfo of savedItems) {
            const item = new TodoItem(itemInfo);
            item.listTitle = getList(item.listId).title;
            items[item.id] = item;
        }
    }


    return {
        getItem, getList,
        getItems, getLists,
        addItem, editItem, removeItem,
        addList, removeList,
    }
})();



