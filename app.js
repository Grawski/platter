const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQTca2swSKK_jHvAzJxR8YyPIo_rLJBfKPEsxsje26LRxmyTIrFd-cnnPMU9gUXBF2lddbCsBp9U9Ze/pub?gid=0&single=true&output=csv";

let recipes = [];
let filteredRecipes = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 24;

const recipeList = document.getElementById("recipeList");
const tagFilter = document.getElementById("tagFilter");
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
  tags.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });
}

function showRecipeDetail(recipe) {
  const ingredientsList = recipe.Ingredients
    ? recipe.Ingredients.split("\n").map(i => `<li>${i}</li>`).join("")
    : "";

  const preparationList = recipe.Preparation
    ? recipe.Preparation.split("\n").map(i => `<li>${i}</li>`).join("")
    : "";

  modalBody.innerHTML = `
    <h2>${recipe.Food}</h2>
    <img src="${recipe.Picture}" />

    <div class="section-title">Hozzávalók</div>
    <ul>${ingredientsList}</ul>

    <div class="section-title">Elkészítés</div>
    <ol>${preparationList}</ol>

    <div class="bottom-actions">
      <button class="copy-button" onclick="copyRecipe()">Másolás</button>
      <button class="back-button" onclick="closeRecipeDetail()">Vissza</button>
    </div>
  `;

  modal.classList.remove("hidden");
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
  const tag = tagFilter.value;
  const search = searchInput.value.toLowerCase();

  filteredRecipes = recipes.filter(r =>
    (tag === "all" || r.Tag === tag) &&
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
tagFilter.addEventListener("change", applyFilters);
closeModalBtn.addEventListener("click", closeRecipeDetail);
filterToggle.addEventListener("click", () => {
  tagFilter.classList.toggle("hidden");
});

document.addEventListener("DOMContentLoaded", loadRecipes);
