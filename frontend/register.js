const API_BASE = "http://127.0.0.1:8000";

// ===== DOM =====
const form = document.getElementById("registerForm");
const firstnameEl = document.getElementById("firstname");
const lastnameEl = document.getElementById("lastname");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const confirmEl = document.getElementById("confirm_password");
const submitBtn = document.getElementById("submitBtn");

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
    position: fixed; inset: 0; background: rgba(0,0,0,.45);
    display: grid; place-items: center; z-index: 9999;
    padding: 16px;
  `;

  modal.innerHTML = `
    <div style="
      width: min(420px, 100%);
      background: #fff;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
    ">
      <h3 style="margin:0 0 6px;">Email tasdiqlash</h3>
      <p style="margin:0 0 14px; color:#444; font-size:14px;">
        Emailga kelgan 6 xonali kodni kiriting.
      </p>

      <label style="display:block; font-size:13px; color:#222; margin-bottom:6px;">Email</label>
      <input id="vEmail" value="${prefilledEmail || ""}" style="
        width:100%; padding:10px 12px;
        border:1px solid #ddd; border-radius:10px;
        outline:none; margin-bottom:12px;
      "/>

      <label style="display:block; font-size:13px; color:#222; margin-bottom:6px;">Kod</label>
      <input id="vCode" maxlength="6" placeholder="123456" style="
        width:100%; padding:10px 12px;
        border:1px solid #ddd; border-radius:10px;
        outline:none;
        letter-spacing: 3px;
        font-size: 18px;
        text-align:center;
        margin-bottom:14px;
      "/>

      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button id="vCancel" type="button" style="
          padding:10px 12px;
          border-radius:10px;
          border:1px solid #ddd;
          background:#fff;
          cursor:pointer;
        ">Bekor</button>

        <button id="vSubmit" type="button" style="
          padding:10px 12px;
          border-radius:10px;
          border:0;
          background:#2563eb;
          color:#fff;
          cursor:pointer;
        ">Tasdiqlash</button>
      </div>

      <p id="vMsg" style="margin:12px 0 0; color:#d00; font-size:13px;"></p>
    </div>
  `;

  document.body.appendChild(modal);

  const vEmail = modal.querySelector("#vEmail");
  const vCode = modal.querySelector("#vCode");
  const vCancel = modal.querySelector("#vCancel");
  const vSubmit = modal.querySelector("#vSubmit");
  const vMsg = modal.querySelector("#vMsg");

  vCancel.addEventListener("click", () => modal.remove());

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  vSubmit.addEventListener("click", async () => {
    vMsg.textContent = "";

    const email = vEmail.value.trim();
    const code = vCode.value.trim();

    if (!email) return (vMsg.textContent = "Email bo‘sh bo‘lmasin");
    if (code.length !== 6) return (vMsg.textContent = "Kod 6 xonali bo‘lishi kerak");

    try {
      vSubmit.disabled = true;
      vSubmit.textContent = "Tekshirilmoqda...";

      const res = await fetch(`${API_BASE}/auth/register/verify_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        vMsg.textContent = data?.detail || "Xatolik";
        return;
      }

      // bu endpoint TokenOut qaytaradi (senda shunaqa ishlayapti)
      saveAuth(data);

      // indexga o'tamiz
      window.location.href = "index.html";
    } catch (e) {
      vMsg.textContent = "Serverga ulanib bo‘lmadi";
    } finally {
      vSubmit.disabled = false;
      vSubmit.textContent = "Tasdiqlash";
    }
  });
}

// ===== Register submit =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    firstname: firstnameEl.value.trim(),
    lastname: lastnameEl.value.trim(),
    email: emailEl.value.trim(),
    password: passwordEl.value,
    confirm_password: confirmEl.value,
  };

  if (!payload.firstname || !payload.lastname || !payload.email || !payload.password) {
    alert("Hamma maydonlarni to‘ldiring!");
    return;
  }

  if (payload.password !== payload.confirm_password) {
    alert("Parollar mos emas!");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Yuborilyapti...";

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.detail || "Register xatosi");
      return;
    }

    // Register javobida tokenOut keladi (senda shunday)
    saveAuth(data);

    // Kodni kiritadigan oynacha
    openVerifyModal(payload.email);
  } catch (err) {
    alert("Serverga ulanib bo‘lmadi");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});
#loginPage .toast-area{
  position: absolute;
  left: 16px;
  right: 16px;
  top: 12px;
  z-index: 5;
  pointer-events: none; /* toast bosilmaydi, faqat close bosiladi */
}

/* 3) Toast dizayn (Incorrect details) */
#loginPage .toast{
  pointer-events: auto; /* close bosilishi uchun */
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 12px 44px 12px 12px;
  border-radius: 12px;

  background: linear-gradient(180deg, rgba(248,81,73,0.14), rgba(248,81,73,0.08));
  border: 1px solid rgba(248,81,73,0.55);
  box-shadow: 0 14px 30px rgba(248,81,73,0.18);
  color: #7a1c1c;

  position: relative;
  overflow: hidden;

  /* ✅ boshlang‘ich holat: tepada, ko‘rinmaydi */
  opacity: 0;
  transform: translateY(-14px);
  transition: opacity .18s ease, transform .18s ease;
}

#loginPage .toast::before{
  content:"";
  position:absolute;
  left:0; top:0; bottom:0;
  width: 4px;
  background: #f85149;
}

#loginPage .toast-icon{
  width: 26px; height: 26px;
  display: grid;
  place-items: center;
  color: #f85149;
  flex: 0 0 26px;
}

#loginPage .toast-text{
  flex: 1;
  font-weight: 800;
  font-size: 14px;
}

#loginPage .toast-close{
  position:absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 9px;
  border: 1px solid rgba(248,81,73,0.55);
  background: rgba(248,81,73,0.10);
  cursor: pointer;
  display: grid;
  place-items: center;
  opacity: .8;
}
#loginPage .toast-close:hover{ opacity: 1; }

/* 4) ✅ tepadan tushish / yuqoriga chiqib ketish */
#loginPage .toast.is-in{
  opacity: 1;
  transform: translateY(0);
}

#loginPage .toast.is-out{
  opacity: 0;
  transform: translateY(-10px);
}