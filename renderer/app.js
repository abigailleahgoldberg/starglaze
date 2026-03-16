/* ===== Star Glaze Launcher — App Logic ===== */

const content = document.getElementById("content");
let currentPage = "home";
let config = { gamePath: "", lastPlayed: null };

// ===== Title Bar Controls =====
document.getElementById("btn-minimize")?.addEventListener("click", () => window.starglaze?.minimize());
document.getElementById("btn-maximize")?.addEventListener("click", () => window.starglaze?.maximize());
document.getElementById("btn-close")?.addEventListener("click", () => window.starglaze?.close());

// ===== Navigation =====
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentPage = btn.dataset.page;
    renderPage(currentPage);
  });
});

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

// ===== Page Renderers =====
function renderPage(page) {
  const renderers = { home: renderHome, play: renderPlay, news: renderNews, mods: renderMods, cosmetics: renderCosmetics, server: renderServer, settings: renderSettings };
  const fn = renderers[page];
  if (fn) fn();
}

function renderHome() {
  content.innerHTML = `
    <div class="page-home">
      <div class="hero-banner">
        <img src="./banner.png" alt="Star Glaze">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title"><span class="star">Star </span><span class="glaze">Glaze</span></h1>
          <p class="hero-subtitle">The ultimate OG Fortnite launcher — play, mod, and customize.</p>
          <div class="hero-actions">
            <button class="btn-primary" onclick="navigateTo('play')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              Launch Game
            </button>
            <button class="btn-secondary" onclick="navigateTo('news')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
              View News
            </button>
          </div>
        </div>
      </div>

      <div class="home-sections">
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">24</div>
            <div class="stat-label">Online Players</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">12</div>
            <div class="stat-label">Active Mods</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">3.2K</div>
            <div class="stat-label">Cosmetics</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">99%</div>
            <div class="stat-label">Uptime</div>
          </div>
        </div>

        <div class="section-header">
          <h2 class="section-title">Features</h2>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            </div>
            <h3>One-Click Launch</h3>
            <p>Select your build folder and launch directly into OG Fortnite with a single click.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <h3>Mod Manager</h3>
            <p>Toggle mods on and off without touching files. Clean, safe, reversible.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
            </div>
            <h3>Cosmetics Browser</h3>
            <p>Browse and preview thousands of skins, pickaxes, gliders, and more from every season.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3>Auto Updates</h3>
            <p>Star Glaze keeps itself and your mods up to date automatically in the background.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/></svg>
            </div>
            <h3>Server Status</h3>
            <p>Real-time server health, player count, and uptime — all in one place.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <h3>Full Customization</h3>
            <p>Configure every aspect of your gameplay experience through the settings panel.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPlay() {
  const pathText = config.gamePath || "No folder selected";
  const pathClass = config.gamePath ? "play-path-text set" : "play-path-text";
  const canLaunch = !!config.gamePath;

  content.innerHTML = `
    <div class="page-play">
      <img src="./logo.png" class="play-logo" alt="Star Glaze">
      <h1 class="play-title"><span class="star">Star </span><span class="glaze">Glaze</span></h1>
      <p class="play-subtitle">Select your Fortnite build folder and launch</p>

      <div class="play-path">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E5E70" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>
        <span class="${pathClass}" id="path-display">${pathText}</span>
        <button class="btn-browse" id="btn-browse">Browse</button>
      </div>

      <button class="launch-btn" id="btn-launch" ${canLaunch ? "" : "disabled"}>LAUNCH</button>

      ${config.lastPlayed ? `<p style="margin-top:16px;font-size:11px;color:var(--text-muted)">Last played: ${new Date(config.lastPlayed).toLocaleDateString()}</p>` : ""}
    </div>
  `;

  document.getElementById("btn-browse")?.addEventListener("click", async () => {
    if (window.starglaze) {
      const path = await window.starglaze.selectGamePath();
      if (path) {
        config.gamePath = path;
        document.getElementById("path-display").textContent = path;
        document.getElementById("path-display").className = "play-path-text set";
        document.getElementById("btn-launch").disabled = false;
      }
    } else {
      // Browser preview mode
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
    if (window.starglaze) {
      const result = await window.starglaze.launchGame();
      if (!result.success) {
        btn.textContent = result.error.toUpperCase();
        setTimeout(() => { btn.textContent = "LAUNCH"; btn.disabled = false; }, 2000);
      }
    } else {
      setTimeout(() => { btn.textContent = "LAUNCH"; btn.disabled = false; }, 2000);
    }
  });
}

function renderNews() {
  const newsItems = [
    { tag: "UPDATE", title: "Star Glaze v1.0 Released", desc: "The first official release of Star Glaze is here. One-click launching, mod management, and a full cosmetics browser.", date: "March 16, 2026", img: "./banner.png" },
    { tag: "ANNOUNCEMENT", title: "Server Infrastructure Upgrade", desc: "We've upgraded our backend servers for better performance and lower latency across all regions.", date: "March 15, 2026", img: "./banner.png" },
    { tag: "FEATURE", title: "Cosmetics Browser Now Live", desc: "Browse over 3,000 cosmetics from every Fortnite season. Preview skins, pickaxes, gliders, and more.", date: "March 14, 2026", img: "./banner.png" },
    { tag: "COMMUNITY", title: "Discord Server Open", desc: "Join our Discord to connect with other OG Fortnite players, share mods, and get support.", date: "March 13, 2026", img: "./banner.png" },
  ];

  content.innerHTML = `
    <div class="page-news">
      <h1 class="page-title">News & Updates</h1>
      <p class="page-subtitle">Stay up to date with Star Glaze development</p>
      <div class="news-grid">
        ${newsItems.map((n) => `
          <div class="news-card">
            <img class="news-card-img" src="${n.img}" alt="${n.title}">
            <div class="news-card-body">
              <span class="news-tag">${n.tag}</span>
              <h3>${n.title}</h3>
              <p>${n.desc}</p>
              <div class="news-date">${n.date}</div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderMods() {
  const mods = [
    { name: "OG Lobby Music", desc: "Classic Season 1-3 lobby music replacement", enabled: true, icon: "music" },
    { name: "Classic HUD", desc: "Restores the original Fortnite HUD layout", enabled: true, icon: "layout" },
    { name: "Storm Circle Fix", desc: "Improved storm circle rendering and timing", enabled: false, icon: "cloud" },
    { name: "Building Pro+", desc: "Enhanced building mechanics and turbo build", enabled: true, icon: "building" },
    { name: "OG Weapons Pack", desc: "Classic weapon stats and models from Chapter 1", enabled: false, icon: "weapon" },
    { name: "Custom Crosshair", desc: "Customizable crosshair with color and size options", enabled: true, icon: "target" },
    { name: "Performance Mode", desc: "Optimized rendering for lower-end hardware", enabled: false, icon: "cpu" },
    { name: "Replay System", desc: "Record and replay your matches", enabled: false, icon: "video" },
  ];

  const iconSvgs = {
    music: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    layout: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
    cloud: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
    building: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    weapon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>',
    target: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    cpu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>',
    video: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>',
  };

  content.innerHTML = `
    <div class="page-mods">
      <h1 class="page-title">Mod Manager</h1>
      <p class="page-subtitle">Enable or disable mods for your build</p>
      <div class="mods-header">
        <input class="search-input" placeholder="Search mods..." id="mod-search">
      </div>
      <div class="mods-list" id="mods-list">
        ${mods.map((m, i) => `
          <div class="mod-card">
            <div class="mod-icon">${iconSvgs[m.icon] || ""}</div>
            <div class="mod-info">
              <h4>${m.name}</h4>
              <p>${m.desc}</p>
            </div>
            <label class="mod-toggle">
              <input type="checkbox" ${m.enabled ? "checked" : ""} data-mod="${i}">
              <span class="slider"></span>
            </label>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.getElementById("mod-search")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".mod-card").forEach((card) => {
      const name = card.querySelector("h4").textContent.toLowerCase();
      card.style.display = name.includes(q) ? "flex" : "none";
    });
  });
}

function renderCosmetics() {
  content.innerHTML = `
    <div class="page-cosmetics">
      <h1 class="page-title">Cosmetics Browser</h1>
      <p class="page-subtitle">Browse Fortnite cosmetics from every season</p>
      <div class="cat-tabs">
        <button class="cat-tab active" data-type="outfit">Outfits</button>
        <button class="cat-tab" data-type="backpack">Back Blings</button>
        <button class="cat-tab" data-type="pickaxe">Pickaxes</button>
        <button class="cat-tab" data-type="glider">Gliders</button>
        <button class="cat-tab" data-type="emote">Emotes</button>
        <button class="cat-tab" data-type="wrap">Wraps</button>
      </div>
      <input class="search-input" placeholder="Search cosmetics..." id="cosm-search" style="margin-bottom:16px;max-width:400px">
      <div class="cosmetics-grid" id="cosm-grid">
        <div class="shimmer" style="height:140px;border-radius:10px"></div>
        <div class="shimmer" style="height:140px;border-radius:10px"></div>
        <div class="shimmer" style="height:140px;border-radius:10px"></div>
        <div class="shimmer" style="height:140px;border-radius:10px"></div>
        <div class="shimmer" style="height:140px;border-radius:10px"></div>
        <div class="shimmer" style="height:140px;border-radius:10px"></div>
      </div>
    </div>
  `;

  let allItems = [];
  let activeType = "outfit";

  async function loadCosmetics(type) {
    const grid = document.getElementById("cosm-grid");
    grid.innerHTML = Array(12).fill('<div class="shimmer" style="height:140px;border-radius:10px"></div>').join("");
    try {
      const res = await fetch(`https://fortnite-api.com/v2/cosmetics/br/search/all?type=${type}&language=en`);
      const data = await res.json();
      allItems = (data.data || []).slice(0, 120);
      renderItems(allItems);
    } catch {
      grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Failed to load cosmetics</p>';
    }
  }

  function renderItems(items) {
    const grid = document.getElementById("cosm-grid");
    grid.innerHTML = items.map((item) => `
      <div class="cosmetic-card">
        <img src="${item.images?.smallIcon || item.images?.icon || ""}" alt="${item.name}" loading="lazy">
        <span>${item.name}</span>
      </div>
    `).join("");
  }

  document.querySelectorAll(".cat-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeType = tab.dataset.type;
      loadCosmetics(activeType);
    });
  });

  document.getElementById("cosm-search")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allItems.filter((i) => i.name.toLowerCase().includes(q));
    renderItems(filtered);
  });

  loadCosmetics("outfit");
}

function renderServer() {
  content.innerHTML = `
    <div class="page-server">
      <h1 class="page-title">Server Status</h1>
      <p class="page-subtitle">Real-time server health and activity</p>
      <div class="server-info-grid">
        <div class="server-info-card online">
          <div class="info-value">Online</div>
          <div class="info-label">Status</div>
        </div>
        <div class="server-info-card">
          <div class="info-value">24</div>
          <div class="info-label">Players Online</div>
        </div>
        <div class="server-info-card">
          <div class="info-value">32ms</div>
          <div class="info-label">Avg Ping</div>
        </div>
      </div>

      <div class="server-log">
        <h3>Activity Log</h3>
        <div class="log-entry"><div class="log-dot green"></div><span class="log-time">16:24</span><span class="log-msg">Player "SweatyBoi99" joined the server</span></div>
        <div class="log-entry"><div class="log-dot purple"></div><span class="log-time">16:22</span><span class="log-msg">Match #847 started — Solo mode</span></div>
        <div class="log-entry"><div class="log-dot green"></div><span class="log-time">16:20</span><span class="log-msg">Player "OGDefault" joined the server</span></div>
        <div class="log-entry"><div class="log-dot yellow"></div><span class="log-time">16:18</span><span class="log-msg">Server restart scheduled in 2 hours</span></div>
        <div class="log-entry"><div class="log-dot purple"></div><span class="log-time">16:15</span><span class="log-msg">Match #846 ended — Winner: CrankyTTV</span></div>
        <div class="log-entry"><div class="log-dot green"></div><span class="log-time">16:12</span><span class="log-msg">Player "TiltedTowers" joined the server</span></div>
        <div class="log-entry"><div class="log-dot red"></div><span class="log-time">16:10</span><span class="log-msg">Player "XxNoobxX" disconnected (timeout)</span></div>
        <div class="log-entry"><div class="log-dot purple"></div><span class="log-time">16:08</span><span class="log-msg">Mod update deployed: OG Weapons Pack v2.1</span></div>
      </div>
    </div>
  `;
}

function renderSettings() {
  content.innerHTML = `
    <div class="page-settings">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your Star Glaze experience</p>

      <div class="settings-section">
        <h3>General</h3>
        <div class="setting-row">
          <span class="setting-label">Game Path</span>
          <span class="setting-value">${config.gamePath || "Not set"}</span>
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
        <h3>Updates</h3>
        <div class="setting-row">
          <span class="setting-label">Auto-Update Launcher</span>
          <label class="mod-toggle"><input type="checkbox" checked><span class="slider"></span></label>
        </div>
        <div class="setting-row">
          <span class="setting-label">Auto-Update Mods</span>
          <label class="mod-toggle"><input type="checkbox" checked><span class="slider"></span></label>
        </div>
        <div class="setting-row">
          <span class="setting-label">Update Channel</span>
          <span class="setting-value">Stable</span>
        </div>
      </div>

      <div class="settings-section">
        <h3>Discord</h3>
        <div class="setting-row">
          <span class="setting-label">Rich Presence</span>
          <label class="mod-toggle"><input type="checkbox" checked><span class="slider"></span></label>
        </div>
        <div class="setting-row">
          <span class="setting-label">Show Game Activity</span>
          <label class="mod-toggle"><input type="checkbox" checked><span class="slider"></span></label>
        </div>
      </div>

      <div class="settings-section">
        <h3>About</h3>
        <div class="setting-row">
          <span class="setting-label">Version</span>
          <span class="setting-value">Star Glaze v1.0.0</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">Electron</span>
          <span class="setting-value">v34.x</span>
        </div>
      </div>
    </div>
  `;
}

// ===== Navigation helper =====
function navigateTo(page) {
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.page === page);
  });
  currentPage = page;
  renderPage(page);
}

// ===== Init =====
async function init() {
  if (window.starglaze) {
    config = await window.starglaze.getConfig();
  }
  renderPage("home");
  initParticles();
}

init();
