import { format } from "date-fns";

export function createTodoItemNode({ item } = {}) {
    const itemNode = createNode({ classes: ["todo-item"] });

    const left = createNode({ classes: ["todo-item-left"] });
    const checkbox = createNode({ type: "input" });
    checkbox.type = "checkbox";
    checkbox.ariaLabel = "item completion toggle";
    left.append(checkbox);

    const body = createNode({ classes: ["todo-item-body"] });
    const main = createNode({ classes: ["todo-item-main"] });

    main.append(
        createNode({ classes: ["todo-item-title"] }),
        createNode({ classes: ["todo-item-duedate"] })
    );

    const expandButton = createNode({ type: "button", classes: ["expand"] });
    expandButton.ariaLabel = "toggle details";
    expandButton.ariaExpanded = "false";
    main.append(expandButton);

    const details = createNode({ classes: ["todo-item-details", "hidden"] });
    details.append(createNode({ classes: ["todo-item-description"] }));

    const bottom = createNode({ classes: ["todo-item-bottom"] });
    bottom.append(
        createNode({ classes: ["todo-item-priority"] }),
        createNode({ type: "button", classes: ["edit"], text: "Edit" })
    );
    details.append(bottom);

    body.append(main, details);
    itemNode.append(left, body);

    expandButton.addEventListener("click", () => { toggleDetails(expandButton, details) })

    if (item) {
        return renderItemNode(itemNode, item);
    }
    return itemNode;
}

function renderItemNode(itemNode, item) {
    const titleNode = itemNode.querySelector('.todo-item-title');
    titleNode.textContent = item.title;

    const dueDateNode = itemNode.querySelector('.todo-item-duedate');
    dueDateNode.textContent = formatDueDate(item.dueDate);

    const descriptionNode = itemNode.querySelector('.todo-item-description');
    descriptionNode.textContent = item.description ?? "";

    const priorityNode = itemNode.querySelector('.todo-item-priority');
    priorityNode.textContent = `Priority ${item.priority}`;

    return itemNode;
}

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
    return `due ${format(date, "MMM. d")}`;
}

function toggleDetails(expandButton, detailsNode) {
    if (!expandButton || !detailsNode) return;

    const expanded = expandButton.getAttribute("aria-expanded") === "true";
    expandButton.setAttribute("aria-expanded", !expanded);

    detailsNode.style.maxHeight = expanded ? "0px" : `${detailsNode.scrollHeight}px`;
    detailsNode.classList.toggle("hidden", expanded);
}

// Forms

export class ItemDetailsForm {
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
        rightNode.append(...this.createButtons());
        return rightNode;
    }

    createButtons() {
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

export class ItemEditForm extends ItemDetailsForm {
    constructor() {
        super();
    }

    createButtons() {
        const buttons = super.createButtons();
        return [this.createDeleteButton(), ...buttons];
    }

    createDeleteButton() {
        return createNode({ type: "button", classes: ["delete"], text: "Delete" });
    }
}



// <form class="todo-item ">
//     <div class="form-control">
//         <label for="new-item-title">Title</label>
//         <input type="text" id="new-item-title">
//     </div>
//     <div class="form-control">
//         <label for="new-item-description">Description</label>
//         <input type="text" id="new-item-description">
//     </div>
//     <div class="form-bottom">
//         <div class="form-bottom-left">
//             <div class="form-control">
//                 <label for="new-item-duedate">Due Date</label>
//                 <input type="date" id="new-item-duedate">
//             </div>
//             <div class="form-control">
//                 <label for="new-item-priority">Priority</label>
//                 <input type="number" id="new-item-priority">
//             </div>
//         </div>
//         <div class="form-bottom-right">
//             <button class="cancel">Cancel</button>
//             <button class="save primary">Save</button>
//         </div>
//     </div>
// </form>
