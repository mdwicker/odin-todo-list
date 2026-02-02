import "./reset.css";
import "./styles.css";
import { TodoItem, TodoList } from './todo.js'

let item = new TodoItem({
    title: "work",
    description: "Lots to do",
    dueDate: "Feb 4 2026",
    priority: 2,
})


let list = new TodoList();
list.title = "stuff";
list.addItems([item]);



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