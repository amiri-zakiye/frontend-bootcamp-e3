function debounce(callback, delay) {
    let timerId;
    return (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => callback(...args), delay);
    };
}

class AbortManager {
    constructor() {
        this.abortController = null;
    }

    getAbortController() {
        this.abortController = new AbortController();
        return this.abortController;
    }

    abort() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}

class Fetcher {
    constructor(url) {
        this.url = url;
    }

    async fetchData(abortSignal) {
        try {
            const response = await fetch(this.url, { signal: abortSignal });
            if (!response.ok) {
                throw new Error(`HTTP error; ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (error.name === "AbortError") {
                console.log("Fetch request aborted");
            } else {
                console.error("Fetch error:", error);
            }
            return null;
        }
    }
}

class SearchManager {
    constructor(fetcher, abortManager) {
        this.fetcher = fetcher;
        this.abortManager = abortManager;
        this.lastSearchedValue = null;
    }

    async getFilteredProducts(searchTerm) {
        if (searchTerm === this.lastSearchedValue) return [];

        this.abortManager.abort();
        const abortController = this.abortManager.getAbortController();

        const data = await this.fetcher.fetchData(abortController.signal);
        this.lastSearchedValue = searchTerm;

        return data ? this.filterDataBySearchTerm(data, searchTerm) : [];
    }

    filterDataBySearchTerm(data, searchTerm) {
        return data.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    onSearch = async (searchTerm) => {
        return this.getFilteredProducts(searchTerm);
    };
}

class SearchUI {
    constructor(searchContainer) {
        this.searchContainer = searchContainer;
    }

    setLoadingIndicator() {
        this.searchContainer.classList.add("loading");
    }

    removeLoadingIndicator() {
        this.searchContainer.classList.remove("loading");
    }

    toggleSearchResults(visible) {
        if (visible) {
            this.searchContainer.classList.add("show");
        } else {
            this.searchContainer.classList.remove("show");
        }
    }

    displaySearchResults(data) {
        if (data.length > 0) {
            this.searchContainer.innerHTML = this.sortAlphabetically(data)
                .map(item => `<li id="${item.id}">${item.name}</li>`)
                .join("");
        } else {
            this.searchContainer.innerHTML = "No results found";
        }
        this.toggleSearchResults(true);
    }

    sortAlphabetically(array) {
        return [...array].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );
    }
}

const MainController = {
    state: {
        container: null,
        input: null,
        searchContainer: null,
        searchManager: null,
        searchUI: null,
        fetcher: null,
        abortManager: null,
        debounceTime : 500
    },

    init() {

        this.state.container = document.querySelector(".container");
        this.state.input = document.querySelector(".input");
        this.state.searchContainer = document.querySelector(".searchContainer");

        this.state.fetcher = new Fetcher("https://5f87f81549ccbb0016177d0d.mockapi.io/products");
        this.state.abortManager = new AbortManager();
        this.state.searchUI = new SearchUI(this.state.searchContainer);
        this.state.searchManager = new SearchManager(this.state.fetcher, this.state.abortManager);

        this.setupListeners();
    },

     searchEventHandler : async function(e) {
         const {searchManager, searchUI } = this.state;
         const searchTerm = e.target.value.trim();
        searchUI.setLoadingIndicator();
        const data = await searchManager.onSearch(searchTerm);
        searchUI.removeLoadingIndicator();
        searchUI.displaySearchResults(data);
    },

    setupListeners() {
        const { input, container, searchUI,searchContainer, debounceTime } = this.state;

        input.addEventListener("input",  debounce(this.searchEventHandler.bind(this),debounceTime));
        input.addEventListener("click", (e) => e.stopPropagation());
        searchContainer.addEventListener("click", (e) => e.stopPropagation());
        container.addEventListener("click", () => searchUI.toggleSearchResults(false));
    },
};

document.addEventListener("DOMContentLoaded", () => MainController.init());
