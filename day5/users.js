// ----- Select elements -----
const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

// All the users we loaded
let users = [];

// ----- Show a list of users on the page -----
function renderUsers(list) {
  // Empty the list first
  usersList.textContent = "";

  // Nothing to show
  if (list.length === 0) {
    const message = document.createElement("li");
    message.textContent = "No users match your filter.";
    usersList.appendChild(message);
    return;
  }

  list.forEach(function (user) {
    const item = document.createElement("li");

    const name = document.createElement("strong");
    name.textContent = user.name;

    const email = document.createElement("p");
    email.textContent = "Email: " + user.email;

    const city = document.createElement("p");
    city.textContent = "City: " + user.address.city;

    const company = document.createElement("p");
    company.textContent = "Company: " + user.company.name;

    item.appendChild(name);
    item.appendChild(email);
    item.appendChild(city);
    item.appendChild(company);
    usersList.appendChild(item);
  });
}

// ----- Get the users from the internet -----
async function loadUsers() {
  // Loading state
  statusMessage.textContent = "Loading users...";
  loadButton.disabled = true;

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    // fetch does not fail on a 404 or 500, so we check this ourselves
    if (!response.ok) {
      throw new Error("Server error: " + response.status);
    }

    users = await response.json();

    // Success state
    renderUsers(users);
    statusMessage.textContent = "Loaded " + users.length + " users.";
  } catch (error) {
    // Error state
    statusMessage.textContent = "Could not load users. " + error.message;
  } finally {
    // This runs whether it worked or not
    loadButton.disabled = false;
  }
}

// ----- Filter the users we already have -----
filterInput.addEventListener("input", function () {
  // If nothing is loaded yet, there is nothing to filter
  if (users.length === 0) {
    return;
  }

  const typed = filterInput.value.trim().toLowerCase();

  const matches = users.filter(function (user) {
    return user.name.toLowerCase().includes(typed);
  });

  renderUsers(matches);
});

loadButton.addEventListener("click", loadUsers);