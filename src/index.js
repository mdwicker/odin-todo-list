import "./reset.css";
import "./styles.css";
import { todoController } from './todo.js'


const fillerItems = [
    { title: "Laundry", description: "Wash and fold", dueDate: "2026-02-03", priority: 1 },
    { title: "Grocery Shopping", description: "Eggs, milk, bread", dueDate: "2026-02-04", priority: 3 },
    { title: "Fix Sink", description: "Leaky faucet in kitchen", dueDate: "2026-02-05", priority: 5 },
    { title: "Read Book", description: "Finish chapter 4", dueDate: "2026-02-03", priority: 0 },
    { title: "Gym Session", description: "Leg day", dueDate: "2026-02-06", priority: 2, isComplete: true },
    { title: "Doctor Appt", description: "Annual checkup", dueDate: "2026-02-15", priority: 4 },
    { title: "Call Mom", description: "Catch up", dueDate: "2026-02-08", priority: 1 },
    { title: "Pay Rent", description: "Don't be late!", dueDate: "2026-02-01", priority: 5, isComplete: true },
    { title: "Walk Dog", description: "Park route", dueDate: "2026-02-02", priority: 2 },
    { title: "Code Project", description: "Refactor TodoList", dueDate: "2026-02-10", priority: 4 },
    { title: "Mow Lawn", description: "Backyard only", dueDate: "2026-02-12", priority: 1 },
    { title: "Buy Gift", description: "Sarah's birthday", dueDate: "2026-02-18", priority: 3 },
    { title: "Car Wash", description: "Interior vacuum too", dueDate: "2026-02-14", priority: 0 },
    { title: "Dentist", description: "Cleaning at 2pm", dueDate: "2026-02-20", priority: 4 },
    { title: "Yoga", description: "30 min flow", dueDate: "2026-02-07", priority: 1 },
    { title: "Water Plants", description: "Check soil moisture", dueDate: "2026-02-09", priority: 0 },
    { title: "Organize Desk", description: "Clear the clutter", dueDate: "2026-02-11", priority: 2 },
    { title: "Meal Prep", description: "Chicken and rice", dueDate: "2026-02-08", priority: 3 },
    { title: "Study JS", description: "Practice Classes", dueDate: "2026-02-13", priority: 5 },
    { title: "Trash Day", description: "Take bins to curb", dueDate: "2026-02-05", priority: 2, isComplete: true }
];

for (const item of fillerItems) {
    todoController.addItem(item);
}

console.log(todoController.getItems())

/*
PLAN:

todo.js
- contains a TodoItem class
- contains a TodoList class (project? No, I like list)

DomManager.js
- Manages all the dom stuff, lol.
- initializes the page
- handles user requests
- MAYBE a pubsub? might be too complicated for this, but I'm just a big fan
    of the pattern, lol. 

Maybe instead I have a third module for wiring...or the main.js handles it, lol
it would request for certain buttons from the dom manager, and pass
requests to todo.js. It would also get the state from todo.js, and
serve it to DomManager.js. Yeah, that could work. Any buttons that are more than
just DISPLAY changes would run through that. Display change stuff
could just be handled by the DomManager tho.

question: where am I handling storage stuff? is that in index.js, or todo.js?
probably in todo.js, honestly.
*/