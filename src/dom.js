import { add, format } from "date-fns";
import { pubSub, events } from "./pubSub.js";


export const createDomController = function (items, lists) {
    addTodoItems(items)
    setupNavList();

    for (const list of lists) {
        pubSub.publish(events.addList, list)
    }

    pubSub.publish(events.updateDisplayItems, { items });

    const listTitleNode = document.querySelector(".list-title");
}

const setupNavList = (() => {
    const listNodes = {};
    const navList = document.querySelector('.nav-list');
    let currentList;

    const allItems = document.getElementById("all-items");
    listNodes["all"] = allItems;
    allItems.addEventListener("click", () => {
        pubSub.publish(events.changeList, { id: "all" });
    })

    pubSub.subscribe(events.setList, (list) => {
        if (list.id !== currentList) {
            listNodes[currentList].classList.remove("selected");
            listNodes[list.id].classList.add("selected");

            currentList = list.id;
        }
    });

    pubSub.subscribe(events.addList, (list) => {
        const listNode = createNode({ type: "li", class: "nav-link", text: list.title });
        listNodes[list.id] = listNode;
        navList.append(listNode);

        listNode.addEventListener("click", () => {
            pubSub.publish(events.changeList, { id: list.id });
        });
    });
})()

const setupTodoItems = (() => {
    let itemNodes = {}
    const container = document.querySelector('.todo-items');

    pubSub.subscribe
})

function addTodoItems(items) {
    for (const item of items) {
        const itemNode = new TodoItemNode({ item: item });
        itemsContainer.append(itemNode.node);
        itemNodes[item.id] = itemNode;
    }
}


// Todo Items

export class TodoItemNode {
    #title;
    #description;
    #duedate;
    #priority;

    #expandBtn;
    #details;

    #editBtn;
    #checkbox;

    constructor({ item = {} }) {
        this.node = createNode({ classes: ["todo-item"] });
        this.node.append(
            this.#createLeft(),
            this.#createBody()
        );
        this.#expandBtn.addEventListener("click", () => this.#toggleDetails());

        if (item) {
            this.render(item);
        }
    }

    #createLeft() {
        const left = createNode({ classes: ["todo-item-left"] });
        this.#checkbox = createNode({ type: "input" });
        this.#checkbox.type = "checkbox";
        this.#checkbox.ariaLabel = "item completion toggle";
        left.append(this.#checkbox);

        return left;
    }

    #createBody() {
        const body = createNode({ classes: ["todo-item-body"] });
        this.#details = this.#createDetails();
        body.append(
            this.#createMain(),
            this.#details
        );

        return body;
    }

    #createMain() {
        const main = createNode({ classes: ["todo-item-main"] });

        this.#title = createNode({ classes: ["todo-item-title"] });
        this.#duedate = createNode({ classes: ["todo-item-duedate"] });
        this.#expandBtn = this.#createExpandButton();

        main.append(
            this.#title,
            this.#duedate,
            this.#expandBtn
        );

        return main;
    }

    #createDetails() {
        const details = createNode({ classes: ["todo-item-details", "hidden"] });

        this.#description = createNode({ classes: ["todo-item-description"] })
        details.append(
            this.#description,
            this.#createBottom()
        );

        return details;
    }

    #createBottom() {
        const bottom = createNode({ classes: ["todo-item-bottom"] });
        this.#priority = createNode({ classes: ["todo-item-priority"] });
        this.#editBtn = createNode({ type: "button", classes: ["edit"], text: "Edit" });
        bottom.append(
            this.#priority,
            this.#editBtn
        );

        return bottom;
    }

    #createExpandButton() {
        const expandButton = createNode({ type: "button", classes: ["expand"] });
        expandButton.ariaLabel = "toggle details";
        expandButton.ariaExpanded = "false";
        return expandButton;
    }

    #toggleDetails() {
        if (!this.#expandBtn || !this.#details) return;

        const expanded = this.#expandBtn.getAttribute("aria-expanded") === "true";
        this.#expandBtn.setAttribute("aria-expanded", !expanded);

        this.#details.style.maxHeight = expanded ? "0px" : `${this.#details.scrollHeight}px`;
        this.#details.classList.toggle("hidden", expanded);
    }

    render(item) {
        this.#title.textContent = item.title;
        this.#duedate.textContent = formatDueDate(item.dueDate);
        this.#description.textContent = item.description ?? "";
        this.#priority.textContent = `Priority ${item.priority}`;
        this.#checkbox.checked = item.isComplete;
    }

}


// Forms

class ItemDetailsForm {

    constructor() {
        this.node = createNode({ type: "form", classes: ["todo-item"] });
        this.node.append(
            this.#createTitleInput(),
            this.#createDescriptionInput(),
            this.#createFormBottom()
        );
    }

    #createFormBottom() {
        const bottomNode = createNode({ classes: ["form-bottom"] })
        bottomNode.append(
            this.#createFormBottomLeft(),
            this.#createFormBottomRight()
        );
        return bottomNode;
    }

    #createFormBottomLeft() {
        const leftNode = createNode({ classes: ["form-bottom-left"] })
        leftNode.append(
            this.#createDuedateInput(),
            this.#createPriorityInput()
        );
        return leftNode;
    }

    #createFormBottomRight() {
        const rightNode = createNode({ classes: ["form-bottom-right"] })
        rightNode.append(...this.#createButtons());
        return rightNode;
    }

    #createButtons() {
        return [this.#createCancelButton(), this.#createSaveButton()];
    }

    #createTitleInput() {
        const label = createNode({ type: "label", text: "Title" });
        label.for = "new-item-title";
        const input = createNode({ type: "input", id: "new-item-title" });
        input.type = "text";

        const titleNode = createNode({ classes: ["form-control"] });
        titleNode.append(label, input);
        return titleNode;
    }

    #createDescriptionInput() {
        const label = createNode({ type: "label", text: "Description" });
        label.for = "new-item-description";
        const input = createNode({ type: "input", id: "new-item-description" });
        input.type = "text";

        const descriptionNode = createNode({ classes: ["form-control"] })
        descriptionNode.append(label, input);
        return descriptionNode;
    }

    #createDuedateInput() {
        const label = createNode({ type: "label", text: "Due Date" });
        label.for = "new-item-duedate";
        const input = createNode({ type: "input", id: "new-item-duedate" });
        input.type = "date";

        const duedateNode = createNode({ classes: ["form-control"] })
        duedateNode.append(label, input);
        return duedateNode;
    }

    #createPriorityInput() {
        const label = createNode({ type: "label", text: "Priority" });
        label.for = "new-item-priority";
        const input = createNode({ type: "input", id: "new-item-priority" });
        input.type = "number";

        const priorityNode = createNode({ classes: ["form-control"] })
        priorityNode.append(label, input);
        return priorityNode;
    }

    #createCancelButton() {
        return createNode({ type: "button", classes: ["cancel"], text: "Cancel" });
    }

    #createSaveButton() {
        return createNode({ type: "button", classes: ["save"], text: "Save" });
    }

}

export class EditItemForm extends ItemDetailsForm {
    constructor() {
        super();
        this.node.querySelector('.form-bottom-right')
            .prepend(this.#createDeleteButton());
    }

    #createDeleteButton() {
        return createNode({ type: "button", classes: ["delete"], text: "Delete" });
    }
}

export class AddItemForm extends ItemDetailsForm {
    constructor() {
        super();
    }
}


// Utilities

function createNode({ type = "div", classes, id, text } = {}) {
    const node = document.createElement(type);
    if (classes) {
        if (typeof classes === "string") return classes;
        for (const className of classes) {
            if (typeof (className) !== "string") {
                throw new Error(`${className} needs to be a string to be added as a class name.`);
            }
            node.classList.add(className);
        }
    }

    if (id) {
        if (typeof (id) !== "string") {
            throw new Error(`${id} needs to be a string to be added as an id.`);
        }
        node.id = id;
    }

    if (text) {
        node.textContent = text;
    }

    return node;
}

function formatDueDate(date) {
    if (date.getFullYear() === new Date().getFullYear()) {
        return `due ${format(date, "MMM. d")}`;
    }
    return `due ${format(date, "MMM. d, yyy")}`;
}

/*
Ok so....where is the State owned? I guess it can be owned...uhhhhhh....
here? in the dom? buuuuut state isn't really a DOM thing.
soooooo in index.js? yeah, maybe. then somehow, the dom responds
to changes in state. ohhhh yeah. Ok. Ohhhh maybe now we're cooking?
I can have the state thing send out pings with changes in state,
and all I have to do right now is wire in how things will
respond to changes in state.

k, so now that works with the list nav stuff.

NOW how about items? the items live in the todo.js. When we need to display something,
we get told what to display. So, the two things we might need to know are:
refresh this particular item with this info, and refres the whole list with these items.
*/