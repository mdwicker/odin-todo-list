// Initialize view options

const DEFAULT_LIST = "all";


const viewStorage = (function () {
    const VIEWOPTIONS = "viewOptions";

    initializeStorage();


    function getList() {
        return get(VIEWOPTIONS)["list"] || "";
    }

    function saveList(list) {
        const view = get(VIEWOPTIONS) || {};
        view["list"] = list;
        save({ key: VIEWOPTIONS, data: view });
    }

    function getOption(option) {
        const options = get(VIEWOPTIONS)["options"];
        if (option in options) {
            return options[option];
        } else {
            return null;
        }
    }

    function saveOption({ option, selection }) {
        const view = get(VIEWOPTIONS) || {};
        const options = view["options"] || {};
        options[option] = selection;
        save({ key: VIEWOPTIONS, data: view });
    }

    function get(key) {
        const data = localStorage.getItem(key);

        if (!data) {
            console.log("Could not get local storage data.");
            return {};
        }

        return JSON.parse(data);
    }

    function save({ key = VIEWOPTIONS, data = {} } = {}) {
        if (storageAvailable("localStorage")) {
            localStorage.setItem(key, JSON.stringify(data));
        } else {
            console.log("Sorry, no local storage available.");
        }
    }

    function initializeStorage() {
        if (!(VIEWOPTIONS in localStorage)) {
            save({ key: VIEWOPTIONS });
        }

        const view = get(VIEWOPTIONS);

        if (!("list" in view)) {
            view["list"] = "";
        }

        if (!("options" in view)) {
            view["options"] = {};
        }

        save({ key: VIEWOPTIONS, data: view });
    }

    function storageAvailable(type) {
        let storage;
        try {
            storage = window[type];
            const x = "__storage_test__";
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return (
                e instanceof DOMException &&
                e.name === "QuotaExceededError" &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage &&
                storage.length !== 0
            );
        }
    }

    return {
        getList, saveList,
        getOption, saveOption
    }
})();


const viewQuery = (function () {
    let list = viewStorage.getList() || DEFAULT_LIST;
    const options = {
        "duedateFilter": viewStorage.getOption("duedateFilter") || "all",
        "priorityFilter": viewStorage.getOption("priorityFilter") || "all",
        "completionFilter": viewStorage.getOption("completionFilter") || "all",
        "sortBy": viewStorage.getOption("sortBy") || "duedate",
        "sortOrder": viewStorage.getOption("sortOrder") || "desc",
    }

    function setActiveList(targetList) {
        list = targetList.id ?? targetList;
        viewStorage.saveList(list);
    }

    function setOptions({ option, selection } = {}) {
        if (!(option in options)) {
            throw new Error(`Option ${option} does not exist in viewQuery.`);
        }

        options[option] = selection;
        viewStorage.saveOption({ option, selection });
    }

    function filter(item) {
        if (options.duedateFilter !== "all") {
            if (!duedateFilter(item, options.duedateFilter)) return false;
        }

        if (options.priorityFilter !== "all") {
            const priority = Number(options.priorityFilter);
            if (!item.matchesPriority(priority)) return false;
        }

        if (options.completionFilter !== "all") {
            let completeFilter;

            // normalize input from UI
            if (options.completionFilter === "true") completeFilter = true;
            if (options.completionFilter === "false") completeFilter = false;

            if (!(item.isComplete === completeFilter)) return false;
        }

        return true;
    }

    function sort(a, b) {
        let comparison;

        if (options.sortBy === "duedate") {
            comparison = a.compareDuedate(b);
        } else if (options.sortBy === "priority") {
            comparison = a.comparePriority(b);
        }

        if (!comparison) comparison = a.id - b.id;

        if (options.sortOrder === "asc") {
            return comparison;
        } else if (options.sortOrder === "desc") {
            return comparison * -1;
        } else {
            console.log(`${options.sortOrder} is not a valid sort order. Should be 'asc' or 'desc'.`);
            return comparison;
        }
    }

    function duedateFilter(item, dateFilter) {
        const filters = {
            "overdue": () => item.isOverdue(),
            "today": () => item.isDueInExactly(0),
            "tomorrow": () => item.isDueInExactly(1),
            "week": () => item.isDueWithin(7),
            "month": () => item.isDueWithin(30)
        }

        if (dateFilter === "all") return true;
        if (!(dateFilter in filters)) return true;

        return filters[dateFilter]();
    }

    function getOptions() {
        return { ...options };
    }


    return {
        setActiveList, setOptions,
        get listId() {
            if (list === "all") return null;
            return Number(list);
        },
        getOptions,
        filter, sort,
    }
})();

export default viewQuery;