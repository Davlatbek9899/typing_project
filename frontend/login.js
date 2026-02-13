const API_BASE = "http://127.0.0.1:8000";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");

const toastArea = document.getElementById("loginToastArea");

let hideTimer = null;

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showLoginError(message = "Incorrect details") {
  if (!toastArea) return;

  // eski timer bo'lsa to'xtat
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  // eski toast bo'lsa o'chir
  toastArea.innerHTML = "";

  const el = document.createElement("div");
  el.className = "toast toast-error"; // CSS animatsiya shu classlarda
  el.innerHTML = `
    <div class="toast-icon" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <path d="M12 9v4"></path>
        <path d="M12 17h.01"></path>
      </svg>
    </div>
    <div class="toast-text">${escapeHtml(message)}</div>
    <button class="toast-close" type="button" aria-label="close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    </button>
  `;

  el.querySelector(".toast-close").addEventListener("click", () => hideToast(el));

  toastArea.appendChild(el);

  // tepadan tushish animatsiyasi uchun
  requestAnimationFrame(() => el.classList.add("is-in"));

  hideTimer = setTimeout(() => hideToast(el), 2000);
}

function hideToast(el) {
  if (!el) return;
  el.classList.remove("is-in");
  el.classList.add("is-out");
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 220);
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  loginBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showLoginError("Incorrect details");
      return;
    }

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("token_type", data.token_type || "bearer");
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

    window.location.href = "index.html";
  } catch (err) {
    showLoginError("Network error");
  } finally {
    loginBtn.disabled = false;
  }
});
