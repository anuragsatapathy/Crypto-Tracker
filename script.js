let currency = localStorage.getItem("currency") || "usd";
const currencySymbol = { usd: "$", inr: "₹" };

const coinsContainer = document.getElementById("coins");
const searchBox = document.getElementById("searchBox");
const watchlistContainer = document.getElementById("watchlist-items");
const currencySelect = document.getElementById("currencySelect");

let allCoins = [];
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

// Suggestions dropdown
const suggestionsContainer = document.createElement("ul");
suggestionsContainer.id = "suggestions";
searchBox.parentNode.style.position = "relative";
searchBox.parentNode.appendChild(suggestionsContainer);

// Fetch data from CoinGecko
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
  } catch {
    coinsContainer.innerHTML = "<p>Failed to load data.</p>";
  }
}

// Display all coins
function displayCoins(coins) {
  if (!Array.isArray(coins) || coins.length === 0) {
    coinsContainer.innerHTML = "<p>No coins found.</p>";
    return;
  }

  coinsContainer.innerHTML = "";
  coins.forEach(c => {
    const id = c?.id || "";
    const name = c?.name || "Unknown";
    const symbol = c?.symbol?.toUpperCase?.() || "N/A";
    const img = c?.image || "";
    const price = c?.current_price ? c.current_price.toLocaleString() : "0";
    const priceChange = c?.price_change_percentage_24h ?? 0;
    const priceClass = priceChange >= 0 ? "up" : "down";
    const isAdded = watchlist.some(w => w.id === id);

    const div = document.createElement("div");
    div.className = "crypto-item";
    div.innerHTML = `
      <div class="crypto-name">
        <img src="${img}" alt="${name}" loading="lazy">
        <span>${name} (${symbol})</span>
      </div>
      <div class="price ${priceClass}">
        ${currencySymbol[currency]}${price} (${priceChange.toFixed(2)}%)
      </div>
      <button class="${isAdded ? "remove-btn" : "add-btn"}" data-id="${id}">
        ${isAdded ? "Remove" : "Add"}
      </button>
    `;

    coinsContainer.appendChild(div);
  });
}

// Display watchlist coins
function displayWatchlist() {
  watchlistContainer.innerHTML = "";
  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = "<p>No coins added yet.</p>";
    return;
  }

  // Destructuring used here
  watchlist.forEach(c => {
    const {
      id = "",
      name = "Unknown",
      symbol = "N/A",
      image: img = "",
      current_price,
      price_change_percentage_24h = 0
    } = c;

    const price = current_price ? current_price.toLocaleString() : "0";
    const priceClass = price_change_percentage_24h >= 0 ? "up" : "down";

    const div = document.createElement("div");
    div.className = "crypto-item";
    div.innerHTML = `
      <div class="crypto-name">
        <img src="${img}" alt="${name}" loading="lazy">
        <span>${name} (${symbol.toUpperCase()})</span>
      </div>
      <div class="price ${priceClass}">
        ${currencySymbol[currency]}${price} (${price_change_percentage_24h.toFixed(2)}%)
      </div>
      <button class="remove-btn" data-id="${id}">Remove</button>
    `;
    watchlistContainer.appendChild(div);
  });
}

// Add coin to watchlist
function addToWatchlist(id) {
  const coin = allCoins.find(c => c.id === id);
  if (coin && !watchlist.some(w => w.id === coin.id)) {
    watchlist.push(coin);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    displayCoins(allCoins);
    displayWatchlist();
  }
}

// Remove coin from watchlist
function removeFromWatchlist(id) {
  watchlist = watchlist.filter(c => c.id !== id);
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
  displayCoins(allCoins);
  displayWatchlist();
}

// Event delegation for Add/Remove buttons
coinsContainer.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const id = e.target.dataset.id;
    if (e.target.classList.contains("add-btn")) {
      if (confirm("Are you sure you want to add this coin to your watchlist?")) {
        addToWatchlist(id);
      }
    } else if (e.target.classList.contains("remove-btn")) {
      if (confirm("Are you sure you want to remove this coin from your watchlist?")) {
        removeFromWatchlist(id);
      }
    }
  }
});

watchlistContainer.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON" && e.target.classList.contains("remove-btn")) {
    const id = e.target.dataset.id;
    if (confirm("Are you sure you want to remove this coin from your watchlist?")) {
      removeFromWatchlist(id);
    }
  }
});

// Debounced search with suggestions
let debounceTimer;
searchBox.addEventListener("input", () => {
  // If debounceTimer already exists, clear it, else do rest
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    const term = searchBox.value.toLowerCase();
    const filtered = allCoins.filter(
      c =>
        c.name?.toLowerCase?.().includes(term) ||
        c.symbol?.toLowerCase?.().includes(term)
    );
    displayCoins(filtered);

    // Display suggestions
    suggestionsContainer.innerHTML = "";
    if (term && filtered.length > 0) {
      filtered.slice(0, 5).forEach(c => {
        const li = document.createElement("li");
        li.textContent = c.name;
        li.addEventListener("click", () => {
          searchBox.value = c.name;
          suggestionsContainer.classList.remove("show");
          displayCoins([c]);
        });
        suggestionsContainer.appendChild(li);
      });
      suggestionsContainer.classList.add("show");
    } else {
      suggestionsContainer.classList.remove("show");
    }
  }, 300);
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
  fetchData();
});

// Initial load
fetchData();
displayWatchlist();
setInterval(fetchData, 60000);
