console.log("✅ register.js yuklandi"); // Bu ko'rinishi kerak!

const API_BASE = "http://127.0.0.1:8000";

// ===== DOM =====
const form = document.getElementById("registerForm");
const firstnameEl = document.getElementById("firstname");
const lastnameEl = document.getElementById("lastname");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const confirmEl = document.getElementById("confirm_password");
const submitBtn = document.getElementById("submitBtn");

console.log("Form topildi:", form); // null bo'lmasligi kerak
console.log("Submit button topildi:", submitBtn); // null bo'lmasligi kerak

// ===== Helpers =====
function saveAuth(tokenOut) {
  localStorage.setItem("access_token", tokenOut.access_token);
  localStorage.setItem("user", JSON.stringify(tokenOut.user));
}

function openVerifyModal(prefilledEmail) {
  // eski modal bo'lsa olib tashlaymiz
  const old = document.getElementById("verifyModal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "verifyModal";
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: grid;
    place-items: center;
    z-index: 9999;
    padding: 16px;
    animation: fadeIn 0.3s ease;
  `;

  modal.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      .modal-content {
        animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .code-input-wrapper {
        position: relative;
      }
      .code-input {
        width: 100%;
        padding: 18px 5px 18px 0;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        outline: none;
        letter-spacing: 4px;
        font-size: 24px;
        font-weight: 600;
        text-align: center;
        transition: all 0.3s ease;
        font-family: 'Courier New', monospace;
        background: #f9fafb;
      }
      .code-input:focus {
        border-color: #4f46e5;
        background: white;
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
      }
      .verify-btn {
        width: 100%;
        padding: 14px;
        border-radius: 12px;
        border: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      .verify-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
      }
      .verify-btn:active {
        transform: translateY(0);
      }
      .verify-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      .cancel-btn {
        width: 100%;
        padding: 14px;
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        background: white;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        color: #6b7280;
        transition: all 0.3s ease;
      }
      .cancel-btn:hover {
        border-color: #d1d5db;
        background: #f9fafb;
      }
      .error-shake {
        animation: shake 0.4s ease;
      }
    </style>
    
    <div class="modal-content" style="
      width: min(460px, 100%);
      background: #fff;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    ">
      <!-- Icon -->
      <div style="
        width: 64px;
        height: 64px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        display: grid;
        place-items: center;
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
      ">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </div>

      <h2 style="
        margin: 0 0 8px;
        font-size: 24px;
        font-weight: 700;
        text-align: center;
        color: #111827;
      ">Email tasdiqlash</h2>
      
      <p style="
        margin: 0 0 28px;
        color: #6b7280;
        font-size: 15px;
        text-align: center;
        line-height: 1.5;
      ">
        <strong style="color: #4f46e5;">${prefilledEmail}</strong><br>
        manziliga yuborilgan 6 xonali kodni kiriting
      </p>

      <div class="code-input-wrapper">
        <input
          id="vCode"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="000000"
          class="code-input"
          autocomplete="off"
        />
      </div>

      <p id="vMsg" style="
        margin: 12px 0 0;
        color: #ef4444;
        font-size: 14px;
        text-align: center;
        min-height: 20px;
        font-weight: 500;
      "></p>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button id="vCancel" type="button" class="cancel-btn">
          Bekor qilish
        </button>
        <button id="vSubmit" type="button" class="verify-btn">
          Tasdiqlash
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const vCode = modal.querySelector("#vCode");
  const vCancel = modal.querySelector("#vCancel");
  const vSubmit = modal.querySelector("#vSubmit");
  const vMsg = modal.querySelector("#vMsg");
  const modalContent = modal.querySelector(".modal-content");

  // Faqat raqam kiritish
  vCode.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });

  // Auto-focus
  setTimeout(() => vCode.focus(), 100);

  vCancel.addEventListener("click", () => {
    modal.style.animation = "fadeIn 0.2s ease reverse";
    setTimeout(() => modal.remove(), 200);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.animation = "fadeIn 0.2s ease reverse";
      setTimeout(() => modal.remove(), 200);
    }
  });

  vSubmit.addEventListener("click", async () => {
    vMsg.textContent = "";
    modalContent.classList.remove("error-shake");

    const code = vCode.value.trim();

    if (code.length !== 6) {
      vMsg.textContent = "⚠️ Kod 6 xonali bo'lishi kerak";
      modalContent.classList.add("error-shake");
      setTimeout(() => modalContent.classList.remove("error-shake"), 400);
      return;
    }

    try {
      vSubmit.disabled = true;
      vSubmit.innerHTML = `
        <svg style="display: inline-block; animation: spin 1s linear infinite;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        <span style="margin-left: 8px;">Tekshirilmoqda...</span>
      `;

      const res = await fetch(`${API_BASE}/auth/register/verify_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: prefilledEmail, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        vMsg.textContent = "❌ " + (data?.detail || "Noto'g'ri kod");
        modalContent.classList.add("error-shake");
        setTimeout(() => modalContent.classList.remove("error-shake"), 400);
        return;
      }

      // Success!
      saveAuth(data);
      
      // Success animation
      vSubmit.innerHTML = `
        <svg style="display: inline-block;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span style="margin-left: 8px;">Tasdiqlandi!</span>
      `;
      
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } catch (e) {
      vMsg.textContent = "❌ Serverga ulanib bo'lmadi";
      modalContent.classList.add("error-shake");
      setTimeout(() => modalContent.classList.remove("error-shake"), 400);
    } finally {
      if (vSubmit.disabled) {
        setTimeout(() => {
          vSubmit.disabled = false;
          vSubmit.textContent = "Tasdiqlash";
        }, 1000);
      }
    }
  });

  // Enter key support
  vCode.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      vSubmit.click();
    }
  });
}

// Spin animation CSS
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// ===== Register submit =====
console.log("Event listener qo'shilmoqda..."); // Bu ham ko'rinishi kerak

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  console.log("🚀 Form submit bo'ldi!"); // Bu MUHIM - submit bosganda ko'rinishi kerak!

  const payload = {
    firstname: firstnameEl.value.trim(),
    lastname: lastnameEl.value.trim(),
    email: emailEl.value.trim().toLowerCase(),
    password: passwordEl.value,
    confirm_password: confirmEl.value,
  };

  // Validation
  if (!payload.firstname || !payload.lastname || !payload.email || !payload.password) {
    alert("Hamma maydonlarni to'ldiring!");
    return;
  }

  if (payload.password !== payload.confirm_password) {
    alert("Parollar mos emas!");
    return;
  }

  console.log("Sending payload:", payload); // DEBUG

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Yuborilyapti...";

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("Response status:", res.status); // DEBUG
    
    const data = await res.json();
    console.log("Response data:", data); // DEBUG

    if (!res.ok) {
      console.error("Register error:", data); // DEBUG
      alert(data?.detail || JSON.stringify(data) || "Register xatosi");
      return;
    }

    // Register javobida tokenOut keladi
    saveAuth(data);

    // Kodni kiritadigan oynacha
    openVerifyModal(payload.email);
  } catch (err) {
    console.error("Network error:", err); // DEBUG
    alert("Serverga ulanib bo'lmadi: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});
