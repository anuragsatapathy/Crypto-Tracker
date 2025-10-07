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
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=50&page=1&sparkline=false`
    );
    const data = await res.json();
    allCoins = data;
    displayCoins(allCoins);
    renderWatchlist();
  } catch (err) {
    coinsContainer.innerHTML = "<p>Failed to load data.</p>";
  }
}


function displayCoins(coins) {
  coinsContainer.innerHTML = "";
  coins.forEach((coin) => {
    const isAdded = watchlist.includes(coin.id);
    const div = document.createElement("div");
    div.className = "crypto-item";

    const priceChange = coin.price_change_percentage_24h;
    const priceClass = priceChange >= 0 ? "up" : "down";

    div.innerHTML = `
      <div class="crypto-name">
        <img src="${coin.image}" alt="${coin.name}" />
        <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
      </div>
      <div class="price ${priceClass}">
        ${currencySymbol[currency]}${coin.current_price.toLocaleString()} 
        (${priceChange.toFixed(2)}%)
      </div>
      <button class="${isAdded ? "remove-btn" : "add-btn"}" data-id="${coin.id}">
        ${isAdded ? "Remove" : "Add"}
      </button>
    `;

    coinsContainer.appendChild(div);
  });
}


coinsContainer.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const id = e.target.dataset.id;
    toggleWatchlist(id);
  }
});

function toggleWatchlist(id) {
  if (watchlist.includes(id)) {
    watchlist = watchlist.filter((coinId) => coinId !== id);
  } else {
    watchlist.push(id);
  }
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
  renderWatchlist();
  displayCoins(allCoins);
}


function renderWatchlist() {
  watchlistContainer.innerHTML = "";
  const coinsInWatchlist = allCoins.filter((coin) =>
    watchlist.includes(coin.id)
  );

  if (coinsInWatchlist.length === 0) {
    watchlistContainer.innerHTML = "<p>No coins added yet.</p>";
    return;
  }

  coinsInWatchlist.forEach((coin) => {
    const div = document.createElement("div");
    const priceClass = coin.price_change_percentage_24h >= 0 ? "up" : "down";

    div.className = "crypto-item";
    div.innerHTML = `
      <div class="crypto-name">
        <img src="${coin.image}" alt="${coin.name}" />
        <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
      </div>
      <div class="price ${priceClass}">
        ${currencySymbol[currency]}${coin.current_price.toLocaleString()} 
        (${coin.price_change_percentage_24h.toFixed(2)}%)
      </div>
    `;
    watchlistContainer.appendChild(div);
  });
}


searchBox.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  const filtered = allCoins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(value) ||
      coin.symbol.toLowerCase().includes(value)
  );
  displayCoins(filtered);
});

currencySelect.addEventListener("change", (e) => {
  currency = e.target.value;
  localStorage.setItem("currency", currency);
  fetchData();
});


setInterval(fetchData, 60000);

fetchData();
