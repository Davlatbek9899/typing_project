const API_BASE = "http://127.0.0.1:8000";

// ====== DOM ======
const panels = document.getElementById("panels");
const swapBtn = document.getElementById("swapBtn");
const newTextBtn = document.getElementById("newTextBtn");

const sourceTextEl = document.getElementById("sourceText");
const typingInput = document.getElementById("typingInput");
const compareView = document.getElementById("compareView");

const textLenPill = document.getElementById("textLenPill");
const progressPill = document.getElementById("progressPill");

const keyboard = document.getElementById("keyboard");

const lengthBtn = document.getElementById("lengthBtn");
const lengthMenu = document.getElementById("lengthMenu");
const userFinishedPill = document.getElementById("userFinishedPill");
const doneBtn = document.getElementById("doneBtn");

// 🎨 THEME SWITCHER DOM
const themeBtn = document.getElementById("themeBtn");
const themeName = document.getElementById("themeName");

// ====== THEME SWITCHER ======
const themes = [
  { name: 'Default', class: '' },
  { name: 'Flowers', class: 'theme-flowers' },
  { name: 'Mountain', class: 'theme-mountain' },
  { name: 'Alpine', class: 'theme-alpine' },
  { name: 'Dark', class: 'theme-dark' },
  { name: 'Anime Pink', class: 'theme-anime-pink' },
  { name: 'Anime Blue', class: 'theme-anime-blue' },
  { name: 'Anime Ocean', class: 'theme-anime-ocean' },
  { name: 'Anime Forest', class: 'theme-anime-forest' }
];

let currentThemeIndex = 0;

// Load saved theme from localStorage
const savedTheme = localStorage.getItem('selectedTheme');
if (savedTheme) {
  currentThemeIndex = parseInt(savedTheme) || 0;
  applyTheme(currentThemeIndex);
}

function applyTheme(index) {
  const body = document.body;
  const theme = themes[index];
  
  // Remove all theme classes
  themes.forEach(t => {
    if (t.class) body.classList.remove(t.class);
  });
  
  // Add new theme class
  if (theme.class) {
    body.classList.add(theme.class);
  }
  
  // Update button text
  themeName.textContent = theme.name;
}

// Theme button click
themeBtn.addEventListener('click', () => {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  applyTheme(currentThemeIndex);
  
  // Save to localStorage
  localStorage.setItem('selectedTheme', currentThemeIndex);
  
  // Add animation
  themeBtn.style.transform = 'scale(0.95)';
  setTimeout(() => {
    themeBtn.style.transform = 'scale(1)';
  }, 100);
});

// ====== AUTH HELPERS ======
function getToken() {
  return localStorage.getItem("access_token");
}

async function loadMeAndRenderFinished() {
  const token = getToken();
  if (!token) {
    userFinishedPill.textContent = "Finished: 0";
    return;
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    userFinishedPill.textContent = "Finished: 0";
    return;
  }

  const user = await res.json();
  userFinishedPill.textContent = `Finished: ${user.completed_texts_count ?? 0}`;
}

async function incrementCompleted() {
  const token = getToken();
  if (!token) return;

  const res = await fetch(`${API_BASE}/auth/completed`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return;

  const user = await res.json();
  userFinishedPill.textContent = `Finished: ${user.completed_texts_count ?? 0}`;
}

// ====== Sample texts ======
const LENGTH_RULES = {
  short: { minSent: 1, maxSent: 2 },
  medium: { minSent: 5, maxSent: 6 },
  long: { minSent: 11, maxSent: 13 },
  xlong: { minSent: 19, maxSent: 21 }
};

let lengthMode = localStorage.getItem("lengthMode") || "short";
let targetText = "";

// ====== Utils ======
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function normalizeWord(w) {
  return w.replace(/\s+/g, " ").trim();
}
function splitWordsPreserveSpaces(text) {
  return text.match(/\S+|\s+/g) || [];
}

// ====== Render compare view ======
function renderCompare() {
  const typed = typingInput.value;

  if (!typed) {
    compareView.innerHTML = "";
    progressPill.textContent = "0%";
    textLenPill.textContent = `${targetText.length} chars`;
    doneBtn.classList.add("hidden");
    return;
  }

  const typedTokens = splitWordsPreserveSpaces(typed);

  const targetWords = targetText.split(/\s+/).filter(Boolean);
  const typedWords = typed.split(/\s+/).filter(Boolean);

  const endsWithSpace = /\s$/.test(typed);
  const completedCount = endsWithSpace
    ? typedWords.length
    : Math.max(typedWords.length - 1, 0);

  let wordIndex = 0;

  const htmlParts = typedTokens.map((tok) => {
    if (/^\s+$/.test(tok)) return tok;

    const got = typedWords[wordIndex] ?? "";
    const expected = targetWords[wordIndex] ?? "";

    let cls = "w-ok";
    if (wordIndex < completedCount) {
      if (normalizeWord(got) !== normalizeWord(expected)) cls = "w-bad";
    } else {
      cls = "w-ok";
    }

    wordIndex++;

    const safe = tok
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    return `<span class="${cls}">${safe}</span>`;
  });

  compareView.innerHTML = htmlParts.join("");

  progressPill.textContent = `${Math.floor((typed.length / targetText.length) * 100)}%`;
  textLenPill.textContent = `${targetText.length} chars`;

  const isDone = typed.trim() === targetText.trim();
  if (isDone) doneBtn.classList.remove("hidden");
  else doneBtn.classList.add("hidden");
}

function updateTextSizeByLength(text) {
  const len = (text || "").length;
  let size = 18;
  if (len > 350) size = 16;
  if (len > 650) size = 14.5;
  if (len > 950) size = 13;
  panels.style.setProperty("--textSize", `${size}px`);
}

// ====== Set new target text ======
function setNewText() {
  const rule = LENGTH_RULES[lengthMode] || LENGTH_RULES.short;
  const sentCount = Math.floor(
    rule.minSent + Math.random() * (rule.maxSent - rule.minSent + 1)
  );

  const SENTENCES = [
    "Typing quickly and accurately is a powerful skill.",
    "Practice regularly and you will improve over time.",
    "Focus on accuracy first, then speed will come naturally.",
    "Small daily sessions are better than rare long sessions.",
    "Keep your hands relaxed and your posture comfortable.",
    "Look at the screen, not at the keyboard.",
    "Use all your fingers for better control and speed.",
    "Correct mistakes as soon as you notice them.",
    "Consistency beats intensity in the long run.",
    "Set a clear goal and track your progress.",
    "Take short breaks to avoid fatigue.",
    "A calm mind helps you type more smoothly.",
    "Build rhythm and maintain a steady pace.",
    "Over time, muscle memory will do the work.",
    "Enjoy the process and celebrate small wins."
  ];

  const selected = [];
  for (let i = 0; i < sentCount; i++) selected.push(pickRandom(SENTENCES));

  targetText = selected.join(" ");
  sourceTextEl.textContent = targetText;

  typingInput.value = "";
  compareView.innerHTML = "";
  progressPill.textContent = "0%";
  textLenPill.textContent = `${targetText.length} chars`;

  doneBtn.classList.add("hidden");
  typingInput.focus();

  updateTextSizeByLength(targetText);
}

// ====== Swap panels ======
let swapped = false;
swapBtn.addEventListener("click", () => {
  swapped = !swapped;
  panels.classList.toggle("is-swapped", swapped);
});

function closeMenu(){ lengthMenu.classList.add("hidden"); }
function toggleMenu(){ lengthMenu.classList.toggle("hidden"); }

lengthBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu();
});
document.addEventListener("click", () => closeMenu());

lengthMenu.addEventListener("click", (e) => {
  e.stopPropagation();
  const btn = e.target.closest(".menu-item");
  if (!btn) return;
  lengthMode = btn.dataset.length;
  localStorage.setItem("lengthMode", lengthMode);
  closeMenu();
  setNewText();
});

// ====== New text ======
newTextBtn.addEventListener("click", setNewText);

// ====== Typing listeners ======
typingInput.addEventListener("input", renderCompare);

// ====== Keyboard highlight ======
function keyToLabel(e) {
  if (e.key === " ") return "";
  if (e.key === "Backspace") return "delete";
  if (e.key === "Enter") return "return";
  if (e.key === "Tab") return "tab";
  if (e.key === "CapsLock") return "caps lock";
  if (e.key === "Shift") return "shift";
  if (e.key === "Control") return "ctrl";
  if (e.key === "Alt") return "⌥";
  if (e.key === "Meta") return "⌘";
  if (e.key === "Escape") return "esc";
  return e.key.length === 1 ? e.key.toUpperCase() : e.key;
}

function findKeyEl(label, e) {
  if (e.key === " ") return keyboard.querySelector(".space-key");
  const keys = Array.from(keyboard.querySelectorAll(".key"));
  return keys.find(k => k.textContent.trim() === label) || null;
}

function pressKey(e) {
  const label = keyToLabel(e);
  const el = findKeyEl(label, e);
  if (!el) return;
  el.classList.add("is-pressed");
}
function releaseKey(e) {
  const label = keyToLabel(e);
  const el = findKeyEl(label, e);
  if (!el) return;
  el.classList.remove("is-pressed");
}

window.addEventListener("keydown", pressKey);
window.addEventListener("keyup", releaseKey);

// ====== Swap CSS helper ======
const style = document.createElement("style");
style.textContent = `
  .panels.is-swapped #sourcePanel { order: 2; }
  .panels.is-swapped #typingPanel { order: 1; }
`;
document.head.appendChild(style);

// ===== init =====
setNewText();
loadMeAndRenderFinished();

// ✅ Tayyor bosilganda DBga +1
doneBtn.addEventListener("click", async () => {
  await incrementCompleted();
  setNewText();
});
