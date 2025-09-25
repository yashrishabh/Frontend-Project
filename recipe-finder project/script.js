/* script.js
   Interactivity for Recipe Finder:
   - Search by ingredients (Spoonacular API if key supplied)
   - Demo fallback data if no API key (so presentation works offline)
   - Filters: vegetarian, vegan, cuisine
   - Favorites saved in localStorage
   - Modal with recipe details
   - Nice UX touches: loader, counts, demo toggle, dark mode toggle
*/

/* ===================== CONFIG ===================== */
// Put your Spoonacular API key here to enable live data.
// If left as "DEMO" or empty, the app uses built-in demo data.
const SPOONACULAR_KEY = "https://api.spoonacular.com/recipes/findByIngredients?ingredients=tomato,cheese&number=2&apiKey=KEY"
// "; // e.g. "123456abcdef"

// Maximum recipes to fetch per search (use moderate number for demo)
const MAX_RESULTS = 12;

/* ===================== DEMO DATA (fallback) ===================== */
const DEMO_RECIPES = [
  {
    id: 1001,
    title: "Tomato Basil Pasta",
    image: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
    readyInMinutes: 20,
    servings: 2,
    vegetarian: true,
    vegan: false,
    cuisine: "italian",
    ingredients: ["200g pasta", "2 tomatoes", "basil", "olive oil", "salt", "pepper"],
    instructions: "Boil pasta. Sauté tomatoes with olive oil. Toss with pasta and fresh basil. Season and serve."
  },
  {
    id: 1002,
    title: "Garlic Lemon Chicken",
    image: "https://images.unsplash.com/photo-1604908177522-5d6d1c0f2f7b?q=80&w=1200&auto=format&fit=crop",
    readyInMinutes: 30,
    servings: 3,
    vegetarian: false,
    vegan: false,
    cuisine: "american",
    ingredients: ["chicken breasts", "garlic", "lemon", "olive oil", "salt", "pepper"],
    instructions: "Marinate chicken. Pan sear with garlic and lemon. Cook until done. Rest and serve."
  },
  {
    id: 1003,
    title: "Chickpea Salad",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200&auto=format&fit=crop",
    readyInMinutes: 10,
    servings: 2,
    vegetarian: true,
    vegan: true,
    cuisine: "mediterranean",
    ingredients: ["chickpeas", "cucumber", "tomato", "olive oil", "lemon", "parsley"],
    instructions: "Mix all ingredients in a bowl. Dress with lemon and olive oil. Serve chilled."
  }
];

/* ===================== STATE ===================== */
let favorites = JSON.parse(localStorage.getItem('rf_favorites') || '[]');
let lastResults = [];     // last search results shown
let demoMode = true;      // starts in demo mode for presentation (set to false to use live API if key provided)

/* ===================== DOM REFS ===================== */
const ingredientInput = document.getElementById('ingredientInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const loader = document.getElementById('loader');
const resultsRow = document.getElementById('resultsRow');
const noResults = document.getElementById('noResults');
const resultCount = document.getElementById('resultCount');
const favoritesRow = document.getElementById('favoritesRow');
const noFav = document.getElementById('noFav');
const demoToggle = document.getElementById('demoToggle');
const filterVeg = document.getElementById('filterVeg');
const filterVegan = document.getElementById('filterVegan');
const cuisineSelect = document.getElementById('cuisineSelect');
const modalEl = new bootstrap.Modal(document.getElementById('recipeModal'));
const modalTitle = document.getElementById('modalTitle');
const modalImg = document.getElementById('modalImg');
const modalIngredients = document.getElementById('modalIngredients');
const modalInstructions = document.getElementById('modalInstructions');
const modalFavBtn = document.getElementById('modalFavBtn');
const darkToggle = document.getElementById('darkToggle');

/* ===================== UTILS ===================== */
function showLoader(show = true) { loader.classList.toggle('d-none', !show); }
function setResultCount(n) { resultCount.innerText = `${n} result${n !== 1 ? 's' : ''}`; }
function saveFavs() { localStorage.setItem('rf_favorites', JSON.stringify(favorites)); }

/* ===================== RENDER HELPERS ===================== */

function renderCard(recipe) {
  // Each recipe card HTML — sanitized simple approach
  const col = document.createElement('div');
  col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
  col.innerHTML = `
    <div class="card card-recipe h-100" data-aos="fade-up">
      <img src="${recipe.image}" class="recipe-img" alt="${recipe.title}">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title mb-1">${recipe.title}</h5>
        <p class="meta mb-2">Ready in ${recipe.readyInMinutes || 20} mins • ${recipe.servings ? recipe.servings + ' servings' : ''}</p>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <div>
            <button class="btn btn-sm btn-outline-primary me-2" data-id="${recipe.id}" onclick="openDetails(${recipe.id})">View</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="addToShopping(${recipe.id})"><i class="fa fa-cart-plus"></i></button>
          </div>
          <div>
            <button class="btn btn-sm favorite-btn ${isFavorite(recipe.id) ? 'active' : ''}" onclick="toggleFavorite(${recipe.id}, event)">
              <i class="fa-heart ${isFavorite(recipe.id) ? 'fa-solid' : 'fa-regular'}"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  return col;
}

function renderResults(list) {
  resultsRow.innerHTML = '';
  if (!list || list.length === 0) {
    noResults.classList.remove('d-none');
    setResultCount(0);
    return;
  }
  noResults.classList.add('d-none');
  list.forEach(r => resultsRow.appendChild(renderCard(r)));
  setResultCount(list.length);
  // store last results (for toggles or re-render)
  lastResults = list;
  AOS.refresh();
}

function renderFavorites() {
  favoritesRow.innerHTML = '';
  if (!favorites || favorites.length === 0) {
    noFav.classList.remove('d-none');
    return;
  }
  noFav.classList.add('d-none');
  favorites.forEach(f => {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4';
    col.innerHTML = `
      <div class="card card-recipe h-100 d-flex">
        <img src="${f.image}" class="recipe-img" alt="${f.title}">
        <div class="card-body d-flex align-items-center justify-content-between">
          <h6 class="mb-0">${f.title}</h6>
          <div>
            <button class="btn btn-sm btn-outline-primary me-2" onclick="openDetails(${f.id})">View</button>
            <button class="btn btn-sm btn-outline-danger" onclick="removeFavorite(${f.id})">Remove</button>
          </div>
        </div>
      </div>
    `;
    favoritesRow.appendChild(col);
  });
}

/* ===================== FAVORITES ===================== */
function isFavorite(id) { return favorites.some(f => f.id === id); }

function toggleFavorite(id, evt) {
  if (evt && evt.stopPropagation) evt.stopPropagation();
  const existing = favorites.find(f => f.id === id);
  if (existing) {
    favorites = favorites.filter(f => f.id !== id);
  } else {
    // find in lastResults for metadata, else fallback demo
    const found = lastResults.find(r => r.id === id) || DEMO_RECIPES.find(r => r.id === id);
    if (found) favorites.push({ id: found.id, title: found.title, image: found.image });
  }
  saveFavs();
  renderFavorites();
  // update visible buttons (simple approach: re-render results)
  renderResults(lastResults);
}

/* ===================== DETAILS (modal) ===================== */
async function getRecipeDetails(id) {
  // Demo fallback
  if (demoMode || !SPOONACULAR_KEY) {
    const r = DEMO_RECIPES.find(d => d.id === id);
    if (r) return r;
    // If id looks like spoonacular but we are in demo, return first
    return DEMO_RECIPES[0];
  }

  // Live API call - use recipe information endpoint
  try {
    const res = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${SPOONACULAR_KEY}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return {
      id: data.id,
      title: data.title,
      image: data.image,
      readyInMinutes: data.readyInMinutes,
      servings: data.servings,
      vegetarian: data.vegetarian,
      vegan: data.vegan,
      cuisine: (data.cuisines && data.cuisines[0]) || '',
      ingredients: (data.extendedIngredients || []).map(i => i.original),
      instructions: data.instructions || data.summary || 'No instructions provided.'
    };
  } catch (err) {
    console.warn('Details fetch failed:', err);
    return null;
  }
}

async function openDetails(id) {
  showLoader(true);
  const r = await getRecipeDetails(id);
  showLoader(false);
  if (!r) return alert('Recipe details not available.');
  // populate modal
  modalTitle.innerText = r.title;
  modalImg.src = r.image || '';
  modalIngredients.innerHTML = '';
  (r.ingredients || []).forEach(i => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = i;
    modalIngredients.appendChild(li);
  });
  modalInstructions.innerText = r.instructions || 'No instructions available.';
  modalFavBtn.onclick = () => { toggleFavorite(r.id); };
  modalEl.show();
}

/* ===================== SEARCH ===================== */
async function searchRecipes() {
  const q = ingredientInput.value.trim();
  if (!q) { alert('Please enter at least one ingredient.'); return; }

  // UI
  resultsRow.innerHTML = '';
  noResults.classList.add('d-none');
  showLoader(true);

  // Build filter params
  const veg = filterVeg.checked;
  const vegan = filterVegan.checked;
  const cuisine = cuisineSelect.value;

  // DEMO MODE: simple fuzzy match on DEMO_RECIPES
  if (demoMode || !SPOONACULAR_KEY) {
    await new Promise(r => setTimeout(r, 500)); // small delay for UX
    const terms = q.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    let filtered = DEMO_RECIPES.filter(r =>
      terms.some(t => r.title.toLowerCase().includes(t) || (r.ingredients||[]).join(' ').toLowerCase().includes(t))
    );
    if (veg) filtered = filtered.filter(r => r.vegetarian);
    if (vegan) filtered = filtered.filter(r => r.vegan);
    if (cuisine) filtered = filtered.filter(r => (r.cuisine || '').toLowerCase() === cuisine.toLowerCase());
    showLoader(false);
    renderResults(filtered.slice(0, MAX_RESULTS));
    return;
  }

  // LIVE API MODE: findByIngredients endpoint
  try {
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(q)}&number=${MAX_RESULTS}&ranking=1&apiKey=${SPOONACULAR_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    // Map to our normalized format
    const mapped = data.map(it => ({
      id: it.id,
      title: it.title,
      image: it.image,
      readyInMinutes: it.readyInMinutes || 20,
      servings: it.servings || '',
      vegetarian: it.vegetarian || false,
      vegan: it.vegan || false,
      cuisine: (it.cuisines && it.cuisines[0]) || ''
    }));

    // apply front-end filters if any
    let results = mapped;
    if (veg) results = results.filter(r => r.vegetarian);
    if (vegan) results = results.filter(r => r.vegan);
    if (cuisine) results = results.filter(r => (r.cuisine || '').toLowerCase() === cuisine.toLowerCase());

    showLoader(false);
    renderResults(results);
  } catch (err) {
    console.error('Search error:', err);
    showLoader(false);
    alert('Error fetching recipes. (Check API key or network.)');
  }
}

/* ===================== SMALL EXTRA FEATURES ===================== */
function addToShopping(id) {
  // Placeholder: show micro interaction
  const found = lastResults.find(r => r.id === id) || DEMO_RECIPES.find(r => r.id === id);
  if (found) {
    const title = found.title || 'Item';
    // Use Toast? For simplicity use alert here
    alert(`${title} added to shopping list (demo).`);
  }
}

function removeFavorite(id) {
  favorites = favorites.filter(f => f.id !== id);
  saveFavs();
  renderFavorites();
  renderResults(lastResults);
}

/* Dark mode quick toggle (class switch on body) */
darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('bg-dark');
  document.body.classList.toggle('text-white');
  darkToggle.querySelector('i').classList.toggle('fa-moon');
  darkToggle.querySelector('i').classList.toggle('fa-sun');
});

/* Demo mode toggle (presentation friendly) */
demoToggle.addEventListener('click', () => {
  demoMode = !demoMode;
  demoToggle.classList.toggle('btn-primary', demoMode);
  demoToggle.classList.toggle('btn-outline-primary', !demoMode);
  demoToggle.innerText = demoMode ? 'Demo Mode: ON' : 'Demo Mode: OFF';
  if (demoMode) alert('Demo mode enabled — no API key needed.');
  else alert('Demo mode disabled — set SPOONACULAR_KEY to use live API.');
});

/* ENTER key triggers search */
ingredientInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); searchRecipes(); }
});

/* button listeners */
searchBtn.addEventListener('click', searchRecipes);
clearBtn.addEventListener('click', () => {
  ingredientInput.value = '';
  resultsRow.innerHTML = '';
  noResults.classList.add('d-none');
  setResultCount(0);
});

/* expose functions for inline handlers (modal open etc.) */
window.openDetails = openDetails;
window.toggleFavorite = toggleFavorite;
window.addToShopping = addToShopping;
window.removeFavorite = removeFavorite;

/* init UI on load */
document.addEventListener('DOMContentLoaded', () => {
  // If API key present, default demoMode to false
  if (SPOONACULAR_KEY && SPOONACULAR_KEY.trim().length > 0) demoMode = false;
  // render favorites from localStorage
  renderFavorites();
  setResultCount(0);
});
