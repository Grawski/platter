// ===== CONFIG =====
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQTca2swSKK_jHvAzJxR8YyPIo_rLJBfKPEsxsje26LRxmyTIrFd-cnnPMU9gUXBF2lddbCsBp9U9Ze/pub?gid=0&single=true&output=csv";

// ===== STATE =====
let recipes = [];
let filteredRecipes = [];

// ===== DOM =====
const recipeList = document.getElementById("recipeList");
const tagFilter = document.getElementById("tagFilter");
const searchInput = document.getElementById("searchInput");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const empty = document.getElementById("empty");
const modal = document.getElementById("recipeModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");

// ===== LOAD RECIPES =====
async function loadRecipes() {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error("Network error");

    const csvText = await response.text();

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        recipes = results.data;
        filteredRecipes = recipes;
        loading.classList.add("hidden");
        renderTags();
        renderRecipes(filteredRecipes);
      },
      error: function () {
        showError();
      }
    });
  } catch (err) {
    showError();
  }
}

// ===== RENDER RECIPES =====
function renderRecipes(data) {
  recipeList.innerHTML = "";

  if (!data.length) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  data.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <img src="${recipe.Picture}" alt="${recipe.Food}" loading="lazy">
      <div class="recipe-content">
        <h3>${recipe.Food}</h3>
        <div class="tag">${recipe.Tag}</div>
      </div>
    `;
    card.addEventListener("click", () => showRecipeDetail(recipe));
    recipeList.appendChild(card);
  });
}

// ===== RENDER TAGS =====
function renderTags() {
  const tags = [...new Set(recipes.map(r => r.Tag).filter(Boolean))];

  tags.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });
}

// ===== SHOW DETAIL =====
function showRecipeDetail(recipe) {
  modalBody.innerHTML = `
    <h2>${recipe.Food}</h2>
    <img src="${recipe.Picture}" alt="${recipe.Food}" style="width:100%; border-radius:16px; margin:16px 0;">
    <h3>Hozzávalók</h3>
    <p>${recipe.Ingredients}</p>
    <h3>Elkészítés</h3>
    <p>${recipe.Preparation}</p>
  `;
  modal.classList.remove("hidden");
}

// ===== CLOSE DETAIL =====
function closeRecipeDetail() {
  modal.classList.add("hidden");
}

// ===== FILTERING =====
function applyFilters() {
  const selectedTag = tagFilter.value;
  const searchValue = searchInput.value.toLowerCase();

  filteredRecipes = recipes.filter(recipe => {
    const matchesTag = selectedTag === "all" || recipe.Tag === selectedTag;
    const matchesSearch = recipe.Food.toLowerCase().includes(searchValue);
    return matchesTag && matchesSearch;
  });

  renderRecipes(filteredRecipes);
}

// ===== ERROR =====
function showError() {
  loading.classList.add("hidden");
  error.classList.remove("hidden");
}

// ===== EVENTS =====
tagFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);
closeModalBtn.addEventListener("click", closeRecipeDetail);

// ===== INIT =====
document.addEventListener("DOMContentLoaded", loadRecipes);
