import { format } from "date-fns";
import { pubSub, events } from "./pubSub.js";


export const createDomController = function ({ lists, items } = {}) {
    // set up currently state
    const itemNodes = {};
    const listNodes = {};

    // cache DOM elements
    const container = document.querySelector('.todo-items');
    const listHeader = document.querySelector('.list-title');
    const addListBtn = document.getElementById("add-list");

    // Initialize navigation list
    setupNavList();

    // Initialize view options
    setupViewOptions();

    // Initialize Add Item button
    setupAddItemForm(lists);

    // Initialize display items
    displayItems(items);


    function setupNavList() {
        // Set up add "all items" link
        listNodes["all"] = document.getElementById("all-items");
        listNodes["all"].addEventListener("click", () => {
            pubSub.publish(events.changeSelectedList, { id: "all" });
        });

        // Set up "add list" button
        const addListForm = createNode({ type: "form", id: "add-list-form" });
        const addListInput = createNode({ type: "input" });
        addListInput.name = "list-name";
        addListInput.ariaLabel = "new list input"
        addListForm.append(
            addListInput,
            createNode({ type: "button", classes: ["save"], text: "Save" })
        );
        addListBtn.addEventListener("click", () => {
            addListBtn.replaceWith(addListForm);
        });

        addListForm.addEventListener("submit", (e) => {
            e.preventDefault();
            let listName = addListInput.value;
            addListForm.reset();
            addListForm.replaceWith(addListBtn);

            if (listName) {
                // convert to title case
                listName = listName.toLowerCase();
                const words = listName.split(" ");
                const titleCased = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));

                listName = titleCased.join(" ");

                pubSub.publish(events.addList, listName);
            }
        })

        pubSub.subscribe(events.listsChanged, (lists) => updateLists(lists));

        updateLists(lists);
    }

    function setupViewOptions() {
        const viewOptions = document.querySelector(".view-options");
        viewOptions.querySelectorAll("select").forEach((viewOption) => {
            viewOption.addEventListener("change", () => {
                pubSub.publish(events.changeViewOption, {
                    option: viewOption.id,
                    value: viewOption.value
                })
            });
        });
    }

    function setupAddItemForm(lists) {
        const addItemBtn = document.getElementById("add-item");
        const addItemForm = new ItemDetailsForm({ lists });

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
    }

    function displayItems(items) {
        // Clear displayed items
        for (const [id, item] of Object.entries(itemNodes)) {
            item.node.remove();
            delete itemNodes[id];
        }

        // add new items
        for (const item of items) {
            const itemNode = new TodoItemNode({ item });
            itemNodes[item.id] = itemNode;

            itemNode.editBtn.addEventListener("click", () => {
                const editForm = new ItemDetailsForm({ item, lists });
                itemNode.node.replaceWith(editForm.node);
                editForm.node.addEventListener("submit", () => {
                    editForm.node.remove();
                })
            });

            container.append(itemNode.node);
        }
    };

    function removeItem(id) {
        if (id in itemNodes) {
            itemNodes[id].node.remove();
            delete itemNodes[id];
        } else {
            console.log(`Could not find item ${id} to delete.`);
        }
    };

    function updateItem(item) {
        if (item.id in itemNodes) {
            itemNodes[item.id].render(item);
        } else {
            console.log(`Could not find item ${item.id} to render`);
        }
    };

    function updateLists(newLists) {
        for (const [id, node] of Object.entries(listNodes)) {
            if (id !== "all") {
                node.remove();
                delete listNodes[id];
            }
        }

        for (const list of newLists) {
            const listNode = createNode({
                type: "li",
                classes: ["nav-link"],
            });

            const nodeContents = []

            const titleSpan = createNode({
                type: "span",
                text: list.title
            })

            nodeContents.push(titleSpan);

            // Don't allow user to delete the default list
            if (list.id !== "1") {
                const deleteSpan = createNode({
                    type: "span",
                    classes: ["delete-list"],
                    text: "ⓧ"
                });
                deleteSpan.ariaLabel = "Delete list";

                nodeContents.push(deleteSpan);
            }

            listNode.append(...nodeContents);

            listNodes[list.id] = listNode;
            addListBtn.before(listNode);

            listNode.addEventListener("click", (e) => {
                if (e.target.classList.contains("delete-list") &&
                    confirm(`Delete "${list.title}" list?`)) {
                    pubSub.publish(events.deleteList, list.id);
                } else {
                    pubSub.publish(events.changeSelectedList, { id: list.id });
                }
            });
        }

        lists = newLists;
    }

    function updateSelectedList(selected) {
        for (const [id, node] of Object.entries(listNodes)) {
            node.classList.toggle("selected", id == selected.id);
        }

        listHeader.textContent = selected.title;
    }

    return {
        displayItems, removeItem, updateItem,
        updateLists, updateSelectedList
    }
}





// Todo Items

export class TodoItemNode {
    #checkbox;
    #title;
    #description;
    #duedate;
    #priority;
    #list;

    #expandBtn;
    #details;

    editBtn;


    constructor({ item = {} }) {
        this.node = createNode({ classes: ["todo-item"] });
        this.node.append(
            this.#createLeft(),
            this.#createBody()
        );

        if (item) {
            this.render(item);
            this.#checkbox.addEventListener("change", () => {
                pubSub.publish(events.itemChecked, { id: item.id, checked: this.node.checked });
            })
        }

        this.#expandBtn.addEventListener("click", () => { this.#toggleDetails(); });
    }

    #createLeft() {
        const left = createNode({ classes: ["todo-item-left"] });
        const checkbox = this.#createCheckbox();
        left.append(checkbox);

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

    #createCheckbox() {
        this.#checkbox = createNode({ type: "input" });
        this.#checkbox.type = "checkbox";
        this.#checkbox.ariaLabel = "item completion toggle";
        return this.#checkbox;
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
        this.#duedate.textContent = formatDuedate(item.duedate);
        this.#description.textContent = item.description ?? "";
        this.#priority.textContent = `Priority ${item.priority}`;
        this.#checkbox.checked = item.isComplete;
    }
}


// Item Details Form

export class ItemDetailsForm {
    #titleInput;
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
        input.name = "listId";

        input.append(...this.#createListOptions(this.lists));

        pubSub.subscribe(events.listsChanged, (lists) => {
            while (input.lastElementChild) {
                input.removeChild(input.lastElementChild);
            }
            input.append(...this.#createListOptions(lists));
        })

        const listNode = createNode({ classes: ["form-control"] });
        listNode.append(label, input);

        return listNode;
    }

    #createListOptions(lists) {
        const options = []
        for (const list of lists) {
            const option = createNode({ type: "option", text: list.title });
            option.value = list.id;
            if (this.#item && list.id === String(this.#item.listId)) {
                option.selected = true;
            }

            options.push(option);
        }
        return options;
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
        input.defaultValue = format(new Date(), "yyyy-MM-dd");

        if (this.#item) {
            input.value = format(this.#item.duedate, "yyyy-MM-dd");
        }

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
        input.defaultValue = 1;
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

        pubSub.publish(events.saveItemDetails, form);
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

function formatDuedate(date) {
    date = new Date(date);
    if (date.getFullYear() === new Date().getFullYear()) {
        return `due ${format(date, "MMM. d")}`;
    }
    return `due ${format(date, "MMM. d, yyy")}`;
}
