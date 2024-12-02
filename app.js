const endpointUrl = "https://5f87f81549ccbb0016177d0d.mockapi.io/products";
let abortController = null;
let lastSearchedValue = null;

const body = document.querySelector("body");
const input = document.querySelector("input");
const ul = document.querySelector("ul");

const toggleSearchResults = (visible) => {
    if(visible){
        ul.classList.add("show")
    }else{
        ul.classList.remove("show")
    }
};

const debounce = (callback, delay) => {
    let timerId;
    return (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => callback(...args), delay);
    };
};

const fetchData = async (url) => {
    if (abortController) {
        abortController.abort();
    }

    abortController = new AbortController();

    try {
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) {
            throw new Error(`HTTP error; ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Fetch request aborted");
        } else {
            console.error("Fetch error", error);
        }
        return null;
    }
};

const getFilteredProducts = async (searchTerm) => {
    if (searchTerm === lastSearchedValue) return;
    const data = await fetchData(endpointUrl);
    lastSearchedValue  = searchTerm
    return data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
};

const sortAlphabetically = (array) =>
    [...array].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

const displaySearchResults = (data) => {
    if(data.length > 0){
        ul.innerHTML = sortAlphabetically(data)
            .map((item) => `<li id="${item.id}">${item.name}</li>`)
            .join("");
    }else{
        ul.innerHTML = "No results found";
    }
    toggleSearchResults(true);
};

const setLoadingIndicator = () => {
    ul.classList.add("loading")
}
const removeLoadingIndicator = () => {
    ul.classList.remove("loading")
}

const onSearch = debounce(async (event) => {
    const searchTerm = event.target.value.trim();
    setLoadingIndicator()
    const data = await getFilteredProducts(searchTerm);
    removeLoadingIndicator()
    displaySearchResults(data);
}, 500);

input.addEventListener("input", onSearch);
input.addEventListener("click", (e) => e.stopPropagation());
ul.addEventListener("click", (e) => e.stopPropagation());
body.addEventListener("click", () => toggleSearchResults(false));