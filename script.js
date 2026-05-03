/* ============================================================
   Marketplace Script (FULL)
   Works with your clean HTML file.
   Features:
   - Stars background
   - Category filter
   - Search filter
   - Sort dropdown + sorting
   - Themes panel + saving
   - Info panel + statistics
   - Request send button
   - Item rendering system (add items in ITEMS array)
   ============================================================ */

"use strict";

/* ============================================================
   ITEMS DATABASE (ADD YOUR ITEMS HERE)
   ============================================================ */
const ITEMS = [
  // Example item:
  /*
  {
    uuid: "123",
    title: "Example Pack",
    category: "addons", // worlds/addons/mashups/textures/skins
    subtitle: "By Vultir",
    description: "Example description text",
    downloads: 200,
    image: "https://via.placeholder.com/600x340",
    dateAdded: "2026-01-01", // YYYY-MM-DD
    links: [
      { name: "Download", url: "https://example.com/file.mcpack", size: "10MB" }
    ]
  }
  */
];

/* ============================================================
   GLOBAL STATE
   ============================================================ */
let currentFilter = "all";
let currentSort = "default";
let nameSortAsc = true;

let favourites = JSON.parse(localStorage.getItem("favourites") || "[]");
let currentTheme = JSON.parse(localStorage.getItem("themeSettings") || "null");

/* ============================================================
   DOM ELEMENTS
   ============================================================ */
const starsContainer = document.getElementById("stars");

const searchInput = document.getElementById("searchInput");
const itemContainer = document.getElementById("itemContainer");

const filterButtons = document.querySelectorAll(".category-buttons button");

const settingsBtn = document.getElementById("settingsBtn");
const sortDropdown = document.getElementById("sortDropdown");
const sortOptions = document.querySelectorAll(".sort-option");

const themesPanel = document.getElementById("themesPanel");
const themesOverlay = document.getElementById("themesOverlay");
const closeThemesBtn = document.getElementById("closeThemesBtn");

const informationSection = document.getElementById("informationSection");
const closeInfoBtn = document.getElementById("closeInfoBtn");

const sendButton = document.getElementById("sendButton");
const linkInput = document.getElementById("linkInput");

const statisticsArea = document.getElementById("statisticsArea");

/* Theme Inputs */
const themeBgColor = document.getElementById("themeBgColor");
const themeTitleColor = document.getElementById("themeTitleColor");
const themeTypeColor = document.getElementById("themeTypeColor");
const themeDescColor = document.getElementById("themeDescColor");
const themeIconsColor = document.getElementById("themeIconsColor");
const applyThemeBtn = document.getElementById("applyThemeBtn");
const resetThemeBtn = document.getElementById("resetThemeBtn");

const fontStyleButtons = document.querySelectorAll(".font-style-btn");

/* Stats IDs */
const statAll = document.getElementById("statAll");
const statWorlds = document.getElementById("statWorlds");
const statAddons = document.getElementById("statAddons");
const statMashups = document.getElementById("statMashups");
const statTextures = document.getElementById("statTextures");
const statSkins = document.getElementById("statSkins");
const statFavourites = document.getElementById("statFavourites");

/* ============================================================
   CREATE STARS BACKGROUND
   ============================================================ */
function createStars(count = 90) {
  if (!starsContainer) return;
  starsContainer.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const star = document.createElement("div");
    star.className = "star";

    const size = Math.random() * 2.5 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const dur = Math.random() * 3 + 2;

    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.setProperty("--anim-dur", `${dur}s`);

    starsContainer.appendChild(star);
  }
}

/* ============================================================
   RENDER ITEMS INTO GRID
   ============================================================ */
function renderItems() {
  itemContainer.innerHTML = "";

  let filteredItems = [...ITEMS];

  /* Filter by category */
  if (currentFilter !== "all") {
    filteredItems = filteredItems.filter(i => i.category === currentFilter);
  }

  /* Filter by search */
  const query = searchInput.value.trim().toLowerCase();
  if (query.length > 0) {
    filteredItems = filteredItems.filter(i =>
      i.title.toLowerCase().includes(query) ||
      (i.subtitle && i.subtitle.toLowerCase().includes(query)) ||
      (i.description && i.description.toLowerCase().includes(query))
    );
  }

  /* Sorting */
  if (currentSort === "newest") {
    filteredItems.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  }

  if (currentSort === "oldest") {
    filteredItems.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
  }

  if (currentSort === "name") {
    filteredItems.sort((a, b) => {
      if (nameSortAsc) return a.title.localeCompare(b.title);
      return b.title.localeCompare(a.title);
    });
  }

  if (currentSort === "favourites") {
    filteredItems = filteredItems.filter(i => favourites.includes(i.uuid));
  }

  /* Empty message */
  if (filteredItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "no-items";
    empty.innerHTML = `<i class="fas fa-box-open"></i><br><br>No items found.`;
    itemContainer.appendChild(empty);
    updateStats();
    return;
  }

  /* Create cards */
  filteredItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "item";
    card.setAttribute("data-category", item.category);
    card.setAttribute("data-uuid", item.uuid);

    const subtitle = item.subtitle ? `<div class="subtitle">${item.subtitle}</div>` : "";

    const downloadCount =
      item.downloads !== undefined
        ? `<span class="download-count show"><i class="fas fa-download"></i> ${item.downloads}</span>`
        : "";

    card.innerHTML = `
      <div class="item-content">
        <h2>${item.title}</h2>

        <div class="title-row">
          ${subtitle}
          ${downloadCount}
        </div>

        <div class="img-wrapper">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
        </div>
      </div>
    `;

    card.addEventListener("click", () => openItemModal(item.uuid));

    itemContainer.appendChild(card);
  });

  updateStats();
}

/* ============================================================
   MODAL SYSTEM (DOWNLOAD MODAL)
   ============================================================ */
let modalOverlay = null;

function closeModal() {
  if (modalOverlay) {
    modalOverlay.classList.remove("active");
    setTimeout(() => {
      modalOverlay.remove();
      modalOverlay = null;
    }, 200);
  }
}

function openItemModal(uuid) {
  const item = ITEMS.find(i => i.uuid === uuid);
  if (!item) return;

  if (modalOverlay) closeModal();

  modalOverlay = document.createElement("div");
  modalOverlay.className = "overlay active";

  const isFav = favourites.includes(item.uuid);

  modalOverlay.innerHTML = `
    <div class="download-modal">
      <div class="modal-header">
        <div class="modal-title">${item.title}</div>
        <button class="close-btn" id="closeModalBtn"><i class="fas fa-times"></i></button>
      </div>

      <div class="modal-meta-row">
        <p class="modal-type">
          <span class="clickable-meta">${item.category}</span>
        </p>

        <button class="favourite-btn ${isFav ? "favourited" : ""}" id="favouriteBtn">
          <i class="fas fa-heart"></i>
        </button>
      </div>

      <div class="modal-description">
        ${item.description || "No description provided."}
      </div>

      <div class="download-links">
        ${
          (item.links || [])
            .map(link => {
              return `
                <a class="download-link" href="${link.url}" target="_blank">
                  <div class="link-text">
                    <i class="fas fa-download link-icon"></i>
                    <span>${link.name}</span>
                  </div>
                  <div class="right-group">
                    <span class="file-size">${link.size || ""}</span>
                    <i class="fas fa-arrow-right link-arrow"></i>
                  </div>
                </a>
              `;
            })
            .join("")
        }
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  modalOverlay.addEventListener("click", e => {
    if (e.target === modalOverlay) closeModal();
  });

  document.getElementById("closeModalBtn").addEventListener("click", closeModal);

  document.getElementById("favouriteBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavourite(item.uuid);
    openItemModal(item.uuid); // refresh modal
  });
}

/* ============================================================
   FAVOURITES
   ============================================================ */
function toggleFavourite(uuid) {
  if (favourites.includes(uuid)) {
    favourites = favourites.filter(id => id !== uuid);
  } else {
    favourites.push(uuid);
  }
  localStorage.setItem("favourites", JSON.stringify(favourites));
  updateStats();
}

/* ============================================================
   FILTER BUTTONS
   ============================================================ */
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentFilter = btn.getAttribute("data-filter");
    renderItems();
  });
});

/* ============================================================
   SEARCH
   ============================================================ */
searchInput.addEventListener("input", () => {
  renderItems();
});

/* ============================================================
   SORT DROPDOWN
   ============================================================ */
settingsBtn.addEventListener("click", () => {
  settingsBtn.classList.toggle("active");
  sortDropdown.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!settingsBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
    settingsBtn.classList.remove("active");
    sortDropdown.classList.remove("active");
  }
});

sortOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    sortOptions.forEach(o => o.classList.remove("active"));
    opt.classList.add("active");

    const sortType = opt.getAttribute("data-sort");

    if (sortType === "name") {
      currentSort = "name";
      nameSortAsc = !nameSortAsc;

      const label = document.getElementById("nameSortLabel");
      label.textContent = nameSortAsc ? "Name (A-Z)" : "Name (Z-A)";
    }
    else if (sortType === "themes") {
      openThemesPanel();
      return;
    }
    else if (sortType === "information") {
      openInfoPanel();
      return;
    }
    else {
      currentSort = sortType;
    }

    renderItems();
  });
});

/* ============================================================
   THEMES PANEL
   ============================================================ */
function openThemesPanel() {
  themesPanel.classList.add("active");
  themesOverlay.classList.add("active");
}

function closeThemesPanel() {
  themesPanel.classList.remove("active");
  themesOverlay.classList.remove("active");
}

themesOverlay.addEventListener("click", () => {
  closeThemesPanel();
  closeInfoPanel();
});

closeThemesBtn.addEventListener("click", closeThemesPanel);

function applyTheme(settings) {
  document.documentElement.style.setProperty("--gradient-colors", settings.gradient);
  document.documentElement.style.setProperty("--text-color", settings.titleColor);

  document.body.style.fontFamily = settings.fontFamily;

  localStorage.setItem("themeSettings", JSON.stringify(settings));
}

applyThemeBtn.addEventListener("click", () => {
  const chosenFontBtn = document.querySelector(".font-style-btn.active");
  const fontStyle = chosenFontBtn.getAttribute("data-font-style");

  let fontFamily = "'Rubik', sans-serif";
  if (fontStyle === "pixel") fontFamily = "'Press Start 2P', cursive";
  if (fontStyle === "poppins") fontFamily = "'Poppins', sans-serif";
  if (fontStyle === "montserrat") fontFamily = "'Montserrat', sans-serif";
  if (fontStyle === "oswald") fontFamily = "'Oswald', sans-serif";
  if (fontStyle === "mcpefont") fontFamily = "'Rubik', sans-serif";

  const themeSettings = {
    gradient: `linear-gradient(270deg, ${themeBgColor.value}, #302b63, #24243e)`,
    titleColor: themeTitleColor.value,
    typeColor: themeTypeColor.value,
    descColor: themeDescColor.value,
    iconsColor: themeIconsColor.value,
    fontFamily
  };

  applyTheme(themeSettings);
  closeThemesPanel();
});

resetThemeBtn.addEventListener("click", () => {
  localStorage.removeItem("themeSettings");
  location.reload();
});

fontStyleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    fontStyleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

/* ============================================================
   INFO PANEL
   ============================================================ */
function openInfoPanel() {
  informationSection.classList.add("show");
  themesOverlay.classList.add("active");
  statisticsArea.classList.add("show");
  updateStats();
}

function closeInfoPanel() {
  informationSection.classList.remove("show");
  statisticsArea.classList.remove("show");
  themesOverlay.classList.remove("active");
}

closeInfoBtn.addEventListener("click", closeInfoPanel);

/* ============================================================
   REQUEST BUTTON
   ============================================================ */
sendButton.addEventListener("click", () => {
  const requestText = linkInput.value.trim();
  if (!requestText) {
    alert("Type a request first.");
    return;
  }

  // You can change this to Discord webhook later.
  alert("Request sent: " + requestText);

  linkInput.value = "";
});

/* ============================================================
   STATISTICS
   ============================================================ */
function updateStats() {
  if (!statAll) return;

  statAll.textContent = ITEMS.length;

  statWorlds.textContent = ITEMS.filter(i => i.category === "worlds").length;
  statAddons.textContent = ITEMS.filter(i => i.category === "addons").length;
  statMashups.textContent = ITEMS.filter(i => i.category === "mashups").length;
  statTextures.textContent = ITEMS.filter(i => i.category === "textures").length;
  statSkins.textContent = ITEMS.filter(i => i.category === "skins").length;

  statFavourites.textContent = favourites.length;
}

/* ============================================================
   LOAD SAVED THEME
   ============================================================ */
if (currentTheme) {
  applyTheme(currentTheme);
}

/* ============================================================
   INIT
   ============================================================ */
createStars(100);
renderItems();
updateStats();