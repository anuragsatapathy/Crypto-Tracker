let currency = localStorage.getItem("currency") || "usd";
const currencySymbol = { usd: "$", inr: "₹" };
const coinsContainer = document.getElementById("coins");
const searchBox = document.getElementById("searchBox");
const watchlistContainer = document.getElementById("watchlist-items");
const currencySelect = document.getElementById("currencySelect");
let allCoins = [];
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
currencySelect.value = currency;

async function fetchData() {
  coinsContainer.innerHTML = "Loading...";
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=50&page=1&sparkline=false`
  );
  allCoins = await res.json();
  displayCoins(allCoins);
}

function displayCoins(coins) {
  coinsContainer.innerHTML = "";
  coins.forEach(c => {
    const div = document.createElement("div");
    div.className = "crypto-item";
    div.innerHTML = `
      <div class="crypto-name">
        <img src="${c.image}" alt="${c.name}" loading="lazy">
        <span>${c.name} (${c.symbol.toUpperCase()})</span>
      </div>
      <span class="price ${c.price_change_percentage_24h >= 0 ? "up" : "down"}">
        ${currencySymbol[currency]}${c.current_price.toLocaleString()}
      </span>
      <button class="add-btn" data-id="${c.id}">Add</button>
    `;
    coinsContainer.appendChild(div);
  });
  document.querySelectorAll(".add-btn").forEach(btn =>
    btn.addEventListener("click", e => addToWatchlist(e.target.dataset.id))
  );
}

function addToWatchlist(id) {
  const coin = allCoins.find(c => c.id === id);
  if (!watchlist.some(w => w.id === coin.id)) {
    watchlist.push(coin);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    displayWatchlist();
  }
}

function removeFromWatchlist(id) {
  watchlist = watchlist.filter(c => c.id !== id);
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
  displayWatchlist();
}

function displayWatchlist() {
  watchlistContainer.innerHTML = "";
  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = "<p>No coins added yet.</p>";
    return;
  }
  watchlist.forEach(c => {
    const div = document.createElement("div");
    div.className = "crypto-item";
    div.innerHTML = `
      <div class="crypto-name">
        <img src="${c.image}" alt="${c.name}" loading="lazy">
        <span>${c.name} (${c.symbol.toUpperCase()})</span>
      </div>
      <span class="price ${c.price_change_percentage_24h >= 0 ? "up" : "down"}">
        ${currencySymbol[currency]}${c.current_price.toLocaleString()}
      </span>
      <button class="remove-btn" data-id="${c.id}">Remove</button>
    `;
    watchlistContainer.appendChild(div);
  });
  document.querySelectorAll(".remove-btn").forEach(btn =>
    btn.addEventListener("click", e => removeFromWatchlist(e.target.dataset.id))
  );
}

searchBox.addEventListener("input", () => {
  const term = searchBox.value.toLowerCase();
  const filtered = allCoins.filter(
    c => c.name.toLowerCase().includes(term) || c.symbol.toLowerCase().includes(term)
  );
  displayCoins(filtered);
});

currencySelect.addEventListener("change", e => {
  currency = e.target.value;
  localStorage.setItem("currency", currency);
  fetchData();
});

displayWatchlist();
fetchData();
setInterval(fetchData, 60000);
