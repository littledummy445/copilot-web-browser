const DEFAULT_HOME = "https://example.com";

const state = {
  tabs: [{ id: crypto.randomUUID(), title: "Home", url: DEFAULT_HOME, history: [DEFAULT_HOME], idx: 0 }],
  activeTabId: null,
  bookmarks: JSON.parse(localStorage.getItem("bookmarks") || "[]"),
  profiles: JSON.parse(localStorage.getItem("profiles") || '["Default"]'),
  activeProfile: localStorage.getItem("activeProfile") || "Default",
  extensions: JSON.parse(localStorage.getItem("extensions") || '{"reader":true,"adblock":false,"notes":false}')
};

const tabsEl = document.getElementById("tabs");
const viewEl = document.getElementById("view");
const addressInput = document.getElementById("addressInput");
const bookmarksEl = document.getElementById("bookmarks");
const profileSelect = document.getElementById("profileSelect");
const profileNameInput = document.getElementById("profileNameInput");

state.activeTabId = state.tabs[0].id;

function normalizeUrl(input) {
  if (!input) return DEFAULT_HOME;
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}

function activeTab() {
  return state.tabs.find((tab) => tab.id === state.activeTabId);
}

function saveState() {
  localStorage.setItem("bookmarks", JSON.stringify(state.bookmarks));
  localStorage.setItem("profiles", JSON.stringify(state.profiles));
  localStorage.setItem("activeProfile", state.activeProfile);
  localStorage.setItem("extensions", JSON.stringify(state.extensions));
}

function renderTabs() {
  tabsEl.innerHTML = "";
  state.tabs.forEach((tab) => {
    const btn = document.createElement("button");
    btn.className = `tab ${tab.id === state.activeTabId ? "active" : ""}`;
    btn.textContent = tab.title;
    btn.onclick = () => {
      state.activeTabId = tab.id;
      loadActiveTab();
    };
    tabsEl.appendChild(btn);
  });
}

function renderBookmarks() {
  bookmarksEl.innerHTML = "";
  state.bookmarks.forEach((bookmark, index) => {
    const li = document.createElement("li");
    li.textContent = bookmark;
    li.onclick = () => navigate(bookmark);
    li.oncontextmenu = (event) => {
      event.preventDefault();
      state.bookmarks.splice(index, 1);
      saveState();
      renderBookmarks();
    };
    bookmarksEl.appendChild(li);
  });
}

function renderProfiles() {
  profileSelect.innerHTML = "";
  state.profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile;
    option.textContent = profile;
    if (profile === state.activeProfile) option.selected = true;
    profileSelect.appendChild(option);
  });
}

function updateExtensionUi() {
  document.querySelectorAll(".extension-toggle").forEach((el) => {
    el.checked = !!state.extensions[el.dataset.ext];
  });
}

function setTabTitle(tab, url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    tab.title = host || "Tab";
  } catch {
    tab.title = "Tab";
  }
}

function loadActiveTab() {
  const tab = activeTab();
  if (!tab) return;
  viewEl.src = tab.url;
  addressInput.value = tab.url;
  renderTabs();
}

function navigate(rawUrl) {
  const tab = activeTab();
  if (!tab) return;
  const url = normalizeUrl(rawUrl);
  tab.url = url;
  tab.history = tab.history.slice(0, tab.idx + 1).concat(url);
  tab.idx = tab.history.length - 1;
  setTabTitle(tab, url);
  loadActiveTab();
}

document.getElementById("newTabBtn").onclick = () => {
  const tab = { id: crypto.randomUUID(), title: "New Tab", url: DEFAULT_HOME, history: [DEFAULT_HOME], idx: 0 };
  state.tabs.push(tab);
  state.activeTabId = tab.id;
  loadActiveTab();
};

document.getElementById("goBtn").onclick = () => navigate(addressInput.value.trim());
addressInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") navigate(addressInput.value.trim());
});

document.getElementById("refreshBtn").onclick = () => {
  const tab = activeTab();
  if (!tab) return;
  viewEl.src = tab.url;
};

document.getElementById("backBtn").onclick = () => {
  const tab = activeTab();
  if (!tab || tab.idx === 0) return;
  tab.idx -= 1;
  tab.url = tab.history[tab.idx];
  loadActiveTab();
};

document.getElementById("forwardBtn").onclick = () => {
  const tab = activeTab();
  if (!tab || tab.idx === tab.history.length - 1) return;
  tab.idx += 1;
  tab.url = tab.history[tab.idx];
  loadActiveTab();
};

document.getElementById("bookmarkBtn").onclick = () => {
  const tab = activeTab();
  if (!tab || state.bookmarks.includes(tab.url)) return;
  state.bookmarks.push(tab.url);
  saveState();
  renderBookmarks();
};

document.getElementById("addProfileBtn").onclick = () => {
  const name = profileNameInput.value.trim();
  if (!name || state.profiles.includes(name)) return;
  state.profiles.push(name);
  state.activeProfile = name;
  profileNameInput.value = "";
  saveState();
  renderProfiles();
};

profileSelect.onchange = () => {
  state.activeProfile = profileSelect.value;
  saveState();
};

document.getElementById("darkThemeToggle").onchange = (event) => {
  document.body.classList.toggle("light", !event.target.checked);
};

document.getElementById("animationsToggle").onchange = (event) => {
  document.body.classList.toggle("no-animations", !event.target.checked);
};

document.getElementById("glassToggle").onchange = (event) => {
  document.body.classList.toggle("no-glass", !event.target.checked);
};

document.querySelectorAll(".extension-toggle").forEach((input) => {
  input.onchange = () => {
    state.extensions[input.dataset.ext] = input.checked;
    saveState();
  };
});

renderProfiles();
renderBookmarks();
updateExtensionUi();
loadActiveTab();
