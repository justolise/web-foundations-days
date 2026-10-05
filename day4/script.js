// ----- Select elements -----
const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

// ----- Update the counters -----
function updateCounts() {
  const text = noteText.value;
  const length = text.length;

  // Count words: split on spaces, ignore empty pieces
  const trimmed = text.trim();
  let words = 0;
  if (trimmed !== "") {
    words = trimmed.split(/\s+/).length;
  }

  charCount.textContent = length + " / 200 characters";
  wordCount.textContent = words + " words";

  // Orange above 180, red and bold above 200
  if (length > 180) {
    charCount.classList.add("warning");
  } else {
    charCount.classList.remove("warning");
  }

  if (length > 200) {
    charCount.classList.add("over");
  } else {
    charCount.classList.remove("over");
  }
}

// ----- Clear everything -----
function clearNote() {
  noteText.value = "";
  localStorage.removeItem("draft");
  updateCounts();
}

// ----- Theme -----
function setTheme(isDark) {
  if (isDark) {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "Dark mode";
  }
}

// ----- Events -----
noteText.addEventListener("input", function () {
  updateCounts();
  localStorage.setItem("draft", noteText.value);
});

clearBtn.addEventListener("click", clearNote);

noteText.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearNote();
  }
});

themeToggle.addEventListener("click", function () {
  const isDark = !document.body.classList.contains("dark");
  setTheme(isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// ----- When the page loads -----
const savedDraft = localStorage.getItem("draft");
if (savedDraft !== null) {
  noteText.value = savedDraft;
}

setTheme(localStorage.getItem("theme") === "dark");
updateCounts();