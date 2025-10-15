// Get saved currency or default to USD
let currency = localStorage.getItem("currency") || "usd";
const currencySymbol = { usd: "$", inr: "₹" };

// Select DOM elements
const coinsContainer = document.getElementById("coins");
const searchBox = document.getElementById("searchBox");
const watchlistContainer = document.getElementById("watchlist-items");
const currencySelect = document.getElementById("currencySelect");

// Store coin data and watchlist
let allCoins = [];
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

// Suggestions dropdown
const suggestionsContainer = document.createElement("ul");
suggestionsContainer.id = "suggestions";
searchBox.parentNode.style.position = "relative";
searchBox.parentNode.appendChild(suggestionsContainer);

// Interval variable
const autoUpdateInterval = 60000; // 60 seconds

// Custom modal setup
const modalOverlay = document.createElement("div");
modalOverlay.id = "modalOverlay";
modalOverlay.style.cssText = `
  position: fixed; top:0; left:0; width:100%; height:100%;
  background: rgba(0,0,0,0.5); display:none; justify-content:center; align-items:center;
  z-index: 9999;
`;
const modalBox = document.createElement("div");
modalBox.id = "modalBox";
modalBox.style.cssText = `
  background: #161b22; color: #e6edf3; padding:20px; border-radius:10px; width:300px; text-align:center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5); font-family: Poppins, sans-serif;
`;
const modalHeading = document.createElement("h3");
modalHeading.style.marginBottom = "15px";
const modalMessage = document.createElement("p");
modalMessage.style.marginBottom = "20px";
const modalButtons = document.createElement("div");
modalButtons.style.cssText = "display:flex; justify-content:space-around;";
const btnYes = document.createElement("button");
btnYes.textContent = "Yes";
btnYes.style.cssText = "padding:6px 15px; border:none; border-radius:6px; background:#2ecc71; color:#fff; cursor:pointer;";
const btnNo = document.createElement("button");
btnNo.textContent = "No";
btnNo.style.cssText = "padding:6px 15px; border:none; border-radius:6px; background:#e74c3c; color:#fff; cursor:pointer;";

modalButtons.appendChild(btnYes);
modalButtons.appendChild(btnNo);
modalBox.appendChild(modalHeading);
modalBox.appendChild(modalMessage);
modalBox.appendChild(modalButtons);
modalOverlay.appendChild(modalBox);
document.body.appendChild(modalOverlay);

// Show modal function returns promise
function showModal(title, message) {
  return new Promise((resolve) => {
    modalHeading.textContent = title;
    modalMessage.textContent = message;
    modalOverlay.style.display = "flex";

    btnYes.onclick = () => {
      modalOverlay.style.display = "none";
      resolve(true);
    };
    btnNo.onclick = () => {
      modalOverlay.style.display = "none";
      resolve(false);
    };
  });
}

// Fetch coin data from API 
async function fetchData() {
  coinsContainer.innerHTML = "Loading...";
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=50&page=1&sparkline=false`
    );
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid data");

    allCoins = data;
    displayCoins(allCoins);
    displayWatchlist();
  } catch (err) {
    console.error(err);
    coinsContainer.innerHTML = "<p>Failed to load data. Try refreshing the page.</p>";
  }
}

// Display all coins
function displayCoins(coins) {
  coinsContainer.innerHTML = "";
  if (!Array.isArray(coins) || coins.length === 0) {
    coinsContainer.innerHTML = "<p>No coins found.</p>";
    return;
  }

  coins.forEach(c => {
    // Destructuring with optional chaining
    const { id = "", name = "Unknown", symbol = "N/A", image: img = "", current_price, price_change_percentage_24h = 0 } = c || {};
    const price = current_price ? current_price.toLocaleString() : "0";
    const priceColor = price_change_percentage_24h >= 0 ? "#2ecc71" : "#e74c3c"; // green/red
    const isAdded = watchlist.some(w => w.id === id);

    // Create coin element
    const div = document.createElement("div");
    div.className = "crypto-item";
    div.innerHTML = `
      <div class="crypto-name">
        <img src="${img}" alt="${name}" loading="lazy">
        <span>${name} (${symbol?.toUpperCase?.()})</span>
      </div>
      <div class="price" style="text-align:right;">
        <span style="color:${priceColor}">
          ${currencySymbol[currency]}${price} (${price_change_percentage_24h?.toFixed?.(2)}%)
        </span>
      </div>
      <button type="button" class="${isAdded ? "remove-btn" : "add-btn"}" data-id="${id}">
        ${isAdded ? "Remove" : "Add"}
      </button>
    `;
    coinsContainer.appendChild(div);
  });
}

// Display watchlist
function displayWatchlist() {
  watchlistContainer.innerHTML = "";
  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = "<p>No coins added yet.</p>";
    return;
  }

  watchlist.forEach(c => {
    const { id = "", name = "Unknown", symbol = "N/A", image: img = "", current_price, price_change_percentage_24h = 0 } = c || {};
    const price = current_price ? current_price.toLocaleString() : "0";
    const priceColor = price_change_percentage_24h >= 0 ? "#2ecc71" : "#e74c3c";

    const div = document.createElement("div");
    div.className = "crypto-item";
    div.innerHTML = `
      <div class="crypto-name">
        <img src="${img}" alt="${name}" loading="lazy">
        <span>${name} (${symbol?.toUpperCase?.()})</span>
      </div>
      <div class="price" style="text-align:right;">
        <span style="color:${priceColor}">
          ${currencySymbol[currency]}${price} (${price_change_percentage_24h?.toFixed?.(2)}%)
        </span>
      </div>
      <button type="button" class="remove-btn" data-id="${id}">Remove</button>
    `;
    watchlistContainer.appendChild(div);
  });
}

// Add to watchlist
async function addToWatchlist(id) {
  const coin = allCoins.find(c => c.id === id);
  if (coin && !watchlist.some(w => w.id === coin.id)) {
    const confirmed = await showModal("Add Coin", "Are you sure you want to add this coin?");
    if (confirmed) {
      watchlist.push(coin);
      localStorage.setItem("watchlist", JSON.stringify(watchlist));
      displayCoins(allCoins);
      displayWatchlist();
    }
  }
}

// Remove from watchlist
async function removeFromWatchlist(id) {
  const coin = watchlist.find(c => c.id === id);
  if (coin) {
    const confirmed = await showModal("Remove Coin", "Are you sure you want to remove this coin?");
    if (confirmed) {
      watchlist = watchlist.filter(c => c.id !== id);
      localStorage.setItem("watchlist", JSON.stringify(watchlist));
      displayCoins(allCoins);
      displayWatchlist();
    }
  }
}

// Event delegation for buttons
coinsContainer.addEventListener("click", e => {
  if (e.target.tagName === "BUTTON") {
    const id = e.target.dataset.id;
    if (e.target.classList.contains("add-btn")) addToWatchlist(id);
    else if (e.target.classList.contains("remove-btn")) removeFromWatchlist(id);
  }
});

watchlistContainer.addEventListener("click", e => {
  if (e.target.tagName === "BUTTON" && e.target.classList.contains("remove-btn")) {
    const id = e.target.dataset.id;
    removeFromWatchlist(id);
  }
});

// Debounced search with suggestions
let debounceTimer;
searchBox.addEventListener("input", () => {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const term = searchBox.value.toLowerCase();
    const filtered = allCoins.filter(
      c => c?.name?.toLowerCase?.().includes(term) || c?.symbol?.toLowerCase?.().includes(term)
    );

    displayCoins(filtered);

    // Suggestions dropdown
    suggestionsContainer.innerHTML = "";
    if (term && filtered.length > 0) {
      filtered.slice(0,5).forEach(c => {
        const li = document.createElement("li");
        li.textContent = c?.name;
        li.addEventListener("click", () => {
          searchBox.value = c?.name;
          suggestionsContainer.classList.remove("show");
          displayCoins([c]);
        });
        suggestionsContainer.appendChild(li);
      });
      suggestionsContainer.classList.add("show");
    } else suggestionsContainer.classList.remove("show");
  }, 300); // debounce 300ms
});

// Hide suggestions if clicked outside
document.addEventListener("click", e => {
  if (!searchBox.contains(e.target) && !suggestionsContainer.contains(e.target)) {
    suggestionsContainer.classList.remove("show");
  }
});

// Currency change
currencySelect.addEventListener("change", e => {
  currency = e.target.value;
  localStorage.setItem("currency", currency);
  fetchData(); // fetch new data
});

// Auto refresh coins every autoUpdateInterval
const fetchInterval = setInterval(fetchData, autoUpdateInterval);

// Initial load
fetchData();
displayWatchlist();
