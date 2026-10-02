const Categories = ["personal", "work", "study"];

let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// Lower-case, trim and collapse repeated spaces.
function normal(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

// Search notes.
function searchNotes(word) {
  const target = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(target));
}

// Longest note
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

// Count notes by category
function countByCategory() {
  const counts = { personal: 0, work: 0, study: 0 };
  for (const note of notes) {
    counts[note.category] += 1;
  }
  return counts;
}

// Summary of notes
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";
  const parts = [];
  for (const category of Categories) {
    if (counts[category] > 0) {
      parts.push(`${counts[category]} ${category}`);
    }
  }
  if (total === 0) {
    return `0 notes.`;
  }
  return `${total} ${word}: ${parts.join(", ")}.`;
}

// Duplicate note
function isDuplicate(text) {
  const target = normal(text);
  return notes.some((note) => normal(note.text) === target);
}

// Add note
function addNote(text, category) {
  const cleaned = text.trim();
  if (cleaned.length < 1 || cleaned.length > 200) {
    console.log("Not added: text must be 1-200 characters.");
    return false;
  }
  if (isDuplicate(cleaned)) {
    console.log("Not added: duplicate note.");
    return false;
  }
  if (!Categories.includes(category)) {
    console.log("Not added: category must be personal, work or study.");
    return false;
  }
  const nextId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
  notes.push({ id: nextId, text: cleaned, category: category });
  return true;
}

// Tests 

// searchNotes
console.log(searchNotes("MILK"));
// [ { id: 1, text: 'Buy milk and bread', category: 'personal' } ]
console.log(searchNotes("zebra"));
// []

// longestNote
console.log(longestNote());
// { id: 3, text: 'Email the project report to Grace', category: 'work' }
const savedNotes = notes;
notes = [];
console.log(longestNote());
// null
notes = savedNotes;

// countByCategory
console.log(countByCategory());
// { personal: 2, work: 1, study: 2 }
notes = [];
console.log(countByCategory());
// { personal: 0, work: 0, study: 0 }
notes = savedNotes;

// getSummary
console.log(getSummary());
// 5 notes: 2 personal, 1 work, 2 study.
notes = [savedNotes[0]];
console.log(getSummary());
// 1 note: 1 personal.
notes = [];
console.log(getSummary());
// 0 notes.
notes = savedNotes;

// isDuplicate
console.log(isDuplicate("  BUY   milk and BREAD "));
// true
console.log(isDuplicate("Buy eggs"));
// false

// addNote
console.log(addNote("Pay electricity bill", "personal"));
// true
console.log(addNote("buy milk and bread", "personal"));
// Not added: duplicate note.
// false
console.log(addNote("   ", "work"));
// Not added: text must be 1-200 characters.
// false
console.log(addNote("x".repeat(201), "work"));
// Not added: text must be 1-200 characters.
// false
console.log(addNote("Plan the sprint", "hobby"));
// Not added: category must be personal, work or study.
// false
console.log(getSummary());
// 6 notes: 3 personal, 1 work, 2 study.

