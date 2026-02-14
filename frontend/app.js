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

// 🎯 FLOW MODE DOM
const modeToggle = document.getElementById("modeToggle");
const modeIcon = document.getElementById("modeIcon");
const modeName = document.getElementById("modeName");
const flowMode = document.getElementById("flowMode");
const flowWords = document.getElementById("flowWords");
const flowInput = document.getElementById("flowInput");
const flowWpm = document.getElementById("flowWpm");
const flowAcc = document.getElementById("flowAcc");
const flowTime = document.getElementById("flowTime");
const flowResult = document.getElementById("flowResult");
const flowRetry = document.getElementById("flowRetry");
const resultWpm = document.getElementById("resultWpm");
const resultAcc = document.getElementById("resultAcc");
const resultCorrect = document.getElementById("resultCorrect");
const resultWrong = document.getElementById("resultWrong");
const resultTime = document.getElementById("resultTime");

// 🎯 FLOW MODE STATE
let isFlowMode = localStorage.getItem('isFlowMode') === 'true';
let flowTestActive = false;
let flowTestDuration = parseInt(localStorage.getItem('flowTestDuration')) || 30;
let flowTestTimer = null;
let flowTestStartTime = null;
let flowTestWords = [];
let flowCurrentWordIndex = 0;
let flowTypedWords = [];
let flowCorrectWords = 0;
let flowIncorrectWords = 0;
let flowTotalChars = 0;

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

// ========================================
// 🎯 FLOW MODE FUNCTIONS
// ========================================

// Word list for flow mode - KO'PROQ SO'ZLAR, HAR XIL UZUNLIKDA
const FLOW_WORDS = [
  // Qisqa so'zlar (1-3 harf)
  "a", "I", "be", "to", "of", "in", "it", "is", "he", "as", "at", "so", "we", "an", "do", "go", "me", "my", "no", "on", "or", "up", "us",
  "the", "and", "for", "not", "but", "his", "by", "her", "she", "all", "who", "get", "him", "has", "had", "its", "our", "out", "day", "use", "man", "way", "new", "old", "see", "two", "may", "say", "try", "own", "too", "any", "end", "why", "let", "put", "big", "few", "run", "hot", "eat", "far", "fun", "red", "top", "son", "car", "cut", "dog", "lot", "off", "die", "nor", "sit", "buy", "per", "sky", "lay", "job", "act", "war", "bag", "ago", "yet", "arm", "sex", "air", "cup", "age",
  // O'rta so'zlar (4-6 harf)
  "have", "that", "with", "this", "they", "from", "will", "your", "what", "been", "call", "find", "came", "made", "part", "over", "such", "well", "only", "back", "name", "very", "through", "just", "form", "much", "great", "think", "help", "tell", "line", "turn", "cause", "show", "also", "move", "right", "might", "about", "after", "world", "still", "learn", "plant", "cover", "state", "never", "start", "city", "earth", "river", "began", "grow", "study", "carry", "took", "since", "remain", "effect", "serve", "appear", "write", "bring", "happen", "stand", "became", "change", "listen", "enter", "share", "agree", "deep", "decide", "allow", "beauty", "behind", "during", "result", "change", "office", "desire", "spring", "supply", "prefer", "people", "number", "little", "before", "nation", "really", "family", "later", "create", "become", "detail", "direct", "expect", "figure", "rather", "record", "result", "simple", "single", "travel", "wonder",
  // Uzun so'zlar (7+ harf)
  "because", "between", "however", "another", "nothing", "everything", "something", "question", "possible", "important", "together", "children", "remember", "beautiful", "different", "several", "although", "practice", "language", "increase", "describe", "complete", "separate", "structure", "develop", "consider", "continue", "evidence", "position", "standard", "interest", "strength", "industry", "remember", "national", "probably", "research", "according", "agreement", "attention", "community", "development", "experience", "government", "understand", "individual", "particular", "production", "relationship",
  // Typing-related words
  "type", "word", "text", "code", "data", "file", "save", "edit", "copy", "paste", "delete", "enter", "shift", "space", "click", "mouse", "screen", "window", "button", "keyboard", "practice", "skill", "learn", "improve", "focus", "speed", "accuracy", "master", "progress", "challenge", "exercise"
];


// Mode toggle
function toggleMode() {
  isFlowMode = !isFlowMode;
  localStorage.setItem('isFlowMode', isFlowMode);

  if (isFlowMode) {
    document.body.classList.add('flow-mode-active');
    modeIcon.textContent = '📋';
    modeName.textContent = 'Classic Mode';
    startFlowTest();
  } else {
    document.body.classList.remove('flow-mode-active');
    modeIcon.textContent = '🎯';
    modeName.textContent = 'Flow Mode';
    stopFlowTest();
  }
}

// Initialize mode
if (isFlowMode) {
  document.body.classList.add('flow-mode-active');
  modeIcon.textContent = '📋';
  modeName.textContent = 'Classic Mode';
}

modeToggle.addEventListener('click', toggleMode);

// Timer selector
document.querySelectorAll('.timer-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (flowTestActive) return;

    document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    flowTestDuration = parseInt(btn.dataset.time);
    localStorage.setItem('flowTestDuration', flowTestDuration);
    flowTime.textContent = flowTestDuration;
  });
});

// Generate words - REAL DOM DA TEST QILIB QATORLARGA AJRATISH
function generateFlowWords() {
  const totalRows = 100; // Ko'p qatorlar kerak
  const allWords = [];

  // Temporary container yaratish - real o'lchamlar bilan
  const tempContainer = document.createElement('div');
  tempContainer.className = 'flow-words';
  tempContainer.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: 886px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 1.6rem;
    font-weight: 600;
    line-height: 2.2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    padding: 2rem;
  `;
  document.body.appendChild(tempContainer);

  for (let row = 0; row < totalRows; row++) {
    tempContainer.innerHTML = ''; // Tozalash
    const rowWords = [];
    let lastY = null;

    // So'zlarni birma-bir qo'shib, qachon yangi qatorga o'tishini tekshirish
    while (true) {
      // Tasodifiy so'z tanlash
      const word = FLOW_WORDS[Math.floor(Math.random() * FLOW_WORDS.length)];

      // So'zni qo'shish
      const wordEl = document.createElement('span');
      wordEl.className = 'flow-word';
      wordEl.textContent = word;
      tempContainer.appendChild(wordEl);

      // Pozitsiyani tekshirish
      const rect = wordEl.getBoundingClientRect();
      const currentY = Math.round(rect.top);

      if (lastY === null) {
        lastY = currentY;
        rowWords.push(word);
      } else if (Math.abs(currentY - lastY) < 5) {
        // Hali o'sha qatorda
        rowWords.push(word);
      } else {
        // Yangi qatorga o'tdi - oxirgi so'zni olib tashlaymiz
        tempContainer.removeChild(wordEl);
        break;
      }

      // Agar juda ko'p so'z bo'lsa to'xtatamiz (xavfsizlik uchun)
      if (rowWords.length > 50) break;
    }

    allWords.push(...rowWords);
  }

  // Temp containerni o'chirish
  document.body.removeChild(tempContainer);

  return allWords;
}

// Render initial words - FAQAT 3 QATOR
function renderFlowWords() {
  flowWords.innerHTML = '';

  // Barcha so'zlarni qo'shib, qatorlarga ajratamiz
  const allWordElements = [];
  flowTestWords.forEach((word, index) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'flow-word temp-word';
    wordEl.textContent = word;
    wordEl.dataset.index = index;
    flowWords.appendChild(wordEl);
    allWordElements.push(wordEl);
  });

  // Qatorlarni aniqlash
  const rows = [];
  let currentRowY = null;
  let currentRowWords = [];

  allWordElements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const y = Math.round(rect.top);

    if (currentRowY === null || Math.abs(y - currentRowY) > 5) {
      if (currentRowWords.length > 0) {
        rows.push([...currentRowWords]);
      }
      currentRowY = y;
      currentRowWords = [index];
    } else {
      currentRowWords.push(index);
    }
  });

  if (currentRowWords.length > 0) {
    rows.push(currentRowWords);
  }

  // Faqat birinchi 3 qatorni render qilish
  flowWords.innerHTML = '';

  const maxRows = Math.min(3, rows.length);

  for (let r = 0; r < maxRows; r++) {
    const rowWordIndices = rows[r];

    rowWordIndices.forEach(wordIndex => {
      const word = flowTestWords[wordIndex];
      const wordEl = document.createElement('span');
      wordEl.className = 'flow-word';
      wordEl.dataset.index = wordIndex;

      // Birinchi so'zga cursor qo'shish
      if (wordIndex === 0) {
        wordEl.classList.add('active');

        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.id = 'active-cursor';
        wordEl.appendChild(cursor);
      }

      // Harflarni qo'shish
      word.split('').forEach(letter => {
        const letterEl = document.createElement('span');
        letterEl.className = 'letter';
        letterEl.textContent = letter;
        wordEl.appendChild(letterEl);
      });

      flowWords.appendChild(wordEl);
    });
  }
}

// Update visible words - FAQAT QATOR ALMASHGANDA ANIMATSIYA
function updateVisibleWords(animate = false) {
  const currentInput = flowInput.value;

  // Agar animatsiya kerak bo'lsa (qator almashganda)
  if (animate) {
    flowWords.style.opacity = '0';
    flowWords.style.transform = 'translateY(-10px)';
  }

  const renderContent = () => {
    flowWords.innerHTML = '';

    // SODDA YONDASHUV: Barcha so'zlarni render qilamiz, keyin qatorlarga ajratamiz

    // 1) Avval barcha so'zlarni DOM ga qo'shamiz (vaqtincha)
    const allWordElements = [];
    flowTestWords.forEach((word, index) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'flow-word temp-word';
      wordEl.textContent = word;
      wordEl.dataset.index = index;
      flowWords.appendChild(wordEl);
      allWordElements.push(wordEl);
    });

    // 2) Har bir so'zning Y pozitsiyasini o'lchab, qatorlarga ajratamiz
    const rows = [];
    let currentRowY = null;
    let currentRowWords = [];

    allWordElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const y = Math.round(rect.top);

      if (currentRowY === null || Math.abs(y - currentRowY) > 5) {
        // Yangi qator boshlandi
        if (currentRowWords.length > 0) {
          rows.push([...currentRowWords]);
        }
        currentRowY = y;
        currentRowWords = [index];
      } else {
        // O'sha qatorda davom
        currentRowWords.push(index);
      }
    });

    // Oxirgi qatorni qo'shish
    if (currentRowWords.length > 0) {
      rows.push(currentRowWords);
    }

    // 3) Active word qaysi qatorda?
    let activeRow = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].includes(flowCurrentWordIndex)) {
        activeRow = i;
        break;
      }
    }

    // 4) Qaysi 3 ta qatorni ko'rsatish kerak?
    let visibleRowStart = 0;

    if (activeRow === 0) {
      // Birinchi qatorda: 0, 1, 2
      visibleRowStart = 0;
    } else {
      // Keyingi qatorlarda: kursor o'rtada
      visibleRowStart = activeRow - 1;
    }

    const visibleRowEnd = Math.min(visibleRowStart + 3, rows.length);

    // 5) Tozalash va faqat kerakli qatorlarni qayta render qilish
    flowWords.innerHTML = '';

    for (let r = visibleRowStart; r < visibleRowEnd; r++) {
      const rowWordIndices = rows[r];

      rowWordIndices.forEach(wordIndex => {
        const word = flowTestWords[wordIndex];
        const wordEl = document.createElement('span');
        wordEl.className = 'flow-word';
        wordEl.dataset.index = wordIndex;

        // Completed words
        if (wordIndex < flowCurrentWordIndex) {
          if (flowTypedWords[wordIndex] === word) {
            wordEl.classList.add('correct');
          } else {
            wordEl.classList.add('incorrect');
          }

          word.split('').forEach(letter => {
            const letterEl = document.createElement('span');
            letterEl.className = 'letter';
            letterEl.textContent = letter;
            wordEl.appendChild(letterEl);
          });
        }
        // Active word with cursor
        else if (wordIndex === flowCurrentWordIndex) {
          wordEl.classList.add('active');

          // Add cursor FIRST
          const cursor = document.createElement('span');
          cursor.className = 'cursor';
          cursor.id = 'active-cursor';
          wordEl.appendChild(cursor);

          // Add letters
          word.split('').forEach(letter => {
            const letterEl = document.createElement('span');
            letterEl.className = 'letter';
            letterEl.textContent = letter;
            wordEl.appendChild(letterEl);
          });

          // Update letter colors if there's input
          if (currentInput) {
            const typed = currentInput.split('');
            const letters = wordEl.querySelectorAll('.letter');

            letters.forEach((letter, idx) => {
              if (idx < typed.length) {
                if (typed[idx] === letter.textContent) {
                  letter.classList.add('correct');
                } else {
                  letter.classList.add('incorrect');
                }
              }
            });

            // Update cursor position
            cursor.remove();
            const newCursor = document.createElement('span');
            newCursor.className = 'cursor';
            newCursor.id = 'active-cursor';

            if (typed.length === 0) {
              wordEl.insertBefore(newCursor, letters[0]);
            } else if (typed.length < letters.length) {
              letters[typed.length].before(newCursor);
            } else {
              wordEl.appendChild(newCursor);
            }
          }
        }
        // Future words
        else {
          word.split('').forEach(letter => {
            const letterEl = document.createElement('span');
            letterEl.className = 'letter';
            letterEl.textContent = letter;
            wordEl.appendChild(letterEl);
          });
        }

        flowWords.appendChild(wordEl);
      });
    }

    // Agar animatsiya bo'lsa, fade in
    if (animate) {
      setTimeout(() => {
        flowWords.style.opacity = '1';
        flowWords.style.transform = 'translateY(0)';
      }, 50);
    }
  };

  if (animate) {
    setTimeout(renderContent, 150);
  } else {
    renderContent();
  }
}

// Start flow test
function startFlowTest() {
  flowTestActive = false;
  flowTestStartTime = null; // Reset start time
  flowTestWords = generateFlowWords();
  flowCurrentWordIndex = 0;
  flowTypedWords = [];
  flowCorrectWords = 0;
  flowIncorrectWords = 0;
  flowTotalChars = 0;

  renderFlowWords();

  flowWpm.textContent = '0';
  flowAcc.textContent = '100%';
  flowTime.textContent = flowTestDuration;

  flowResult.classList.add('hidden');
  flowInput.value = '';
  flowInput.focus();

  // Stop any existing timer
  if (flowTestTimer) {
    clearInterval(flowTestTimer);
    flowTestTimer = null;
  }
}

// Stop flow test
function stopFlowTest() {
  if (flowTestTimer) {
    clearInterval(flowTestTimer);
    flowTestTimer = null;
  }
  flowTestActive = false;
}

// Update flow stats
function updateFlowStats() {
  if (!flowTestStartTime) return;

  const elapsedSeconds = (Date.now() - flowTestStartTime) / 1000;
  const minutes = elapsedSeconds / 60;

  // Calculate WPM
  const wpm = minutes > 0 ? Math.round(flowCorrectWords / minutes) : 0;
  flowWpm.textContent = wpm;

  // Calculate accuracy
  const totalWords = flowCorrectWords + flowIncorrectWords;
  const accuracy = totalWords > 0 ? Math.round((flowCorrectWords / totalWords) * 100) : 100;
  flowAcc.textContent = accuracy + '%';
}

// Update current word display REAL-TIME
function updateCurrentWordDisplay(input) {
  const wordElements = flowWords.querySelectorAll('.flow-word');
  const currentWordEl = Array.from(wordElements).find(el =>
    parseInt(el.dataset.index) === flowCurrentWordIndex
  );

  if (!currentWordEl) return;

  const currentWord = flowTestWords[flowCurrentWordIndex];
  const letters = currentWordEl.querySelectorAll('.letter');
  const typed = input.split('');

  // Remove old cursor by ID
  const oldCursor = currentWordEl.querySelector('#active-cursor');
  if (oldCursor) oldCursor.remove();

  // Update each letter color
  letters.forEach((letter, i) => {
    letter.classList.remove('correct', 'incorrect');

    if (i < typed.length) {
      if (typed[i] === letter.textContent) {
        letter.classList.add('correct');
      } else {
        letter.classList.add('incorrect');
      }
    }
  });

  // Add cursor at correct position with ID
  const newCursor = document.createElement('span');
  newCursor.className = 'cursor';
  newCursor.id = 'active-cursor';

  if (typed.length === 0) {
    // Cursor BEFORE first letter
    if (letters.length > 0) {
      currentWordEl.insertBefore(newCursor, letters[0]);
    } else {
      currentWordEl.appendChild(newCursor);
    }
  } else if (typed.length < letters.length) {
    // Cursor between letters
    letters[typed.length].before(newCursor);
  } else {
    // Cursor after last letter
    currentWordEl.appendChild(newCursor);
  }
}

// Handle flow input
function handleFlowInput(e) {
  const input = e.target.value;

  // Start test on first character
  if (!flowTestActive && input.length > 0) {
    flowTestActive = true;
    flowTestStartTime = Date.now();

    // Start timer
    let remainingTime = flowTestDuration;
    flowTestTimer = setInterval(() => {
      remainingTime--;
      flowTime.textContent = remainingTime;

      if (remainingTime <= 0) {
        endFlowTest();
      }
    }, 1000);
  }

  if (!flowTestActive) return;

  // Update display in real-time
  if (!input.includes(' ')) {
    updateCurrentWordDisplay(input);
    return;
  }

  // Space pressed - word completed
  const typedWord = input.trim();
  const currentWord = flowTestWords[flowCurrentWordIndex];

  // Check if correct
  if (typedWord === currentWord) {
    flowCorrectWords++;
  } else {
    flowIncorrectWords++;
  }

  flowTypedWords[flowCurrentWordIndex] = typedWord;
  flowTotalChars += typedWord.length;

  // Oldingi qatorni eslab qolish
  const previousWordIndex = flowCurrentWordIndex;

  // Move to next word
  flowCurrentWordIndex++;

  // Clear input
  e.target.value = '';

  // Qator almashganini tekshirish
  // MUHIM: Faqat QOLGAN so'zlar bilan qatorlarni hisoblash kerak!
  const tempContainer = document.createElement('div');
  tempContainer.className = 'flow-words';
  tempContainer.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: 886px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 1.6rem;
    font-weight: 600;
    line-height: 2.2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    padding: 2rem;
  `;
  document.body.appendChild(tempContainer);

  // Faqat flowCurrentWordIndex dan boshlab qolgan so'zlarni qo'shamiz
  const remainingWords = flowTestWords.slice(flowCurrentWordIndex);
  const allWordEls = [];

  remainingWords.forEach((word, relativeIndex) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'flow-word';
    wordEl.textContent = word;
    wordEl.dataset.index = flowCurrentWordIndex + relativeIndex;
    tempContainer.appendChild(wordEl);
    allWordEls.push({el: wordEl, absoluteIndex: flowCurrentWordIndex + relativeIndex});
  });

  // Qatorlarni aniqlash
  const rows = [];
  let currentRowY = null;
  let currentRowWords = [];

  allWordEls.forEach((item) => {
    const rect = item.el.getBoundingClientRect();
    const y = Math.round(rect.top);

    if (currentRowY === null || Math.abs(y - currentRowY) > 5) {
      if (currentRowWords.length > 0) {
        rows.push([...currentRowWords]);
      }
      currentRowY = y;
      currentRowWords = [item.absoluteIndex];
    } else {
      currentRowWords.push(item.absoluteIndex);
    }
  });

  if (currentRowWords.length > 0) {
    rows.push(currentRowWords);
  }

  document.body.removeChild(tempContainer);

  // Oldingi va joriy so'zlar qaysi qatorda?
  let previousRow = 0;
  let currentRow = 0;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].includes(previousWordIndex)) previousRow = i;
    if (rows[i].includes(flowCurrentWordIndex)) currentRow = i;
  }

  // Agar qator o'zgardi - animatsiya bilan, aks holda oddiy update
  const shouldAnimate = currentRow > previousRow;

  // Update visible words (scroll effect)
  updateVisibleWords(shouldAnimate);

  updateFlowStats();

  // Check if test should end
  if (flowCurrentWordIndex >= flowTestWords.length) {
    endFlowTest();
  }
}

// End flow test
function endFlowTest() {
  stopFlowTest();

  const elapsedSeconds = flowTestDuration;
  const minutes = elapsedSeconds / 60;

  // Calculate final stats
  const wpm = minutes > 0 ? Math.round(flowCorrectWords / minutes) : 0;
  const totalWords = flowCorrectWords + flowIncorrectWords;
  const accuracy = totalWords > 0 ? Math.round((flowCorrectWords / totalWords) * 100) : 100;

  // Show results
  resultWpm.textContent = wpm;
  resultAcc.textContent = accuracy + '%';
  resultCorrect.textContent = flowCorrectWords;
  resultWrong.textContent = flowIncorrectWords;
  resultTime.textContent = flowTestDuration + 's';

  flowResult.classList.remove('hidden');

  // Increment completed count
  incrementCompleted();
}

// Retry button
flowRetry.addEventListener('click', () => {
  startFlowTest();
});

// Flow input listener
flowInput.addEventListener('input', handleFlowInput);

// Enter key to restart
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && isFlowMode && !flowResult.classList.contains('hidden')) {
    e.preventDefault();
    startFlowTest();
  }
});

// Focus input when clicking on flow mode
flowWords.addEventListener('click', () => {
  if (isFlowMode) {
    flowInput.focus();
  }
});

// Keep focus on input
flowInput.addEventListener('blur', () => {
  if (isFlowMode && flowTestActive) {
    setTimeout(() => flowInput.focus(), 10);
  }
});