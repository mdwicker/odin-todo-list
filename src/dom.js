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
