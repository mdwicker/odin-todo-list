import { format } from "date-fns";

export class TodoItem {
    static usedIds = new Set();

    static #addUsedId(id) {
        if (this.usedIds.has(id)) {
            throw new Error(`ID ${id} already used.`)
        }
        else this.usedIds.add(String(id));
    }

    static #nextId() {
        const id = Math.max(0, ...this.usedIds) + 1;
        this.#addUsedId(id);
        return id;
    }

    #id;
    listId;
    #title;
    #description;
    #dueDate;
    #priority;
    #isComplete;

    constructor({ id, listId = "1", title, description, dueDate, priority, isComplete } = {}) {
        if (id === undefined) {
            this.#id = String(TodoItem.#nextId());
        } else {
            TodoItem.#addUsedId(id);
            this.#id = String(id);
        }
        this.listId = listId;

        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.#isComplete = isComplete ?? false;
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
            this.#title = String(title);
        };
    }

    get description() {
        return this.#description;
    }

    set description(description) {
        if (!description) {
            this.#description = "";
        } else {
            this.#description = String(description);
        }
    }

    get dueDate() {
        return this.#dueDate;
    }

    set dueDate(dueDate) {
        if (dueDate === undefined) {
            this.#dueDate = new Date();
        } else {
            const date = new Date(dueDate);
            if (isNaN(date)) {
                throw new Error(`${dueDate} is not a valid date.`);
            }
            this.#dueDate = date;
        }
    }

    get priority() {
        return this.#priority
    }

    set priority(priority) {
        if (priority === undefined) {
            this.#priority = 0;
        } else {
            priority = Number(priority);

            if (!Number.isInteger(priority) || priority < 0 || priority > 5) {
                throw new Error("Priority must be an integer between 0 and 5.");
            }

            this.#priority = priority;
        }
    }

    toggleComplete({ complete } = {}) {
        if (complete === undefined) {
            this.#isComplete = !this.#isComplete;
        } else {
            this.#isComplete = complete;
        }
    }

    get isComplete() {
        return this.#isComplete;
    }

    toJson() {
        return {
            id: this.#id,
            listId: this.listId,
            title: this.title,
            description: this.description,
            dueDate: format(this.#dueDate, "yyyy-MM-dd"),
            priority: String(this.priority),
            isComplete: this.#isComplete
        }
    }
}

export class TodoList {
    static usedIds = new Set();

    static #addUsedId(id) {
        this.usedIds.add(String(id));
    }

    static #nextId() {
        const id = Math.max(0, ...this.usedIds) + 1;
        this.#addUsedId(id);
        return id;
    }

    #id;
    #title;

    constructor({ title = "Main", id } = {}) {
        if (id === undefined) {
            this.#id = String(TodoList.#nextId());
        } else {
            TodoList.#addUsedId(id);
            this.#id = String(id);
        }
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
            this.#title = title;
        }
    }

    toJson() {
        return {
            id: this.#id,
            title: this.#title,
        }
    }
}

export const todoController = (function () {
    const items = {};
    const lists = {};

    lists["1"] = new TodoList({ title: "Main List", id: "1" });

    const getItem = function (id) {
        const item = items[String(id)];
        if (!item) {
            throw new Error(`Item ${id} not found.`);
        }
        return item;
    }

    const getList = function (id) {
        const list = lists[String(id)];
        if (!list) {
            throw new Error(`List ${id} not found.`);
        }
        return list;
    }

    const getItems = function ({ listId, filter, sort } = {}) {
        let itemsToGet = Object.values(items);

        if (listId) {
            itemsToGet = itemsToGet.filter(item => item.listId === String(listId));
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
        items[String(item.id)] = item;
        return item;
    }

    const editItem = function (id, fieldsToEdit) {
        const item = getItem(id)

        const skipFields = new Set(["id", "listId", "isComplete"]);

        for (const [field, value] of Object.entries(fieldsToEdit)) {
            if (skipFields.has(field)) continue;
            if (field in item) item[field] = value;
        }

        return item;
    }

    const toggleItemCompletion = function (id, { complete } = {}) {
        const item = getItem(id);
        item.toggleComplete({ complete });
    }

    const removeItem = function (id) {
        if (id in items) {
            delete items[String(id)];
        }
    }

    const moveItem = function (itemId, targetListId) {
        if (!lists[String(targetListId)]) {
            throw new Error(`List ${targetListId} not found.`);
        }
        const item = getItem(itemId);
        item.listId = String(targetListId);
    }

    const addList = function (info) {
        const list = new TodoList(info);
        lists[String(list.id)] = list;
        return list;
    }

    const editList = function (id, fieldsToEdit) {
        const list = getList(id);

        for (const field in fieldsToEdit) {
            if (field in list) {
                list[field] = fieldsToEdit[field];
            }
        }

        return list;
    }

    const removeList = function (id) {
        if (id == "1") {
            return; // Cannot delete Main list.
        }
        const list = getList(id);
        delete lists[String(list.id)];
        const listItems = getItems({ listId: id });
        listItems.forEach(item => removeItem(item.id));
        return { list, items: listItems };
    }


    return {
        getItem, getList, getItems, getLists,
        addItem, removeItem, editItem, moveItem, toggleItemCompletion,
        addList, editList, removeList,
    }
})();
