const DEFAULT_LIST_ID = 1;

export class TodoItem {
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

    constructor({ id, listId = DEFAULT_LIST_ID, title, description, duedate, priority, isComplete = false } = {}) {
        if (id === undefined) {
            this.#id = TodoItem.#nextId();
        } else {
            TodoItem.#addUsedId(id);
            this.#id = id;
        }
        this.listId = listId;

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
            title: this.title,
            description: this.description,
            duedate: new Date(this.#duedate),
            priority: this.#priority,
            isComplete: this.isComplete
        }
    }
}

export class TodoList {
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

    constructor({ title = "Main", id } = {}) {
        if (id === undefined) {
            this.#id = String(TodoList.#nextId());
        } else {
            TodoList.#addUsedId(id);
            this.#id = id;
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
}

export const todo = (function () {
    const items = {};
    const lists = {};

    lists[DEFAULT_LIST_ID] = new TodoList({
        title: "Main",
        id: DEFAULT_LIST_ID
    });

    const getItem = function (id) {
        const item = items[id];
        if (!item) {
            throw new Error(`Item ${id} not found.`);
        }

        if (!item.listTitle) {
            item.listTitle = getList(item.listId).title
        };
        return item;
    }

    const getList = function (id) {
        const list = lists[id];
        if (!list) {
            throw new Error(`List ${id} not found.`);
        }
        return list;
    }

    const getItems = function ({ listId, filter, sort } = {}) {
        let itemsToGet = Object.values(items).map(item => {
            // populate with list titles if necessary
            if (!item.listTitle) {
                item.listTitle = getList(item.listId).title;
            }
            return item;
        });

        if (listId !== "all") {
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

    const getLists = function () {
        return Object.values(lists);
    }

    const addItem = function (info) {
        const item = new TodoItem(info);
        items[item.id] = item;
        return item;
    }

    const editItem = function (id, fieldsToEdit) {
        const item = items[id];
        if (!item) return;

        const skipFields = new Set(["id", "isComplete"]);

        for (const [field, value] of Object.entries(fieldsToEdit)) {
            if (skipFields.has(field)) continue;
            if (field in item) item[field] = value;
        }

        return item;
    }

    const removeItem = function (id) {
        if (id in items) {
            delete items[id];
        }
    }

    const moveItem = function (itemId, targetListId) {
        if (!lists[targetListId]) {
            throw new Error(`List ${targetListId} not found.`);
        }
        const item = items[itemId];
        if (!item) return;
        item.listId = targetListId;
        item.listTitle = getList(targetListId).title;
    }

    const addList = function (title) {
        const list = new TodoList({ title });
        lists[list.id] = list;
        return list;
    }


    const removeList = function (id) {
        const list = lists[id];
        if (!list) {
            console.log("Couldn't find list to delete: ", id);
        }

        // Don't allow deletion of disallowed liists
        if (!list.canDelete) {
            return;
        }

        delete lists[id];

        // Move items to default list
        const listItems = getItems({ listId: id });
        listItems.forEach(item => moveItem(item.id, DEFAULT_LIST_ID));
        return { list, items: listItems };
    }


    return {
        getItem, getList,
        getItems, getLists,
        addItem, editItem, removeItem,
        addList, removeList,
    }
})();
