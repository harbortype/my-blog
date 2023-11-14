var searchIndex = null;
var searchUI = document.querySelector(".search-ui")
var resultsUI = document.querySelector(".results-ui")
var searchInput = document.querySelector("#search-str")

function clearResults() {
  while (resultsUI.firstChild) {
    resultsUI.removeChild(resultsUI.firstChild);
  }
}

// Custom button click event handler
function buttonHandler(selector, callback) {
  var button = document.querySelector(selector);
  if (!button) { return; }
  button.addEventListener("click", event => {
    event.preventDefault();
    callback();
  }, false);
}

// Function used to search the searchIndex
function find(str) {
  // Make it lowercase
  str = str.toLowerCase();
  // Look for matches in the JSON
  var results = [];
  for (var item in searchIndex) {
    var found = searchIndex[item].text.indexOf(str);
    if (found != -1) {
      results.push(searchIndex[item])
    }
  }
  // Build and insert the new result entries
  clearResults();
  for (var item in results) {
    var listItem = document.createElement("li");
    var link = document.createElement("a");
    link.textContent = results[item].title;
    link.setAttribute("href", results[item].url);
    listItem.appendChild(link);
    resultsUI.appendChild(listItem);
  }
}

buttonHandler("#search-link", () => {
  // Get the data
  fetch("/search.json").then(response => {
    return response.json();
  }).then(response => {
    searchIndex = response.search;
  });
  // Show the search UI and focus on the text field
  searchUI.classList.toggle("invisible");
  searchInput.focus();
  // Listen for input changes
  searchInput.addEventListener("keyup", event => {
    var str = searchInput.value;
    if (str.length > 2) {
      find(str);
    } else {
      clearResults();
    }
  });
});

