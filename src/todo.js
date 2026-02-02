import { format } from "date-fns";

export class TodoItem {
    static usedIds = new Set();

    static addUsedId(id) {
        if (this.usedIds.has(id)) {
            throw new Error(`ID ${id} already used.`)
        }
        else this.usedIds.add(id);
    }

    static nextId() {
        const id = Math.max(0, ...this.usedIds) + 1;
        this.addUsedId(id);
        return id;
    }

    #id;
    listId;
    #title;
    #description;
    #dueDate;
    #priority;
    #isComplete;

    constructor({ title, listId = 1, description, dueDate, priority, isComplete } = {}) {
        this.#id = TodoItem.nextId();
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
            title: this.title,
            description: this.description,
            dueDate: format(this.#dueDate, "yyyy-MM-dd"),
            priority: String(this.priority),
            isComplete: this.#isComplete
        }
    }
}

export class TodoList {
    #id;
    #title;
    #items = [];

    static usedIds = new Set();

    static addUsedId(id) {
        if (this.usedIds.has(id)) {
            throw new Error(`ID ${id} already used.`)
        }
        else this.usedIds.add(id);
    }

    static nextId() {
        const id = Math.max(0, ...this.usedIds) + 1;
        this.addUsedId(id);
        return id;
    }

    constructor({ title = "Main", items = [], id } = {}) {
        if (id === undefined) {
            this.#id = TodoList.nextId();
        } else {
            TodoList.addUsedId(id);
            this.#id = id;
        }
        this.title = title;
        // this.addItems(items);
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

    addItems(items) {
        if (items) {
            this.#items.push(
                ...items.map(item => {
                    if (item instanceof TodoItem) return item;
                    return new TodoItem(item);
                })
            )
        }
    }

    getItems({ filter, sort } = {}) {
        let items = [...this.#items];
        if (filter) {
            items = items.filter(filter);
        }
        if (sort) {
            items = items.sort(sort);
        }
        return items;
    }

    itemsToJson() {
        return this.#items.map(item => item.toJson());
    }

    toJson() {
        return {
            id: this.#id,
            title: this.#title,
            items: this.itemsToJson()
        }
    }
}

/*
Other stuff that needs doing here:
- Creating and deleting todo items (which means STORING somewhere)
- Creating and deleting todo lists
- initializing the General/Main/something list
- handling item storage?
- responding to queries about todo lists and items? probably.

SO is all that something that should be in another module/class/iife/something
of that sort? idk, for now I'm leaning toward NOT, honestly.
*/