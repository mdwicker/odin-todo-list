class TodoItem {
    /*
    What am I gonna want in here?
    At minimum, per the brief:
     - title
     - description
     - dueDate
     - priority
    I also want:
     - type (email, phone call, etc). This could be just a couple of optional checkboxes.
     - notes (so you can note down information that will help accomplish it)
     - maybe checklist, for complex tasks.

    What should it be able to do?
     - be created, lol. really, that's handled elsewhere.
     - be edited? yes. this could be with seperate functions, in fact maybe better
     - so, settitle, setdescription, etc.
     - mark as coomplete/incomplete
    
    question: do I want todo items to be aware of what list they are on?
        -for now, I'm leaning toward no.
    */
    constructor() {

    }
}

class TodoList {
    /*
    Ok, what do I want included in here? This needs to be able to:
    add a todo item, remove a todo item. It probably should not
    be incharge of CREATING or DELETING items, just of handling
    whether or not they are on a particular list.
    It should also be able to sort items (maybe manually?).
    It needs to have a title, and honestly maybe that's about it...
    */
    constructor() {

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