// taken from https://medium.com/@ignatovich.dm/implementing-the-pub-sub-pattern-in-javascript-a-guide-for-beginners-44714a76d8c7

class PubSub {
    constructor() {
        this.events = {};
    }

    // Subscribe to an event
    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    // Unsubscribe from an event
    unsubscribe(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(fn => fn !== callback);
    }

    // Publish an event
    publish(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

export const pubSub = new PubSub();
export const events = {
    changeSelectedList: "changeSelectedList",
    itemChecked: "itemChecked",
    addList: "addList",
    listsChanged: "listsChanged",
    saveItemDetails: "saveDetails",
    deleteItem: "deleteItem",
    changeViewOption: "changeViewOption"
}