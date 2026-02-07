import { add, format } from "date-fns";
import { pubSub, events } from "./pubSub.js";


export const createDomController = function (lists) {
    setupTodoItems();
    setupNavList();
    setupAddItemForm(lists);

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
            && container.lastElementChild.tagName !== "BUTTON"
            && container.lastElementChild.tagName !== "FORM") {
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
    });
}

function setupAddItemForm(lists) {
    const addItemBtn = document.getElementById("add-item");
    const addItemForm = new ItemDetailsForm({
        lists, item: {
            id: 5, title: "New", description: "Hi there", listId: 2, priority: 5, dueDate: new Date()
        }
    });

    // initialize hidden form
    const formNode = addItemForm.node;
    formNode.classList.add("hidden");
    addItemBtn.after(formNode);


    // replace button with form on button click
    addItemBtn.addEventListener("click", () => {
        formNode.classList.remove("hidden");
        addItemBtn.classList.add("hidden");
    });

    // replace form with button on submit
    formNode.addEventListener("submit", () => {
        formNode.classList.add("hidden");
        addItemBtn.classList.remove("hidden");
    })

    // addItemForm.cancelBtn.addEventListener("click", () => {

    // process results
    // pubSub.publish(events.formSave, { data: new FormData(addItemForm) });
    // reset and hide

    // addItemForm.reset();

    // addItemForm.classList.add("hidden");
    // button.classList.add("hidden");
    // })
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


// Item Details Form

export class ItemDetailsForm {
    #item;

    constructor({ item, lists } = {}) {
        this.#item = item;

        this.lists = lists;
        this.node = createNode({ type: "form", classes: ["todo-item"] });
        this.node.append(
            this.#createTitleInput(),
            this.#createListInput(),
            this.#createDescriptionInput(),
            this.#createFormBottom()
        );

        this.node.addEventListener("submit", (e) => {
            e.preventDefault();
            const submitBtn = e.submitter.value;

            if (submitBtn === "save") {
                this.#save();
            } else if (submitBtn === "cancel") {
                this.#cancel();
            } else if (submitBtn === "delete") {
                this.#delete();
            }

            this.node.reset();
        })
    }

    #createFormBottom() {
        const bottomNode = createNode({ classes: ["form-bottom"] });
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
        const buttons = [];
        if (this.#item) buttons.push(this.#createDeleteButton());
        buttons.push(
            this.#createCancelButton(),
            this.#createSaveButton()
        );
        return buttons;
    }

    #createTitleInput() {
        const label = createNode({ type: "label", text: "Title" });
        label.for = "new-item-title";
        const input = createNode({ type: "input", id: "new-item-title" });
        input.name = "title";
        input.type = "text";
        if (this.#item) input.value = this.#item.title;

        const titleNode = createNode({ classes: ["form-control"] });
        titleNode.append(label, input);
        return titleNode;
    }

    #createListInput() {
        const label = createNode({ type: "label", text: "List" });
        label.for = "new-item-list";
        const input = createNode({ type: "select", id: "new-item-list" });
        input.name = "list";

        for (const list of this.lists) {
            const option = createNode({ type: "option", text: list.title });
            option.value = list.id;
            input.append(option);
            if (this.#item && list.id === String(this.#item.listId)) {
                option.selected = true;
            }
        }

        // Update visible lists when lists are changed
        pubSub.subscribe(events.updateLists, (lists) => {
            while (input.lastElementChild) {
                input.removeChild(input.lastElementChild);
            }

            for (const list of this.lists) {
                const option = createNode({ type: "option", text: list.title });
                option.value = list.id;
                input.append(option);
            }
        });

        const listNode = createNode({ classes: ["form-control"] });
        listNode.append(label, input);
        return listNode;
    }

    #createDescriptionInput() {
        const label = createNode({ type: "label", text: "Description" });
        label.for = "new-item-description";
        const input = createNode({ type: "input", id: "new-item-description" });
        input.name = "description";
        input.type = "text";
        if (this.#item) input.value = this.#item.description;

        const descriptionNode = createNode({ classes: ["form-control"] })
        descriptionNode.append(label, input);
        return descriptionNode;
    }

    #createDuedateInput() {
        const label = createNode({ type: "label", text: "Due Date" });
        label.for = "new-item-duedate";
        const input = createNode({ type: "input", id: "new-item-duedate" });
        input.name = "duedate";
        input.type = "date";
        if (this.#item) input.value = format(this.#item.dueDate, "yyyy-MM-dd");

        const duedateNode = createNode({ classes: ["form-control"] })
        duedateNode.append(label, input);
        return duedateNode;
    }

    #createPriorityInput() {
        const label = createNode({ type: "label", text: "Priority" });
        label.for = "new-item-priority";
        const input = createNode({ type: "input", id: "new-item-priority" });
        input.name = "priority";
        input.type = "number";
        if (this.#item) input.value = this.#item.priority;

        const priorityNode = createNode({ classes: ["form-control"] })
        priorityNode.append(label, input);
        return priorityNode;
    }

    #createCancelButton() {
        const cancelBtn = createNode({ type: "button", classes: ["cancel"], text: "Cancel" });
        cancelBtn.value = "cancel";
        return cancelBtn;
    }

    #createSaveButton() {
        const saveBtn = createNode({ type: "button", classes: ["save"], text: "Save" });
        saveBtn.value = "save";
        return saveBtn;
    }

    #createDeleteButton() {
        const delBtn = createNode({ type: "button", classes: ["delete"], text: "Delete" });
        delBtn.value = "delete";
        return delBtn;
    }

    #save() {
        const form = {
            data: new FormData(this.node),
            id: this.#item ? this.#item.id : null
        };

        pubSub.publish(events.saveDetails, form);
    }

    #cancel() {
        // Nothing to do
        return;
    }

    #delete() {
        if (!this.#item) {
            // No item to delete
            return;
        }

        if (confirm(`Are you sure you want to delete the item "${this.#item.title}"?`)) {
            pubSub.publish(events.deleteItem, this.#item.id);
        }
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
