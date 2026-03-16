/* ===== Star Glaze Launcher — App Logic ===== */

const content = document.getElementById("content");
let currentPage = "login";
let config = {
  gamePath: "",
  lastPlayed: null,
  backendUrl: "http://26.252.123.243:3551",
  accessToken: null,
  refreshToken: null,
  accountId: null,
  displayName: null,
  settings: {},
};

const CLIENT_CREDENTIALS = "ec684b8c687f479fadea3cb2ad83f5c6:e1f31c211f28413186262d37a13fc84d";
const CLIENT_CREDENTIALS_B64 = btoa(CLIENT_CREDENTIALS);

// ===== API Helper =====
const API = {
  get baseUrl() { return config.backendUrl || "http://26.252.123.243:3551"; },
  get token() { return config.accessToken; },
  get accountId() { return config.accountId; },

  async fetch(path, opts = {}) {
    const headers = { ...opts.headers };
    if (this.token) headers["Authorization"] = `bearer eg1~${this.token}`;
    try {
      const res = await fetch(this.baseUrl + path, { ...opts, headers });
      if (!res.ok && res.status === 401) {
        handleLogout();
        return null;
      }
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) return res.json();
      return res.text();
    } catch (err) {
      console.error("API error:", path, err);
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

// ===== Auth =====
async function doLogin(email, password) {
  const body = `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  try {
    const res = await fetch(API.baseUrl + "/account/api/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `basic ${CLIENT_CREDENTIALS_B64}`,
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
    return { success: false, error: err.message || "Could not connect to server" };
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
      </div>
      <div class="nav-section">
        <span class="nav-label">INVENTORY</span>
        <button class="nav-item${currentPage === "locker" ? " active" : ""}" data-page="locker">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
          <span>Locker</span>
        </button>
        <button class="nav-item${currentPage === "shop" ? " active" : ""}" data-page="shop">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>
          <span>Item Shop</span>
        </button>
      </div>
      <div class="nav-section">
        <span class="nav-label">SOCIAL</span>
        <button class="nav-item${currentPage === "leaderboard" ? " active" : ""}" data-page="leaderboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4v8a5 5 0 0 1-10 0V4"/><path d="M5 8h14"/></svg>
          <span>Leaderboard</span>
        </button>
        <button class="nav-item${currentPage === "friends" ? " active" : ""}" data-page="friends">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Friends</span>
        </button>
      </div>
      <div class="nav-section">
        <span class="nav-label">SYSTEM</span>
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

function openExternal(url) {
  if (window.starglaze?.openExternal) {
    window.starglaze.openExternal(url);
  } else {
    window.open(url, "_blank");
  }
}

// ===== Page Renderers =====
function renderPage(page) {
  const renderers = {
    login: renderLogin,
    home: renderHome,
    play: renderPlay,
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
      <p class="login-subtitle">Sign in to your account</p>

      <form class="login-form" id="login-form">
        <div class="login-field">
          <label>Email</label>
          <input type="email" id="login-email" placeholder="your@email.com" required autocomplete="email">
        </div>
        <div class="login-field">
          <label>Password</label>
          <input type="password" id="login-password" placeholder="Password" required autocomplete="current-password">
        </div>
        <div class="login-error" id="login-error"></div>
        <button type="submit" class="login-btn" id="login-btn">LOGIN</button>
      </form>

      <div class="login-divider"><span>or</span></div>

      <button class="login-register-btn" id="btn-register">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
        Register on Website
      </button>

      <p class="login-hint">Register via Discord on the website, then login here with your email and password.</p>
    </div>
  `;

  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn = document.getElementById("login-btn");
    const errorEl = document.getElementById("login-error");
    errorEl.textContent = "";
    btn.textContent = "LOGGING IN...";
    btn.disabled = true;

    const result = await doLogin(email, password);
    if (result.success) {
      currentPage = "home";
      renderSidebar();
      renderPage("home");
    } else {
      errorEl.textContent = result.error;
      btn.textContent = "LOGIN";
      btn.disabled = false;
    }
  });

  document.getElementById("btn-register")?.addEventListener("click", () => {
    openExternal(API.baseUrl + "/register");
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
    const ms = Date.now() - start;
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

  const entries = [];
  for (const sf of catalog.storefronts) {
    if (sf.catalogEntries) {
      for (const entry of sf.catalogEntries) {
        entries.push(entry);
      }
    }
  }

  const first4 = entries.slice(0, 4);
  grid.innerHTML = first4.map((entry) => renderShopCard(entry)).join("");
}

// ===== PLAY PAGE =====
function renderPlay() {
  const pathText = config.gamePath || "No folder selected";
  const pathClass = config.gamePath ? "play-path-text set" : "play-path-text";
  const canLaunch = !!config.gamePath;

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
          <span class="play-info-value">${escapeHtml(API.baseUrl)}</span>
        </div>
      </div>

      <div class="play-path">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E5E70" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>
        <span class="${pathClass}" id="path-display">${escapeHtml(pathText)}</span>
        <button class="btn-browse" id="btn-browse">Browse</button>
      </div>

      <button class="launch-btn" id="btn-launch" ${canLaunch ? "" : "disabled"}>LAUNCH</button>

      <div class="launch-args-display" id="launch-args" style="display:none">
        <h4>Launch Arguments</h4>
        <code id="launch-args-text"></code>
      </div>

      ${config.lastPlayed ? `<p style="margin-top:16px;font-size:11px;color:var(--text-muted)">Last played: ${new Date(config.lastPlayed).toLocaleDateString()}</p>` : ""}
    </div>
  `;

  document.getElementById("btn-browse")?.addEventListener("click", async () => {
    if (window.starglaze) {
      const path = await window.starglaze.selectGamePath();
      if (path) {
        config.gamePath = path;
        await persistConfig();
        document.getElementById("path-display").textContent = path;
        document.getElementById("path-display").className = "play-path-text set";
        document.getElementById("btn-launch").disabled = false;
      }
    } else {
      config.gamePath = "C:\\Fortnite\\FortniteGame";
      document.getElementById("path-display").textContent = config.gamePath;
      document.getElementById("path-display").className = "play-path-text set";
      document.getElementById("btn-launch").disabled = false;
    }
  });

  document.getElementById("btn-launch")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-launch");
    btn.textContent = "LAUNCHING...";
    btn.disabled = true;

    const launchArgs = [
      `-AUTH_LOGIN=unused`,
      `-AUTH_PASSWORD=${config.accessToken}`,
      `-AUTH_TYPE=epic`,
      `-epicapp=Fortnite`,
      `-epicenv=Prod`,
      `-epiclocale=en-us`,
      `-epicportal`,
      `-skippatchcheck`,
      `-nobe`,
      `-fromfl=eac`,
      `-fltoken=none`,
      `-caldera=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9`,
    ];

    // Show launch args
    const argsDisplay = document.getElementById("launch-args");
    const argsText = document.getElementById("launch-args-text");
    if (argsDisplay && argsText) {
      argsDisplay.style.display = "block";
      argsText.textContent = launchArgs.join(" ");
    }

    if (window.starglaze) {
      const result = await window.starglaze.launchGame(launchArgs);
      if (!result.success) {
        btn.textContent = result.error.toUpperCase();
        setTimeout(() => { btn.textContent = "LAUNCH"; btn.disabled = false; }, 3000);
        return;
      }
      btn.textContent = "RUNNING";
    } else {
      setTimeout(() => { btn.textContent = "LAUNCH"; btn.disabled = false; }, 2000);
    }
  });
}

// ===== LOCKER PAGE =====
function renderLocker() {
  content.innerHTML = `
    <div class="page-locker">
      <h1 class="page-title">Locker</h1>
      <p class="page-subtitle">Your cosmetics collection</p>
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
    allItems = {};
    for (const [itemId, item] of Object.entries(profile.items)) {
      const tid = item.templateId || "";
      const colonIdx = tid.indexOf(":");
      if (colonIdx === -1) continue;
      const type = tid.substring(0, colonIdx);
      const cosmId = tid.substring(colonIdx + 1);
      if (!allItems[type]) allItems[type] = [];
      allItems[type].push({ itemId, templateId: tid, type, cosmeticId: cosmId, attributes: item.attributes });
    }

    // Update counts
    const types = ["AthenaCharacter", "AthenaBackpack", "AthenaPickaxe", "AthenaGlider", "AthenaDance", "AthenaItemWrap"];
    for (const t of types) {
      const el = document.getElementById(`count-${t}`);
      if (el) el.textContent = `(${(allItems[t] || []).length})`;
    }

    renderLockerItems(activeType);
  }

  async function getIcon(cosmeticId) {
    if (iconCache[cosmeticId]) return iconCache[cosmeticId];
    try {
      const res = await fetch(`https://fortnite-api.com/v2/cosmetics/br/${cosmeticId}`);
      const data = await res.json();
      const url = data?.data?.images?.smallIcon || data?.data?.images?.icon || "";
      iconCache[cosmeticId] = url;
      return url;
    } catch {
      return "";
    }
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
      const url = await getIcon(item.cosmeticId);
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
function renderShop() {
  content.innerHTML = `
    <div class="page-shop">
      <h1 class="page-title">Item Shop</h1>
      <p class="page-subtitle">Today's featured items</p>
      <div class="shop-grid" id="shop-grid">
        ${Array(8).fill('<div class="shimmer" style="height:240px;border-radius:10px"></div>').join("")}
      </div>
    </div>
  `;

  loadShop();
}

async function loadShop() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;

  const catalog = await API.fetch("/fortnite/api/storefront/v2/catalog");
  if (!catalog || !catalog.storefronts) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Could not load item shop</p>';
    return;
  }

  const entries = [];
  for (const sf of catalog.storefronts) {
    if (sf.catalogEntries) {
      for (const entry of sf.catalogEntries) {
        entries.push(entry);
      }
    }
  }

  if (entries.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Shop is empty</p>';
    return;
  }

  grid.innerHTML = entries.map((entry) => renderShopCard(entry)).join("");
}

function renderShopCard(entry) {
  const title = entry.title || entry.devName || "Unknown Item";
  const desc = entry.shortDescription || entry.description || "";
  const prices = entry.prices || [];
  const price = prices[0]?.finalPrice ?? entry.finalPrice ?? "?";
  const grants = entry.itemGrants || [];
  const firstGrant = grants[0]?.templateId || "";
  const cosmeticId = firstGrant.includes(":") ? firstGrant.split(":")[1] : "";

  const rarityColors = {
    "EFortRarity::Legendary": "#c97c1b",
    "EFortRarity::Epic": "#8138C2",
    "EFortRarity::Rare": "#2f7be3",
    "EFortRarity::Uncommon": "#60aa3a",
    "EFortRarity::Common": "#8c8c8c",
  };
  const rarity = entry.rarity || "";
  const borderColor = rarityColors[rarity] || "var(--border-card)";

  return `
    <div class="shop-card" style="border-color:${borderColor}">
      <div class="shop-card-img" data-cosm-id="${escapeHtml(cosmeticId)}">
        <div class="shimmer" style="width:100%;height:100%"></div>
      </div>
      <div class="shop-card-body">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(desc)}</p>
        <div class="shop-price">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          ${typeof price === "number" ? price.toLocaleString() : price} V-Bucks
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

  let activePlaylist = "solo";

  async function loadLeaderboard(playlist) {
    const wrap = document.getElementById("lb-content");
    if (!wrap) return;
    wrap.innerHTML = '<div class="shimmer" style="height:400px;border-radius:10px"></div>';

    const lbName = `br_placetop1_keyboardmouse_m0_playlist_default${playlist}`;
    const data = await API.fetch(`/fortnite/api/statsv2/leaderboards/${lbName}?maxSize=50`);

    if (!data || !data.entries || data.entries.length === 0) {
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
          ${data.entries.map((entry, i) => {
            const isMe = entry.account === config.accountId;
            return `
              <tr class="${isMe ? "lb-highlight" : ""}">
                <td class="lb-rank">${i + 1}</td>
                <td class="lb-name">${escapeHtml(entry.displayName || entry.account)}</td>
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

    // Look up account by display name
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
    // Lookup display names
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
          <div class="info-label">Status</div>
        </div>
        <div class="server-info-card">
          <div class="info-value" id="srv-ping">—</div>
          <div class="info-label">Response Time</div>
        </div>
        <div class="server-info-card">
          <div class="info-value" id="srv-url" style="font-size:14px;word-break:break-all">${escapeHtml(API.baseUrl)}</div>
          <div class="info-label">Backend URL</div>
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
  const detailsEl = document.getElementById("srv-service-info");

  try {
    const start = Date.now();
    const res = await fetch(API.baseUrl + "/lightswitch/api/service/Fortnite/status");
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
        <div class="log-entry"><div class="log-dot purple"></div><span class="log-msg">Response time: ${ms}ms</span></div>
        <div class="log-entry"><div class="log-dot purple"></div><span class="log-msg">Backend: ${escapeHtml(API.baseUrl)}</span></div>
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
        <div class="log-entry"><div class="log-dot red"></div><span class="log-msg">${escapeHtml(err.message)}</span></div>
        <div class="log-entry"><div class="log-dot yellow"></div><span class="log-msg">URL: ${escapeHtml(API.baseUrl)}</span></div>
      `;
    }
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
          <span class="setting-label">Backend URL</span>
          <div class="setting-input-group">
            <input class="search-input" id="settings-backend-url" value="${escapeHtml(config.backendUrl || "http://26.252.123.243:3551")}" style="width:300px">
            <button class="btn-browse" id="btn-save-backend">Save</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>General</h3>
        <div class="setting-row">
          <span class="setting-label">Game Path</span>
          <div class="setting-input-group">
            <span class="setting-value">${escapeHtml(config.gamePath || "Not set")}</span>
            <button class="btn-browse" id="btn-settings-browse">Browse</button>
          </div>
        </div>
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
          <span class="setting-value">${escapeHtml(API.baseUrl)}</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-save-backend")?.addEventListener("click", async () => {
    const urlInput = document.getElementById("settings-backend-url");
    let url = urlInput.value.trim();
    if (url.endsWith("/")) url = url.slice(0, -1);
    config.backendUrl = url;
    await persistConfig();
    urlInput.style.borderColor = "var(--green-online)";
    setTimeout(() => { urlInput.style.borderColor = ""; }, 1500);
  });

  document.getElementById("btn-settings-browse")?.addEventListener("click", async () => {
    if (window.starglaze) {
      const path = await window.starglaze.selectGamePath();
      if (path) {
        config.gamePath = path;
        await persistConfig();
        renderSettings();
      }
    }
  });

  document.getElementById("btn-open-register")?.addEventListener("click", () => {
    openExternal(API.baseUrl + "/register");
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
