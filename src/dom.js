import { add, format } from "date-fns";
import { pubSub, events } from "./pubSub.js";


export const createDomController = function (lists) {
    setupTodoItems();
    setupNavList();

    for (const list of lists) {
        pubSub.publish(events.addList, list)
    }
}

function setupNavList() {
    const listNodes = {};
    const navList = document.querySelector('.nav-list');
    const listTitleNode = document.querySelector('.list-title');
    let currentList;

    const allItems = document.getElementById("all-items");
    listNodes["all"] = allItems;
    allItems.addEventListener("click", () => {
        pubSub.publish(events.changeList, { id: "all" });
    })

    pubSub.subscribe(events.setList, (list) => {
        if (!currentList) {
            listNodes[list.id].classList.add("selected");
            currentList = list.id;
        } else if (list.id !== currentList) {
            listNodes[currentList].classList.remove("selected");
            listNodes[list.id].classList.add("selected");
            currentList = list.id;
        }
        listTitleNode.textContent = list.title;
    });

    pubSub.subscribe(events.addList, (list) => {
        const listNode = createNode({ type: "li", classes: ["nav-link"], text: list.title });
        listNodes[list.id] = listNode;
        navList.append(listNode);

        listNode.addEventListener("click", () => {
            pubSub.publish(events.changeList, { id: list.id });
        });
    });
}

function setupTodoItems() {
    let itemNodes = {}
    const container = document.querySelector('.todo-items');

    pubSub.subscribe(events.updateDisplayItems, (items) => {
        // clear  items from cache
        itemNodes = {};

        // clear current items from DOM
        while (container.lastElementChild
            && container.lastElementChild.tagName !== "BUTTON") {
            container.removeChild(container.lastElementChild);
        }

        // add new items
        for (const item of items) {
            const itemNode = new TodoItemNode({ item });
            itemNodes[item.id] = itemNode;
            container.append(itemNode.node);
        }
    });

    pubSub.subscribe(events.updateItem, (item) => {
        if (!(item.id in itemNodes)) return;
        itemNodes[item.id].render(item);
    })
}


// Todo Items

export class TodoItemNode {
    #title;
    #description;
    #duedate;
    #priority;
    #list;

    #expandBtn;
    #details;

    editBtn;
    checkbox;

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
        this.checkbox = createNode({ type: "input" });
        this.checkbox.type = "checkbox";
        this.checkbox.ariaLabel = "item completion toggle";
        left.append(this.checkbox);

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
        const mainLeft = createNode({ classes: ["todo-item-main-left"] });
        this.#title = createNode({ classes: ["todo-item-title"] });
        this.#list = createNode({ classes: ["todo-item-list"] });
        mainLeft.append(
            this.#title,
            this.#list
        );

        const mainRight = createNode({ classes: ["todo-item-main-right"] });
        this.#duedate = createNode({ classes: ["todo-item-duedate"] });
        this.#expandBtn = this.#createExpandButton();
        mainRight.append(
            this.#duedate,
            this.#expandBtn
        )

        const main = createNode({ classes: ["todo-item-main"] });
        main.append(mainLeft, mainRight);

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
        this.editBtn = createNode({ type: "button", classes: ["edit"], text: "Edit" });
        bottom.append(
            this.#priority,
            this.editBtn
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
        if (!item) {
            throw new Error("Item not given.");
        }
        this.#title.textContent = item.title;
        this.#list.textContent = item.listTitle;
        this.#duedate.textContent = formatDueDate(item.dueDate);
        this.#description.textContent = item.description ?? "";
        this.#priority.textContent = `Priority ${item.priority}`;
        this.checkbox.checked = item.isComplete;
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
        if (typeof classes === "string") {
            node.classList.add(classes);
        } else {
            for (const className of classes) {
                if (typeof (className) !== "string") {
                    throw new Error(`${className} needs to be a string to be added as a class name.`);
                }
                node.classList.add(className);
            }
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
    date = new Date(date);
    if (date.getFullYear() === new Date().getFullYear()) {
        return `due ${format(date, "MMM. d")}`;
    }
    return `due ${format(date, "MMM. d, yyy")}`;
}
