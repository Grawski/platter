const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQTca2swSKK_jHvAzJxR8YyPIo_rLJBfKPEsxsje26LRxmyTIrFd-cnnPMU9gUXBF2lddbCsBp9U9Ze/pub?gid=0&single=true&output=csv";

let recipes = [];
let filteredRecipes = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 24;

const recipeList = document.getElementById("recipeList");
const tagMenu = document.getElementById("tagMenu"); // tagFilter helyett
let currentTag = "all"; // Eltároljuk az aktuális kategóriát
const searchInput = document.getElementById("searchInput");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const empty = document.getElementById("empty");
const modal = document.getElementById("recipeModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const filterToggle = document.getElementById("filterToggle");

async function loadRecipes() {
  try {
    const response = await fetch(SHEET_URL);
    const csv = await response.text();

    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        recipes = results.data;
        filteredRecipes = recipes;
        loading.classList.add("hidden");
        renderTags();
        renderRecipes();
      }
    });
  } catch {
    loading.classList.add("hidden");
    error.classList.remove("hidden");
  }
}

function renderRecipes() {
  recipeList.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredRecipes.slice(start, start + ITEMS_PER_PAGE);

  if (!paginated.length) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  paginated.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <img src="${recipe.Picture}" />
      <div class="overlay">${recipe.Food}</div>
    `;
    card.onclick = () => showRecipeDetail(recipe);
    recipeList.appendChild(card);
  });

  pageInfo.textContent = `${currentPage} / ${Math.ceil(filteredRecipes.length / ITEMS_PER_PAGE)}`;
}

function renderTags() {
  const tags = [...new Set(recipes.map(r => r.Tag).filter(Boolean))];
  
  // Megtartjuk az "Összes kategória" gombot, és hozzáadjuk a többit
  tagMenu.innerHTML = '<button class="tag-option" onclick="selectTag(\'all\')">Összes kategória</button>';

  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "tag-option";
    btn.textContent = tag;
    btn.onclick = () => selectTag(tag);
    tagMenu.appendChild(btn);
  });
}

function selectTag(tag) {
  currentTag = tag;
  tagMenu.classList.add("hidden"); // Menü bezárása
  
  // Gomb kinézetének frissítése
  if (tag === "all") {
    filterToggle.classList.remove("active");
    filterToggle.textContent = "☰"; // Visszaállítjuk az eredeti ikonra
  } else {
    filterToggle.classList.add("active");
    filterToggle.textContent = "✓"; // Pipát teszünk bele, ha van aktív szűrő
  }

  applyFilters();
}

function showRecipeDetail(recipe) {
  // 1. Hozzávalók feldolgozása: pöttyök nélkül, szekciófejlécek felismerése
  const ingredientsList = recipe.Ingredients
    ? recipe.Ingredients.split("\n").map(i => {
        const trimmed = i.trim();
        if (!trimmed) return "";
        
        // CSAK akkor fejléc, ha csupa nagybetűvel van írva és nem csak egy szám
        const isHeader = trimmed === trimmed.toUpperCase() && isNaN(trimmed);
        
        return `<li class="${isHeader ? 'ingredient-header' : ''}">${trimmed}</li>`;
      }).join("")
    : "";

  // 2. A teljes tartalom összeállítása
  modalBody.innerHTML = `
    <h2>${recipe.Food}</h2>
    <img src="${recipe.Picture}" alt="${recipe.Food}" />

    <div class="section-title">Hozzávalók</div>
    <ul class="ingredients-list">${ingredientsList}</ul>

    <hr class="section-divider">

    <div class="section-title">Elkészítés</div>
    <div class="preparation-text">${recipe.Preparation || ""}</div>

    <div class="bottom-actions">
      <button class="copy-button" onclick="copyRecipe()">Másolás</button>
      <button class="back-button" onclick="closeRecipeDetail()">Vissza</button>
    </div>
  `;

  // 3. Megjelenítés és görgetés az elejére
  modal.classList.remove("hidden");
  modal.scrollTop = 0; // Biztosítjuk, hogy az ablak tetején induljon a nézet
  document.body.style.overflow = "hidden"; // Letiltjuk a háttér görgetését, amíg a modal nyitva van
}

// A bezárás függvényt is frissítsd, hogy a háttér újra görgethető legyen:
function closeRecipeDetail() {
  modal.classList.add("hidden");
  document.body.style.overflow = "auto"; 
}

function copyRecipe() {
  const text = modalBody.innerText;
  navigator.clipboard.writeText(text);
  alert("Recept kimásolva!");
}

function closeRecipeDetail() {
  modal.classList.add("hidden");
}

function applyFilters() {
  const search = searchInput.value.toLowerCase();

  filteredRecipes = recipes.filter(r =>
    (currentTag === "all" || r.Tag === currentTag) &&
    r.Food.toLowerCase().includes(search)
  );

  currentPage = 1;
  renderRecipes();
}

prevPage.onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    renderRecipes();
  }
};

nextPage.onclick = () => {
  if (currentPage < Math.ceil(filteredRecipes.length / ITEMS_PER_PAGE)) {
    currentPage++;
    renderRecipes();
  }
};

searchInput.addEventListener("input", applyFilters);
closeModalBtn.addEventListener("click", closeRecipeDetail);
filterToggle.addEventListener("click", (e) => {
  e.stopPropagation(); // Megakadályozza, hogy a kattintás továbbmenjen
  tagMenu.classList.toggle("hidden");
});

// Extra: Ha bárhova máshova kattintunk az oldalon, záródjon be a menü
document.addEventListener("click", () => {
  tagMenu.classList.add("hidden");
});

document.addEventListener("DOMContentLoaded", loadRecipes);
