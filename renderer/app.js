/* ===== Star Glaze Launcher — App Logic ===== */

// ===== ANTI-SNIFF: Obfuscated backend + website URLs =====
const _b = atob("aHR0cDovLzI2LjI1Mi4xMjMuMjQzOjM1NTE="); // backend :3551
const _w = atob("aHR0cDovLzI2LjI1Mi4xMjMuMjQzOjgwODA="); // website :8080

const content = document.getElementById("content");
let currentPage = "login";
let config = {
  gamePath: "",
  lastPlayed: null,
  accessToken: null,
  refreshToken: null,
  accountId: null,
  displayName: null,
  builds: [],
  settings: {},
  backendUrl: null,
};

const CLIENT_CREDENTIALS = "ec684b8c687f479fadea3cb2ad83f5c6:e1f31c211f28413186262d37a13fc84d";
const DISCORD_CLIENT_ID = "1383979067250053200";
const CLIENT_CREDENTIALS_B64 = btoa(CLIENT_CREDENTIALS);

// ===== ANTI-SNIFF: Override console methods to filter backend IP =====
(function() {
  const _ip = _b;
  const _ipw = _w;
  const _host = _ip.replace(/^https?:\/\//, "");
  const _hostw = _ipw.replace(/^https?:\/\//, "");
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  function sanitize(args) {
    return args.map((a) => {
      if (typeof a === "string" && (a.includes(_host) || a.includes(_ip) || a.includes(_hostw) || a.includes(_ipw))) {
        return a.replace(new RegExp(_host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "***.***.***:****")
               .replace(new RegExp(_ip.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "***.***.***:****")
               .replace(new RegExp(_hostw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "***.***.***:****")
               .replace(new RegExp(_ipw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "***.***.***:****");
      }
      return a;
    });
  }

  console.log = function(...args) { origLog.apply(console, sanitize(args)); };
  console.warn = function(...args) { origWarn.apply(console, sanitize(args)); };
  console.error = function(...args) { origError.apply(console, sanitize(args)); };
})();

// ===== ANTI-SNIFF: Disable right-click & devtools shortcuts =====
if (window.starglaze) {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

document.addEventListener("keydown", (e) => {
  if (e.key === "F12") { e.preventDefault(); return; }
  if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) { e.preventDefault(); return; }
  if (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j")) { e.preventDefault(); return; }
  if (e.ctrlKey && (e.key === "U" || e.key === "u")) { e.preventDefault(); return; }
});

// ===== API Helper =====
const API = {
  _b,
  _w,
  token: null,
  accountId: null,
  displayName: null,

  get baseUrl() { return config.backendUrl || this._b; },
  get websiteUrl() { return this._w; },
  get obfuscatedUrl() { return "***.***.***:****"; },

  async fetch(path, opts = {}) {
    const headers = { "Content-Type": "application/json", ...opts.headers };
    if (config.accessToken) headers["Authorization"] = `bearer eg1~${config.accessToken}`;
    try {
      const res = await fetch(this._b + path, { ...opts, headers });
      if (!res.ok && res.status === 401) {
        handleLogout();
        return null;
      }
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) return res.json();
      return res.text();
    } catch (err) {
      console.error("Connection Error");
      return null;
    }
  },

  async post(path, body, opts = {}) {
    return this.fetch(path, { method: "POST", body, ...opts });
  },

  async postJSON(path, body, opts = {}) {
    const headers = { "Content-Type": "application/json", ...opts.headers };
    return this.fetch(path, { method: "POST", body: JSON.stringify(body), headers, ...opts });
  },
};

// ===== Version Map =====
const VERSION_MAP = {
  "8.00": "Season 8",
  "8.10": "Season 8",
  "8.20": "Season 8",
  "8.30": "Season 8",
  "8.40": "Season 8",
  "8.50": "Season 8",
  "8.51": "Season 8",
  "7.00": "Season 7",
  "7.10": "Season 7",
  "7.20": "Season 7",
  "7.30": "Season 7",
  "7.40": "Season 7",
  "6.00": "Season 6",
  "6.10": "Season 6",
  "6.20": "Season 6",
  "6.21": "Season 6",
  "6.30": "Season 6",
  "6.31": "Season 6",
  "5.00": "Season 5",
  "5.10": "Season 5",
  "5.20": "Season 5",
  "5.21": "Season 5",
  "5.30": "Season 5",
  "5.40": "Season 5",
  "5.41": "Season 5",
  "4.00": "Season 4",
  "4.10": "Season 4",
  "4.20": "Season 4",
  "4.30": "Season 4",
  "4.40": "Season 4",
  "4.50": "Season 4",
  "3.00": "Season 3",
  "3.10": "Season 3",
  "3.20": "Season 3",
  "3.30": "Season 3",
  "3.50": "Season 3",
  "2.00": "Season 2",
  "2.10": "Season 2",
  "2.20": "Season 2",
  "2.30": "Season 2",
  "2.40": "Season 2",
  "2.50": "Season 2",
  "1.00": "Season 1",
  "1.10": "Season 1",
  "1.20": "Season 1",
};

// ===== Auth =====
async function loginWithExchangeCode(code) {
  const body = new URLSearchParams({
    grant_type: "exchange_code",
    exchange_code: code,
  });
  try {
    const res = await fetch(API._b + "/account/api/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + btoa(CLIENT_CREDENTIALS),
      },
      body,
    });
    const data = await res.json();
    if (data.access_token) {
      const token = data.access_token.replace("eg1~", "");
      config.accessToken = token;
      config.refreshToken = data.refresh_token ? data.refresh_token.replace("eg1~", "") : null;
      config.accountId = data.account_id;
      config.displayName = data.displayName;
      await persistConfig();
      return { success: true };
    }
    return { success: false, error: data.errorMessage || data.error_description || "Login failed" };
  } catch (err) {
    return { success: false, error: "Connection Error" };
  }
}

function handleLogout() {
  config.accessToken = null;
  config.refreshToken = null;
  config.accountId = null;
  config.displayName = null;
  persistConfig();
  currentPage = "login";
  renderSidebar();
  renderPage("login");
}

function isLoggedIn() {
  return !!(config.accessToken && config.accountId);
}

async function persistConfig() {
  if (window.starglaze) {
    await window.starglaze.saveConfig(config);
  }
}

// ===== Title Bar Controls =====
document.getElementById("btn-minimize")?.addEventListener("click", () => window.starglaze?.minimize());
document.getElementById("btn-maximize")?.addEventListener("click", () => window.starglaze?.maximize());
document.getElementById("btn-close")?.addEventListener("click", () => window.starglaze?.close());

// ===== Sidebar =====
function renderSidebar() {
  const nav = document.getElementById("sidebar-nav");
  const footer = document.getElementById("sidebar-footer");

  if (!isLoggedIn()) {
    nav.innerHTML = `
      <div class="nav-section">
        <span class="nav-label">ACCOUNT</span>
        <button class="nav-item active" data-page="login">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
          <span>Login</span>
        </button>
      </div>
    `;
    footer.innerHTML = `
      <div class="server-status">
        <div class="status-dot offline"></div>
        <span>Not logged in</span>
      </div>
    `;
  } else {
    nav.innerHTML = `
      <div class="nav-section">
        <span class="nav-label">MAIN</span>
        <button class="nav-item${currentPage === "home" ? " active" : ""}" data-page="home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span>Home</span>
        </button>
        <button class="nav-item${currentPage === "play" ? " active" : ""}" data-page="play">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          <span>Play</span>
        </button>
        <button class="nav-item${currentPage === "builds" ? " active" : ""}" data-page="builds">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/></svg>
          <span>Builds</span>
        </button>
      </div>
      <div class="nav-section">
        <span class="nav-label">BROWSE</span>
        <button class="nav-item${currentPage === "locker" ? " active" : ""}" data-page="locker">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
          <span>Locker</span>
        </button>
        <button class="nav-item${currentPage === "shop" ? " active" : ""}" data-page="shop">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>
          <span>Item Shop</span>
        </button>
        <button class="nav-item${currentPage === "leaderboard" ? " active" : ""}" data-page="leaderboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4v8a5 5 0 0 1-10 0V4"/><path d="M5 8h14"/></svg>
          <span>Leaderboard</span>
        </button>
      </div>
      <div class="nav-section">
        <span class="nav-label">SOCIAL</span>
        <button class="nav-item${currentPage === "friends" ? " active" : ""}" data-page="friends">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Friends</span>
        </button>
      </div>
      <div class="nav-section">
        <span class="nav-label">OTHER</span>
        <button class="nav-item${currentPage === "server" ? " active" : ""}" data-page="server">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
          <span>Server Status</span>
        </button>
        <button class="nav-item${currentPage === "settings" ? " active" : ""}" data-page="settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>Settings</span>
        </button>
      </div>
    `;
    footer.innerHTML = `
      <div class="sidebar-user">
        <div class="user-avatar">${(config.displayName || "?")[0].toUpperCase()}</div>
        <div class="user-info">
          <span class="user-name">${escapeHtml(config.displayName || "Unknown")}</span>
          <span class="user-status">Online</span>
        </div>
      </div>
    `;
  }

  // Rebind nav clicks
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentPage = btn.dataset.page;
      renderPage(currentPage);
    });
  });
}

// ===== Particle System =====
function initParticles() {
  const canvas = document.getElementById("particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 123, 184, ${p.alpha})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ===== Helpers =====
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===== ANTI-SNIFF: Sanitize any string for display — strip backend IPs =====
const _ipPattern = (() => {
  const host = _b.replace(/^https?:\/\//, "");
  const hostw = _w.replace(/^https?:\/\//, "");
  const parts = [_b, _w, host, hostw].map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(parts.join("|"), "g");
})();

function sanitizeForDisplay(str) {
  if (typeof str !== "string") return str;
  return str.replace(_ipPattern, "***");
}

function openExternal(url) {
  if (window.starglaze?.openExternal) {
    // Electron: opens in default browser via shell.openExternal
    window.starglaze.openExternal(url);
  } else {
    // Web preview fallback — show clickable link since browser blocks direct HTTP nav
    const existing = document.getElementById("_ext_link_overlay");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "_ext_link_overlay";
    overlay.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1E1E28;border:1px solid #8B7BB8;border-radius:10px;padding:14px 20px;z-index:9999;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5)";
    overlay.innerHTML = `<span style="font-size:13px;color:#A0A0AA">Open in browser:</span><a href="${url}" target="_blank" style="color:#8B7BB8;font-size:13px;font-weight:600;word-break:break-all">${url}</a><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#6B6B78;cursor:pointer;font-size:16px;padding:0 4px">✕</button>`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay?.remove(), 15000);
  }
}

function getBuildDisplayName(version) {
  if (!version) return "Unknown Build";
  const season = VERSION_MAP[version];
  return season ? `${season} (${version})` : `Build ${version}`;
}

function getSeasonNumber(version) {
  if (!version) return null;
  const major = parseInt(version.split(".")[0]);
  return isNaN(major) ? null : major;
}

function getSeasonCSSClass(version) {
  const s = getSeasonNumber(version);
  if (s === null) return "season-unknown";
  if (s >= 1 && s <= 3) return "season-1-3";
  if (s === 4) return "season-4";
  if (s === 5 || s === 6) return "season-5-6";
  if (s === 7) return "season-7";
  if (s === 8) return "season-8";
  if (s === 9) return "season-9";
  if (s === 10) return "season-x";
  return "season-unknown";
}

// ===== Page Renderers =====
function renderPage(page) {
  const renderers = {
    login: renderLogin,
    home: renderHome,
    play: renderPlay,
    builds: renderBuilds,
    locker: renderLocker,
    shop: renderShop,
    leaderboard: renderLeaderboard,
    friends: renderFriends,
    server: renderServer,
    settings: renderSettings,
  };
  const fn = renderers[page];
  if (fn) fn();
}

// ===== LOGIN PAGE =====
function renderLogin() {
  content.innerHTML = `
    <div class="page-login">
      <img src="./logo.png" class="login-logo" alt="Star Glaze">
      <h1 class="login-title"><span class="star">Star </span><span class="glaze">Glaze</span></h1>
      <p class="login-subtitle">Welcome to Star Glaze</p>

      <button class="login-discord-btn" id="btn-discord-login" style="display:flex;align-items:center;gap:10px;justify-content:center;width:100%;max-width:360px;padding:16px 28px;background:#5865F2;color:white;border:none;border-radius:var(--radius-md);font-size:16px;font-weight:700;cursor:pointer;transition:var(--transition);box-shadow:0 4px 20px rgba(88,101,242,0.3);margin-bottom:24px;">
        <svg width="22" height="22" viewBox="0 0 127.14 96.36" fill="white"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53.05s5-12.68 11.43-12.68S53.89 46 53.88 53.05 48.84 65.69 42.45 65.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53.05s5-12.68 11.44-12.68S96.23 46 96.12 53.05 91.08 65.69 84.69 65.69Z"/></svg>
        Login with Discord
      </button>

      <details class="login-manual-section" style="width:100%;max-width:360px;">
        <summary style="color:var(--text-muted);font-size:13px;cursor:pointer;text-align:center;list-style:none;user-select:none;">
          <span style="border-bottom:1px dashed var(--text-muted);">Enter code manually</span>
        </summary>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px;">
          <div class="login-field">
            <label>Exchange Code</label>
            <input type="text" id="login-code" placeholder="Paste your code here" autocomplete="off" style="width:100%;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-sm);color:var(--text-primary);font-size:14px;">
          </div>
          <div class="login-error" id="login-error"></div>
          <button class="login-btn" id="login-btn" style="width:100%;padding:12px;background:var(--accent-primary);color:white;border:none;border-radius:var(--radius-sm);font-size:14px;font-weight:600;cursor:pointer;transition:var(--transition);">VERIFY</button>
        </div>
      </details>

      <p class="login-hint" style="margin-top:20px;">Sign in via Discord. Your account is created automatically.</p>
    </div>
  `;

  document.getElementById("btn-discord-login")?.addEventListener("click", () => {
    openExternal(API.websiteUrl + "/login");
  });

  document.getElementById("login-btn")?.addEventListener("click", async () => {
    const code = document.getElementById("login-code").value.trim();
    if (!code) return;
    const btn = document.getElementById("login-btn");
    const errorEl = document.getElementById("login-error");
    errorEl.textContent = "";
    btn.textContent = "VERIFYING...";
    btn.disabled = true;

    const result = await loginWithExchangeCode(code);
    if (result.success) {
      currentPage = "home";
      renderSidebar();
      renderPage("home");
    } else {
      errorEl.textContent = result.error;
      btn.textContent = "VERIFY";
      btn.disabled = false;
    }
  });
}

// ===== HOME PAGE =====
function renderHome() {
  content.innerHTML = `
    <div class="page-home">
      <div class="hero-banner">
        <img src="./banner.png" alt="Star Glaze">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title"><span class="star">Star </span><span class="glaze">Glaze</span></h1>
          <p class="hero-subtitle">Welcome back, <strong>${escapeHtml(config.displayName || "Player")}</strong></p>
          <div class="hero-actions">
            <button class="btn-primary" onclick="navigateTo('play')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              Launch Game
            </button>
            <button class="btn-secondary" onclick="navigateTo('shop')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20"/></svg>
              Item Shop
            </button>
          </div>
        </div>
      </div>

      <div class="home-sections">
        <div class="stats-row" id="home-stats">
          <div class="stat-card"><div class="stat-value shimmer-text">—</div><div class="stat-label">Wins</div></div>
          <div class="stat-card"><div class="stat-value shimmer-text">—</div><div class="stat-label">Kills</div></div>
          <div class="stat-card"><div class="stat-value shimmer-text">—</div><div class="stat-label">Matches</div></div>
          <div class="stat-card"><div class="stat-value shimmer-text" id="home-server-status">—</div><div class="stat-label">Server</div></div>
        </div>

        <div class="section-header">
          <h2 class="section-title">Item Shop Preview</h2>
          <span class="section-link" onclick="navigateTo('shop')">View All</span>
        </div>
        <div class="shop-preview-grid" id="home-shop-preview">
          <div class="shimmer" style="height:180px;border-radius:10px"></div>
          <div class="shimmer" style="height:180px;border-radius:10px"></div>
          <div class="shimmer" style="height:180px;border-radius:10px"></div>
          <div class="shimmer" style="height:180px;border-radius:10px"></div>
        </div>
      </div>
    </div>
  `;

  loadHomeStats();
  loadHomeShopPreview();
  loadServerStatus();
}

async function loadHomeStats() {
  const data = await API.fetch(`/fortnite/api/statsv2/account/${config.accountId}`);
  const statsRow = document.getElementById("home-stats");
  if (!statsRow) return;

  let wins = 0, kills = 0, matches = 0;
  if (data && data.stats) {
    for (const [key, val] of Object.entries(data.stats)) {
      if (key.includes("placetop1")) wins += val;
      if (key.includes("kills")) kills += val;
      if (key.includes("matchesplayed")) matches += val;
    }
  }

  const cards = statsRow.querySelectorAll(".stat-card");
  if (cards[0]) cards[0].querySelector(".stat-value").textContent = wins;
  if (cards[1]) cards[1].querySelector(".stat-value").textContent = kills;
  if (cards[2]) cards[2].querySelector(".stat-value").textContent = matches;
}

async function loadServerStatus() {
  const el = document.getElementById("home-server-status");
  if (!el) return;
  try {
    const start = Date.now();
    const res = await fetch(API.baseUrl + "/lightswitch/api/service/Fortnite/status");
    if (res.ok) {
      el.textContent = "Online";
      el.style.color = "var(--green-online)";
    } else {
      el.textContent = "Offline";
      el.style.color = "var(--red-danger)";
    }
  } catch {
    el.textContent = "Offline";
    el.style.color = "var(--red-danger)";
  }
}

async function loadHomeShopPreview() {
  const grid = document.getElementById("home-shop-preview");
  if (!grid) return;

  const catalog = await API.fetch("/fortnite/api/storefront/v2/catalog");
  if (!catalog || !catalog.storefronts) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Could not load shop</p>';
    return;
  }

  // Prefer featured (weekly) items for preview
  let entries = [];
  for (const sf of catalog.storefronts) {
    if (sf.name === "BRWeeklyStorefront" && sf.catalogEntries) {
      entries = sf.catalogEntries;
      break;
    }
  }
  if (entries.length === 0) {
    for (const sf of catalog.storefronts) {
      if (sf.catalogEntries) {
        for (const entry of sf.catalogEntries) entries.push(entry);
      }
    }
  }

  const first4 = entries.slice(0, 4);
  grid.innerHTML = first4.map((entry, i) => {
    const prices = entry.prices || [];
    const price = prices[0]?.finalPrice ?? "?";
    return `
      <div class="shop-card" id="home-shop-card-${i}">
        <div class="shop-card-img"><div class="shimmer" style="width:100%;height:100%"></div></div>
        <div class="shop-card-body">
          <h4>${escapeHtml(entry.devName || "Item")}</h4>
          <div class="shop-price"><span style="color:var(--purple-light);font-weight:700">V</span> ${typeof price === "number" ? price.toLocaleString() : price}</div>
        </div>
      </div>
    `;
  }).join("");

  // Fetch icons
  for (let i = 0; i < first4.length; i++) {
    const grants = first4[i].itemGrants || [];
    const tid = grants[0]?.templateId || "";
    if (!tid) continue;
    const info = await fetchShopIcon(tid);
    const card = document.getElementById(`home-shop-card-${i}`);
    if (!card) continue;
    if (info?.icon) {
      const imgWrap = card.querySelector(".shop-card-img");
      if (imgWrap) imgWrap.innerHTML = `<img src="${info.icon}" alt="" style="width:100%;height:100%;object-fit:cover">`;
    }
    if (info?.name) {
      const h4 = card.querySelector("h4");
      if (h4) h4.textContent = info.name;
    }
  }
}

// ===== BUILDS PAGE =====
function renderBuilds() {
  const builds = config.builds || [];

  content.innerHTML = `
    <div class="page-builds">
      <div class="builds-header">
        <div>
          <h1 class="page-title">My Builds</h1>
          <p class="page-subtitle">Manage your Fortnite game builds</p>
        </div>
        <button class="btn-primary" id="btn-import-build">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          Import Build
        </button>
      </div>

      <div class="builds-grid" id="builds-list">
        ${builds.map((build) => {
          const seasonNum = getSeasonNumber(build.version);
          const seasonName = VERSION_MAP[build.version] || "Unknown";
          const cssClass = getSeasonCSSClass(build.version);
          const statusClass = build.status || "ready";
          const statusLabel = statusClass === "ready" ? "Ready" : statusClass === "error" ? "Error" : "Needs Update";
          return `
          <div class="build-grid-card ${cssClass}" data-build-id="${escapeHtml(build.id)}">
            <span class="build-status-badge status-${statusClass}">${statusLabel}</span>
            <div class="build-grid-art">
              <span class="build-season-label">${escapeHtml(seasonName)}</span>
              <span class="build-version-label">${escapeHtml(build.version || "?")}</span>
            </div>
            <div class="build-grid-footer">
              ${build.lastPlayed ? `<span class="build-last-played">Last: ${new Date(build.lastPlayed).toLocaleDateString()}</span>` : `<span class="build-last-played">Never played</span>`}
              <div class="build-grid-actions">
                <button class="btn-primary build-launch-btn" data-build-id="${escapeHtml(build.id)}" style="padding:6px 16px;font-size:12px">Launch</button>
                <button class="build-remove-link build-remove-btn" data-build-id="${escapeHtml(build.id)}">Remove</button>
              </div>
            </div>
          </div>
        `}).join("")}
        <div class="build-grid-card build-import-card" id="btn-import-build-card">
          <div class="build-import-inner">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            <span style="color:var(--text-muted);font-size:13px;font-weight:500">Import Build</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Import build buttons
  const importHandler = async () => {
    if (!window.starglaze) return;

    const result = await window.starglaze.importBuild();
    if (!result) return;

    if (result.error) {
      alert(result.error);
      return;
    }

    const name = getBuildDisplayName(result.version);
    const build = {
      id: result.id,
      name: name,
      path: result.path,
      version: result.version,
      exePath: result.exePath,
      lastPlayed: null,
      status: "ready",
    };

    if (!config.builds) config.builds = [];
    config.builds.push(build);
    await persistConfig();
    renderBuilds();
  };

  document.getElementById("btn-import-build")?.addEventListener("click", importHandler);
  document.getElementById("btn-import-build-card")?.addEventListener("click", importHandler);

  // Launch buttons
  document.querySelectorAll(".build-launch-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const buildId = btn.dataset.buildId;
      const build = (config.builds || []).find((b) => b.id === buildId);
      if (!build) return;

      btn.textContent = "Launching...";
      btn.disabled = true;

      if (window.starglaze) {
        const result = await window.starglaze.launchGame({
          buildPath: build.path,
          accessToken: config.accessToken,
          accountId: config.accountId,
        });

        if (!result.success) {
          btn.textContent = "Error";
          setTimeout(() => { btn.textContent = "Launch"; btn.disabled = false; }, 3000);
          return;
        }

        build.lastPlayed = new Date().toISOString();
        await persistConfig();
        btn.textContent = "Running";
      } else {
        setTimeout(() => { btn.textContent = "Launch"; btn.disabled = false; }, 2000);
      }
    });
  });

  // Remove buttons
  document.querySelectorAll(".build-remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const buildId = btn.dataset.buildId;
      config.builds = (config.builds || []).filter((b) => b.id !== buildId);
      await persistConfig();
      if (window.starglaze) await window.starglaze.removeBuild(buildId);
      renderBuilds();
    });
  });
}

// ===== PLAY PAGE =====
function renderPlay() {
  const builds = config.builds || [];
  const hasBuilds = builds.length > 0;
  const selectedBuildId = config.selectedBuildId || (builds[0]?.id || "");

  content.innerHTML = `
    <div class="page-play">
      <img src="./logo.png" class="play-logo" alt="Star Glaze">
      <h1 class="play-title"><span class="star">Star </span><span class="glaze">Glaze</span></h1>
      <p class="play-subtitle">Launch into OG Fortnite</p>

      <div class="play-info-row">
        <div class="play-info-item">
          <span class="play-info-label">Account</span>
          <span class="play-info-value">${escapeHtml(config.displayName || "—")}</span>
        </div>
        <div class="play-info-item">
          <span class="play-info-label">Backend</span>
          <span class="play-info-value">${API.obfuscatedUrl}</span>
        </div>
      </div>

      ${hasBuilds ? `
        <div class="play-build-select">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E5E70" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/></svg>
          <select class="build-dropdown" id="build-select">
            ${builds.map((b) => `<option value="${escapeHtml(b.id)}" ${b.id === selectedBuildId ? "selected" : ""}>${escapeHtml(b.name)}</option>`).join("")}
          </select>
        </div>
        <button class="launch-btn" id="btn-launch">LAUNCH</button>
      ` : `
        <div class="play-no-builds">
          <p style="color:var(--text-muted);margin-bottom:16px">Import a build first to start playing</p>
          <button class="btn-primary" id="btn-go-builds">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Go to Builds
          </button>
        </div>
      `}

      ${config.lastPlayed ? `<p style="margin-top:16px;font-size:11px;color:var(--text-muted)">Last played: ${new Date(config.lastPlayed).toLocaleDateString()}</p>` : ""}
    </div>
  `;

  // Save selected build
  document.getElementById("build-select")?.addEventListener("change", async (e) => {
    config.selectedBuildId = e.target.value;
    await persistConfig();
  });

  // Go to builds page
  document.getElementById("btn-go-builds")?.addEventListener("click", () => {
    navigateTo("builds");
  });

  // Launch button
  document.getElementById("btn-launch")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-launch");
    const selectEl = document.getElementById("build-select");
    const buildId = selectEl?.value;
    const build = (config.builds || []).find((b) => b.id === buildId);

    if (!build) {
      btn.textContent = "NO BUILD SELECTED";
      setTimeout(() => { btn.textContent = "LAUNCH"; }, 2000);
      return;
    }

    btn.textContent = "LAUNCHING...";
    btn.disabled = true;

    if (window.starglaze) {
      // Get a fresh exchange code from Better-Reload before launching
      // This lets the game use -AUTH_TYPE=exchangecode which is correct
      let exchangeCode = null;
      try {
        const exchRes = await fetch(API._b + "/account/api/oauth/exchange", {
          headers: { "Authorization": `bearer eg1~${config.accessToken}` }
        });
        const exchData = await exchRes.json();
        if (exchData.code) exchangeCode = exchData.code;
      } catch {}

      const result = await window.starglaze.launchGame({
        buildPath: build.path,
        accessToken: config.accessToken,
        accountId: config.accountId,
        exchangeCode: exchangeCode,
      });

      if (!result.success) {
        btn.textContent = result.error ? result.error.toUpperCase() : "ERROR";
        setTimeout(() => { btn.textContent = "LAUNCH"; btn.disabled = false; }, 3000);
        return;
      }

      build.lastPlayed = new Date().toISOString();
      config.lastPlayed = build.lastPlayed;
      await persistConfig();
      btn.textContent = "RUNNING";
    } else {
      setTimeout(() => { btn.textContent = "LAUNCH"; btn.disabled = false; }, 2000);
    }
  });
}

// ===== LOCKER PAGE (Season 8 filtered) =====
function renderLocker() {
  content.innerHTML = `
    <div class="page-locker">
      <h1 class="page-title">Locker</h1>
      <p class="page-subtitle">Your cosmetics collection (Season 8 and earlier)</p>
      <div class="cat-tabs" id="locker-tabs">
        <button class="cat-tab active" data-type="AthenaCharacter">Outfits <span class="cat-count" id="count-AthenaCharacter"></span></button>
        <button class="cat-tab" data-type="AthenaBackpack">Back Blings <span class="cat-count" id="count-AthenaBackpack"></span></button>
        <button class="cat-tab" data-type="AthenaPickaxe">Pickaxes <span class="cat-count" id="count-AthenaPickaxe"></span></button>
        <button class="cat-tab" data-type="AthenaGlider">Gliders <span class="cat-count" id="count-AthenaGlider"></span></button>
        <button class="cat-tab" data-type="AthenaDance">Emotes <span class="cat-count" id="count-AthenaDance"></span></button>
        <button class="cat-tab" data-type="AthenaItemWrap">Wraps <span class="cat-count" id="count-AthenaItemWrap"></span></button>
      </div>
      <div class="cosmetics-grid" id="locker-grid">
        ${Array(12).fill('<div class="shimmer" style="height:140px;border-radius:10px"></div>').join("")}
      </div>
    </div>
  `;

  let allItems = {};
  let activeType = "AthenaCharacter";
  const iconCache = {};
  const cosmeticDataCache = {};

  async function getCosmeticData(cosmeticId) {
    if (cosmeticDataCache[cosmeticId]) return cosmeticDataCache[cosmeticId];
    try {
      const res = await fetch(`https://fortnite-api.com/v2/cosmetics/br/${cosmeticId}`);
      const data = await res.json();
      cosmeticDataCache[cosmeticId] = data?.data || null;
      return data?.data || null;
    } catch {
      return null;
    }
  }

  function isSeasonValid(cosmeticData) {
    if (!cosmeticData || !cosmeticData.introduction) return true; // show if unknown
    const intro = cosmeticData.introduction;
    const chapter = parseInt(intro.chapter) || 1;
    const season = parseInt(intro.season) || 1;
    if (chapter > 1) return false;
    if (season > 8) return false;
    return true;
  }

  async function loadProfile() {
    const data = await API.postJSON(
      `/fortnite/api/game/v2/profile/${config.accountId}/client/QueryProfile?profileId=athena&rvn=-1`,
      {}
    );

    if (!data || !data.profileChanges || !data.profileChanges[0]) {
      document.getElementById("locker-grid").innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Could not load profile</p>';
      return;
    }

    const profile = data.profileChanges[0].profile;
    if (!profile || !profile.items) {
      document.getElementById("locker-grid").innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">No items found</p>';
      return;
    }

    // Group items by type
    const rawItems = {};
    for (const [itemId, item] of Object.entries(profile.items)) {
      const tid = item.templateId || "";
      const colonIdx = tid.indexOf(":");
      if (colonIdx === -1) continue;
      const type = tid.substring(0, colonIdx);
      const cosmId = tid.substring(colonIdx + 1);
      if (!rawItems[type]) rawItems[type] = [];
      rawItems[type].push({ itemId, templateId: tid, type, cosmeticId: cosmId, attributes: item.attributes });
    }

    // Filter items by Season 8 and earlier using fortnite-api.com data
    const types = ["AthenaCharacter", "AthenaBackpack", "AthenaPickaxe", "AthenaGlider", "AthenaDance", "AthenaItemWrap"];
    allItems = {};

    for (const t of types) {
      const items = rawItems[t] || [];
      const filtered = [];

      // Process in batches to avoid overwhelming the API
      for (const item of items) {
        const cosData = await getCosmeticData(item.cosmeticId);
        if (isSeasonValid(cosData)) {
          filtered.push(item);
        }
      }

      allItems[t] = filtered;
    }

    // Update counts
    for (const t of types) {
      const el = document.getElementById(`count-${t}`);
      if (el) el.textContent = `(${(allItems[t] || []).length})`;
    }

    renderLockerItems(activeType);
  }

  function renderLockerItems(type) {
    const grid = document.getElementById("locker-grid");
    const items = allItems[type] || [];
    if (items.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">No items in this category</p>';
      return;
    }

    grid.innerHTML = items.map((item) => `
      <div class="cosmetic-card" data-cosm-id="${escapeHtml(item.cosmeticId)}">
        <div class="cosm-img-placeholder shimmer" style="aspect-ratio:1"></div>
        <span>${escapeHtml(item.cosmeticId.replace(/_/g, " "))}</span>
      </div>
    `).join("");

    // Load icons lazily
    items.forEach(async (item, idx) => {
      const cosData = cosmeticDataCache[item.cosmeticId];
      const url = cosData?.images?.smallIcon || cosData?.images?.icon || "";
      const cards = grid.querySelectorAll(".cosmetic-card");
      if (cards[idx]) {
        const placeholder = cards[idx].querySelector(".cosm-img-placeholder");
        if (placeholder && url) {
          const img = document.createElement("img");
          img.src = url;
          img.alt = item.cosmeticId;
          img.loading = "lazy";
          placeholder.replaceWith(img);
        } else if (placeholder) {
          placeholder.classList.remove("shimmer");
          placeholder.style.background = "rgba(139,123,184,0.1)";
        }
      }
    });
  }

  document.querySelectorAll("#locker-tabs .cat-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#locker-tabs .cat-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeType = tab.dataset.type;
      renderLockerItems(activeType);
    });
  });

  loadProfile();
}

// ===== ITEM SHOP PAGE =====
const shopIconCache = {};

async function fetchShopIcon(templateId) {
  if (!templateId || !templateId.includes(":")) return null;
  const itemId = templateId.split(":")[1];
  if (shopIconCache[itemId]) return shopIconCache[itemId];
  try {
    const res = await fetch(`https://fortnite-api.com/v2/cosmetics/br/${encodeURIComponent(itemId)}?language=en`);
    const data = await res.json();
    const icon = data?.data?.images?.icon || data?.data?.images?.smallIcon || null;
    const name = data?.data?.name || null;
    const rarity = data?.data?.rarity?.value || null;
    shopIconCache[itemId] = { icon, name, rarity };
    return shopIconCache[itemId];
  } catch {
    shopIconCache[itemId] = { icon: null, name: null, rarity: null };
    return shopIconCache[itemId];
  }
}

function renderShop() {
  content.innerHTML = `
    <div class="page-shop">
      <h1 class="page-title">Item Shop</h1>
      <p class="page-subtitle">Today's featured items</p>
      <h2 class="section-title" style="margin-bottom:16px">Featured</h2>
      <div class="shop-grid" id="shop-grid-featured">
        ${Array(4).fill('<div class="shimmer" style="height:240px;border-radius:10px"></div>').join("")}
      </div>
      <h2 class="section-title" style="margin:32px 0 16px">Daily</h2>
      <div class="shop-grid" id="shop-grid-daily">
        ${Array(4).fill('<div class="shimmer" style="height:240px;border-radius:10px"></div>').join("")}
      </div>
    </div>
  `;

  loadShop();
}

async function loadShop() {
  const featuredGrid = document.getElementById("shop-grid-featured");
  const dailyGrid = document.getElementById("shop-grid-daily");
  if (!featuredGrid || !dailyGrid) return;

  const catalog = await API.fetch("/fortnite/api/storefront/v2/catalog");
  if (!catalog || !catalog.storefronts) {
    featuredGrid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Could not load item shop</p>';
    dailyGrid.innerHTML = "";
    return;
  }

  let featuredEntries = [];
  let dailyEntries = [];

  for (const sf of catalog.storefronts) {
    if (sf.name === "BRWeeklyStorefront" && sf.catalogEntries) {
      featuredEntries = sf.catalogEntries;
    } else if (sf.name === "BRDailyStorefront" && sf.catalogEntries) {
      dailyEntries = sf.catalogEntries;
    }
  }

  async function renderShopSection(grid, entries) {
    if (entries.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">No items</p>';
      return;
    }

    // Render placeholder cards first
    grid.innerHTML = entries.map((entry, i) => {
      const prices = entry.prices || [];
      const price = prices[0]?.finalPrice ?? "?";
      const devName = entry.devName || "Unknown Item";
      return `
        <div class="shop-card" id="shop-card-${i}-${grid.id}">
          <div class="shop-card-img">
            <div class="shimmer" style="width:100%;height:100%"></div>
          </div>
          <div class="shop-card-body">
            <h4>${escapeHtml(devName)}</h4>
            <div class="shop-price">
              <span style="color:var(--purple-light);font-weight:700">V</span>
              ${typeof price === "number" ? price.toLocaleString() : price}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Fetch icons and update cards
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const grants = entry.itemGrants || [];
      const firstGrant = grants[0]?.templateId || "";
      if (!firstGrant) continue;

      const info = await fetchShopIcon(firstGrant);
      const card = document.getElementById(`shop-card-${i}-${grid.id}`);
      if (!card) continue;

      const rarityColors = {
        legendary: "#c97c1b",
        epic: "#8138C2",
        rare: "#2f7be3",
        uncommon: "#60aa3a",
        common: "#8c8c8c",
      };

      if (info?.rarity) {
        const borderColor = rarityColors[info.rarity] || "var(--border-card)";
        card.style.borderColor = borderColor;
      }

      if (info?.name) {
        const h4 = card.querySelector("h4");
        if (h4) h4.textContent = info.name;
      }

      if (info?.icon) {
        const imgWrap = card.querySelector(".shop-card-img");
        if (imgWrap) imgWrap.innerHTML = `<img src="${info.icon}" alt="" style="width:100%;height:100%;object-fit:cover">`;
      }
    }
  }

  await Promise.all([
    renderShopSection(featuredGrid, featuredEntries),
    renderShopSection(dailyGrid, dailyEntries),
  ]);
}

function renderShopCard(entry) {
  const title = entry.devName || "Unknown Item";
  const prices = entry.prices || [];
  const price = prices[0]?.finalPrice ?? "?";
  return `
    <div class="shop-card">
      <div class="shop-card-img">
        <div class="shimmer" style="width:100%;height:100%"></div>
      </div>
      <div class="shop-card-body">
        <h4>${escapeHtml(title)}</h4>
        <div class="shop-price">
          <span style="color:var(--purple-light);font-weight:700">V</span>
          ${typeof price === "number" ? price.toLocaleString() : price}
        </div>
      </div>
    </div>
  `;
}

// ===== LEADERBOARD PAGE =====
function renderLeaderboard() {
  content.innerHTML = `
    <div class="page-leaderboard">
      <h1 class="page-title">Leaderboard</h1>
      <p class="page-subtitle">Top players on the server</p>
      <div class="cat-tabs" id="lb-tabs">
        <button class="cat-tab active" data-playlist="solo">Solo</button>
        <button class="cat-tab" data-playlist="duo">Duo</button>
        <button class="cat-tab" data-playlist="squad">Squad</button>
      </div>
      <div class="leaderboard-table-wrap" id="lb-content">
        <div class="shimmer" style="height:400px;border-radius:10px"></div>
      </div>
    </div>
  `;

  const HIDDEN_ACCOUNTS = []; // Add accountIds/usernames to exclude here

  let activePlaylist = "solo";

  async function loadLeaderboard(playlist) {
    const wrap = document.getElementById("lb-content");
    if (!wrap) return;
    wrap.innerHTML = '<div class="shimmer" style="height:400px;border-radius:10px"></div>';

    let data;
    try {
      const res = await fetch(API._w + `/api/website/leaderboard?playlist=${playlist}&type=placetop1&limit=50`);
      if (res.ok) data = await res.json();
    } catch {}

    if (!data || !Array.isArray(data) || data.length === 0) {
      wrap.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No leaderboard data available</p>';
      return;
    }

    // Filter out host/moderator accounts
    data = data.filter((entry) => {
      const name = (entry.username || "").toLowerCase();
      if (name.includes("server") || name.includes("host")) return false;
      if (HIDDEN_ACCOUNTS.includes(entry.accountId) || HIDDEN_ACCOUNTS.includes(entry.username)) return false;
      return true;
    });

    // Re-rank after filtering
    data.forEach((entry, i) => { entry.rank = i + 1; });

    if (data.length === 0) {
      wrap.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No leaderboard data available</p>';
      return;
    }

    wrap.innerHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Wins</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((entry) => {
            const isMe = entry.accountId === config.accountId;
            return `
              <tr class="${isMe ? "lb-highlight" : ""}">
                <td class="lb-rank">${entry.rank}</td>
                <td class="lb-name">${escapeHtml(entry.username || entry.accountId)}</td>
                <td class="lb-value">${entry.value}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  }

  document.querySelectorAll("#lb-tabs .cat-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#lb-tabs .cat-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activePlaylist = tab.dataset.playlist;
      loadLeaderboard(activePlaylist);
    });
  });

  loadLeaderboard(activePlaylist);
}

// ===== FRIENDS PAGE =====
function renderFriends() {
  content.innerHTML = `
    <div class="page-friends">
      <h1 class="page-title">Friends</h1>
      <p class="page-subtitle">Your friends list</p>
      <div class="friends-actions">
        <input class="search-input" placeholder="Add friend by username..." id="friend-search" style="max-width:300px">
        <button class="btn-primary" id="btn-add-friend" style="padding:10px 20px;font-size:13px">Add Friend</button>
      </div>
      <div class="friends-list" id="friends-list">
        <div class="shimmer" style="height:200px;border-radius:10px"></div>
      </div>
    </div>
  `;

  loadFriends();

  document.getElementById("btn-add-friend")?.addEventListener("click", async () => {
    const input = document.getElementById("friend-search");
    const username = input.value.trim();
    if (!username) return;

    const lookup = await API.fetch(`/account/api/public/account/displayName/${encodeURIComponent(username)}`);
    if (!lookup || !lookup.id) {
      alert("User not found: " + username);
      return;
    }

    await API.post(`/friends/api/v1/${config.accountId}/friends/${lookup.id}`, null);
    input.value = "";
    loadFriends();
  });
}

async function loadFriends() {
  const list = document.getElementById("friends-list");
  if (!list) return;

  const data = await API.fetch(`/friends/api/v1/${config.accountId}/summary`);
  if (!data) {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">Could not load friends</p>';
    return;
  }

  const friends = data.friends || [];
  const incoming = data.incoming || [];
  const outgoing = data.outgoing || [];

  let html = "";

  if (incoming.length > 0) {
    html += `<h3 class="friends-section-title">Incoming Requests (${incoming.length})</h3>`;
    html += incoming.map((fr) => `
      <div class="friend-card">
        <div class="friend-avatar">${(fr.accountId || "?")[0].toUpperCase()}</div>
        <div class="friend-info">
          <span class="friend-name">${escapeHtml(fr.accountId)}</span>
          <span class="friend-status pending">Pending</span>
        </div>
        <button class="btn-browse" onclick="acceptFriend('${fr.accountId}')">Accept</button>
      </div>
    `).join("");
  }

  if (friends.length > 0) {
    html += `<h3 class="friends-section-title">Friends (${friends.length})</h3>`;
    const accountIds = friends.map(f => f.accountId).slice(0, 50);
    let accountMap = {};
    if (accountIds.length > 0) {
      const qs = accountIds.map(id => `accountId=${id}`).join("&");
      const accounts = await API.fetch(`/account/api/public/account?${qs}`);
      if (Array.isArray(accounts)) {
        for (const acc of accounts) accountMap[acc.id] = acc.displayName;
      }
    }

    html += friends.map((fr) => {
      const name = accountMap[fr.accountId] || fr.alias || fr.accountId;
      return `
        <div class="friend-card">
          <div class="friend-avatar">${name[0].toUpperCase()}</div>
          <div class="friend-info">
            <span class="friend-name">${escapeHtml(name)}</span>
            <span class="friend-status online">Friend</span>
          </div>
          <button class="btn-browse btn-danger-small" onclick="removeFriend('${fr.accountId}')">Remove</button>
        </div>
      `;
    }).join("");
  }

  if (outgoing.length > 0) {
    html += `<h3 class="friends-section-title">Sent Requests (${outgoing.length})</h3>`;
    html += outgoing.map((fr) => `
      <div class="friend-card">
        <div class="friend-avatar">?</div>
        <div class="friend-info">
          <span class="friend-name">${escapeHtml(fr.accountId)}</span>
          <span class="friend-status pending">Pending</span>
        </div>
      </div>
    `).join("");
  }

  if (!html) {
    html = '<p style="color:var(--text-muted);text-align:center;padding:40px">No friends yet. Add someone!</p>';
  }

  list.innerHTML = html;
}

// Global friend action functions
window.acceptFriend = async function(accountId) {
  await API.post(`/friends/api/v1/${config.accountId}/friends/${accountId}`, null);
  loadFriends();
};

window.removeFriend = async function(accountId) {
  await API.fetch(`/friends/api/v1/${config.accountId}/friends/${accountId}`, { method: "DELETE" });
  loadFriends();
};

// ===== SERVER STATUS PAGE =====
function renderServer() {
  content.innerHTML = `
    <div class="page-server">
      <h1 class="page-title">Server Status</h1>
      <p class="page-subtitle">Real-time backend health</p>
      <div class="server-info-grid" id="server-cards">
        <div class="server-info-card">
          <div class="info-value shimmer-text" id="srv-status">Checking...</div>
          <div class="info-label">Backend Status</div>
        </div>
        <div class="server-info-card">
          <div class="info-value" id="srv-ping">—</div>
          <div class="info-label">Backend Ping</div>
        </div>
        <div class="server-info-card">
          <div class="info-value shimmer-text" id="srv-website-status">Checking...</div>
          <div class="info-label">Website Status</div>
        </div>
        <div class="server-info-card">
          <div class="info-value" id="srv-website-ping">—</div>
          <div class="info-label">Website Ping</div>
        </div>
      </div>

      <div class="server-log" id="srv-details">
        <h3>Service Details</h3>
        <div id="srv-service-info">
          <div class="shimmer" style="height:100px;border-radius:8px"></div>
        </div>
      </div>
    </div>
  `;

  checkServerStatus();
}

async function checkServerStatus() {
  const statusEl = document.getElementById("srv-status");
  const pingEl = document.getElementById("srv-ping");
  const wsStatusEl = document.getElementById("srv-website-status");
  const wsPingEl = document.getElementById("srv-website-ping");
  const detailsEl = document.getElementById("srv-service-info");

  // Check backend (port 3551)
  try {
    const start = Date.now();
    const res = await fetch(API._b + "/lightswitch/api/service/Fortnite/status");
    const ms = Date.now() - start;

    if (statusEl) {
      statusEl.textContent = "Online";
      statusEl.style.color = "var(--green-online)";
      statusEl.closest(".server-info-card")?.classList.add("online");
    }
    if (pingEl) pingEl.textContent = `${ms}ms`;

    if (res.ok && detailsEl) {
      const data = await res.json();
      detailsEl.innerHTML = `
        <div class="log-entry"><div class="log-dot green"></div><span class="log-msg">Service: ${escapeHtml(data.serviceInstanceId || "fortnite")}</span></div>
        <div class="log-entry"><div class="log-dot green"></div><span class="log-msg">Status: ${escapeHtml(data.status || "UP")}</span></div>
        <div class="log-entry"><div class="log-dot green"></div><span class="log-msg">Message: ${escapeHtml(data.message || "Fortnite is online")}</span></div>
        <div class="log-entry"><div class="log-dot purple"></div><span class="log-msg">Backend response: ${ms}ms</span></div>
      `;
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = "Offline";
      statusEl.style.color = "var(--red-danger)";
    }
    if (pingEl) pingEl.textContent = "—";
    if (detailsEl) {
      detailsEl.innerHTML = `
        <div class="log-entry"><div class="log-dot red"></div><span class="log-msg">Could not connect to backend</span></div>
        <div class="log-entry"><div class="log-dot red"></div><span class="log-msg">Connection Error</span></div>
      `;
    }
  }

  // Check website (port 8080)
  try {
    const start = Date.now();
    const res = await fetch(API._w + "/");
    const ms = Date.now() - start;

    if (wsStatusEl) {
      wsStatusEl.textContent = "Online";
      wsStatusEl.style.color = "var(--green-online)";
      wsStatusEl.closest(".server-info-card")?.classList.add("online");
    }
    if (wsPingEl) wsPingEl.textContent = `${ms}ms`;
  } catch {
    if (wsStatusEl) {
      wsStatusEl.textContent = "Offline";
      wsStatusEl.style.color = "var(--red-danger)";
    }
    if (wsPingEl) wsPingEl.textContent = "—";
  }
}

// ===== SETTINGS PAGE =====
function renderSettings() {
  content.innerHTML = `
    <div class="page-settings">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your Star Glaze experience</p>

      <div class="settings-section">
        <h3>Backend</h3>
        <div class="setting-row">
          <span class="setting-label">Backend</span>
          <span class="setting-value" id="settings-backend-status">Checking...</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">Website</span>
          <span class="setting-value" id="settings-website-status">Checking...</span>
        </div>
      </div>

      <div class="settings-section">
        <h3>General</h3>
        <div class="setting-row">
          <span class="setting-label">Launch on Startup</span>
          <label class="mod-toggle"><input type="checkbox"><span class="slider"></span></label>
        </div>
        <div class="setting-row">
          <span class="setting-label">Minimize to Tray</span>
          <label class="mod-toggle"><input type="checkbox" checked><span class="slider"></span></label>
        </div>
      </div>

      <div class="settings-section">
        <h3>Account</h3>
        <div class="setting-row">
          <span class="setting-label">Display Name</span>
          <span class="setting-value">${escapeHtml(config.displayName || "Not logged in")}</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">Account ID</span>
          <span class="setting-value" style="font-family:monospace;font-size:11px">${escapeHtml(config.accountId || "—")}</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">Register on Website</span>
          <button class="btn-browse" id="btn-open-register">Open in Browser</button>
        </div>
        <div class="setting-row">
          <span class="setting-label">Sign Out</span>
          <button class="btn-browse btn-danger" id="btn-logout">Logout</button>
        </div>
      </div>

      <div class="settings-section">
        <h3>About</h3>
        <div class="setting-row">
          <span class="setting-label">Version</span>
          <span class="setting-value">Star Glaze v1.0.0</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">Backend</span>
          <span class="setting-value" id="settings-about-backend">Checking...</span>
        </div>
      </div>
    </div>
  `;

  // Check backend status
  (async () => {
    const statusEl = document.getElementById("settings-backend-status");
    const aboutEl = document.getElementById("settings-about-backend");
    try {
      const res = await fetch(API._b + "/lightswitch/api/service/Fortnite/status");
      if (res.ok) {
        if (statusEl) { statusEl.textContent = "Connected \u2713"; statusEl.style.color = "var(--green-online)"; }
        if (aboutEl) { aboutEl.textContent = "Connected \u2713"; aboutEl.style.color = "var(--green-online)"; }
      } else {
        if (statusEl) { statusEl.textContent = "Offline \u2717"; statusEl.style.color = "var(--red-danger)"; }
        if (aboutEl) { aboutEl.textContent = "Offline \u2717"; aboutEl.style.color = "var(--red-danger)"; }
      }
    } catch {
      if (statusEl) { statusEl.textContent = "Offline \u2717"; statusEl.style.color = "var(--red-danger)"; }
      if (aboutEl) { aboutEl.textContent = "Offline \u2717"; aboutEl.style.color = "var(--red-danger)"; }
    }
  })();

  // Check website status
  (async () => {
    const statusEl = document.getElementById("settings-website-status");
    try {
      const res = await fetch(API._w + "/");
      if (res.ok) {
        if (statusEl) { statusEl.textContent = "Connected \u2713"; statusEl.style.color = "var(--green-online)"; }
      } else {
        if (statusEl) { statusEl.textContent = "Offline \u2717"; statusEl.style.color = "var(--red-danger)"; }
      }
    } catch {
      if (statusEl) { statusEl.textContent = "Offline \u2717"; statusEl.style.color = "var(--red-danger)"; }
    }
  })();

  document.getElementById("btn-open-register")?.addEventListener("click", () => {
    openExternal(API.websiteUrl + "/login");
  });

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    handleLogout();
  });
}

// ===== Navigation helper =====
function navigateTo(page) {
  if (!isLoggedIn() && page !== "login") {
    page = "login";
  }
  currentPage = page;
  renderSidebar();
  renderPage(page);
}

// ===== Init =====
async function init() {
  if (window.starglaze) {
    config = { ...config, ...(await window.starglaze.getConfig()) };
  }

  window.starglaze?.onOAuthCallback?.(async ({ code, username }) => {
    const result = await loginWithExchangeCode(code);
    if (result.success) {
      currentPage = "home";
      renderSidebar();
      renderPage("home");
    }
  });

  if (isLoggedIn()) {
    // Verify token is still valid
    try {
      const verify = await fetch(API.baseUrl + "/account/api/oauth/verify", {
        headers: { "Authorization": `bearer eg1~${config.accessToken}` },
      });
      if (!verify.ok) {
        handleLogout();
        return;
      }
    } catch {
      // Can't reach server, keep logged in state but don't verify
    }
    currentPage = "home";
  } else {
    currentPage = "login";
  }

  renderSidebar();
  renderPage(currentPage);
  initParticles();
}

init();
