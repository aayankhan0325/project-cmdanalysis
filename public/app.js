const REFRESH_MS = 60_000;
const money = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
}).format(value);

const compact = (value) => new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
}).format(value);

let dataset = {};
let charts = {};
let secondsLeft = 60;
let timerId = null;

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function currentCoinId() {
  return document.getElementById("coinSelect").value;
}

function rowsFor(coin) {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  return coin.dates.map((date, index) => ({
    date,
    price: coin.prices[index],
    volume: coin.volumes[index],
    marketCap: coin.market_caps?.[index] ?? 0,
    change: coin.changes?.[index] ?? 0,
  })).filter((row) => (!start || row.date >= start) && (!end || row.date <= end));
}

function showCards() {
  const cards = document.getElementById("cards");
  cards.innerHTML = Object.values(dataset).map((coin) => {
    const change = Number(coin.change_24h_pct ?? coin.latest_daily_change_pct ?? 0);
    const up = change >= 0;
    const code = coin.symbol || String(coin.id || coin.name || "").toUpperCase();
    return `
      <article class="card">
        <header>
          <p>${coin.name} · ${code}</p>
          <span class="${up ? "up" : "down"}">${up ? "+" : ""}${change}%</span>
        </header>
        <strong>${money(coin.latest_price)}</strong>
        <div class="metrics">
          <p>Average<br><b>${money(coin.average_price)}</b></p>
          <p>High / Low<br><b>${money(coin.highest_price)} / ${money(coin.lowest_price)}</b></p>
          <p>Market cap<br><b>${compact(coin.latest_market_cap)}</b></p>
          <p>24h volume<br><b>${compact(coin.latest_volume)}</b></p>
        </div>
      </article>
    `;
  }).join("");
}

function upsertChart(id, config) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), config);
}

function chartDefaults(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#d7d6ce" } } },
    scales: {
      x: { ticks: { color: "#9a9b92", maxTicksLimit: 8 }, grid: { color: "rgba(255,255,255,.04)" } },
      y: { ticks: { color: "#9a9b92" }, grid: { color: "rgba(255,255,255,.04)" } },
    },
    ...extra,
  };
}

function drawCharts() {
  const coin = dataset[currentCoinId()];
  if (!coin) return;
  const rows = rowsFor(coin);
  const labels = rows.map((row) => row.date);
  document.getElementById("rangeHint").textContent = `${rows.length} days in view`;

  upsertChart("priceChart", {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `${coin.name} USD`,
        data: rows.map((row) => row.price),
        borderColor: "#e5bd59",
        backgroundColor: "rgba(229,189,89,.12)",
        fill: true,
        pointRadius: 0,
        tension: 0.25,
      }],
    },
    options: chartDefaults(),
  });

  upsertChart("volumeChart", {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Volume USD",
        data: rows.map((row) => row.volume),
        backgroundColor: "rgba(129,140,248,.85)",
      }],
    },
    options: chartDefaults(),
  });

  upsertChart("changeChart", {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Daily %",
        data: rows.map((row) => row.change),
        backgroundColor: rows.map((row) => (row.change >= 0 ? "#63bd91" : "#e17c75")),
      }],
    },
    options: chartDefaults(),
  });

  upsertChart("scatterChart", {
    type: "scatter",
    data: {
      datasets: [{
        label: "Cap vs volume",
        data: rows.map((row) => ({ x: row.marketCap, y: row.volume })),
        backgroundColor: "#38bdf8",
      }],
    },
    options: chartDefaults({
      scales: {
        x: { title: { display: true, text: "Market cap", color: "#9a9b92" }, ticks: { color: "#9a9b92" }, grid: { color: "rgba(255,255,255,.04)" } },
        y: { title: { display: true, text: "Volume", color: "#9a9b92" }, ticks: { color: "#9a9b92" }, grid: { color: "rgba(255,255,255,.04)" } },
      },
    }),
  });

  const colors = { bitcoin: "#38bdf8", ethereum: "#a78bfa" };
  const comparison = Object.values(dataset).map((item) => {
    const itemRows = rowsFor(item);
    const first = itemRows[0]?.price || 1;
    return {
      label: item.name,
      data: itemRows.map((row) => first ? ((row.price / first) - 1) * 100 : 0),
      borderColor: colors[item.id] || "#e5bd59",
      pointRadius: 0,
      tension: 0.25,
    };
  });
  upsertChart("comparisonChart", {
    type: "line",
    data: { labels: rowsFor(dataset.bitcoin || coin).map((row) => row.date), datasets: comparison },
    options: chartDefaults(),
  });

  const body = document.getElementById("tableBody");
  const tableRows = Object.values(dataset).flatMap((item) => {
    const last = rowsFor(item).slice(-5);
    return last.map((row) => `
      <tr>
        <td>${row.date}</td>
        <td>${item.name}</td>
        <td>${money(row.price)}</td>
        <td>${compact(row.marketCap)}</td>
        <td>${compact(row.volume)}</td>
        <td class="${row.change >= 0 ? "up" : "down"}">${row.change.toFixed(4)}%</td>
      </tr>
    `);
  });
  body.innerHTML = tableRows.join("");
}

function downloadCsv() {
  const header = ["coin_id", "coin_name", "date", "price_usd", "market_cap_usd", "volume_usd", "daily_change_pct"];
  const lines = [header.map(csvEscape).join(",")];
  Object.values(dataset).forEach((coin) => {
    rowsFor(coin).forEach((row) => {
      lines.push([
        csvEscape(coin.id),
        csvEscape(coin.name),
        csvEscape(row.date),
        csvEscape(Number(row.price).toFixed(4)),
        csvEscape(Number(row.marketCap).toFixed(2)),
        csvEscape(Number(row.volume).toFixed(2)),
        csvEscape(Number(row.change).toFixed(4)),
      ].join(","));
    });
  });
  const blob = new Blob([`\uFEFF${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "crypto_market_data.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function normalizePayload(payload) {
  const coins = payload.coins || payload;
  Object.entries(coins).forEach(([id, coin]) => {
    coin.id = coin.id || id;
    coin.symbol = coin.symbol || ({ bitcoin: "BTC", ethereum: "ETH" }[id]) || id.slice(0, 3).toUpperCase();
    coin.change_24h_pct = Number(coin.change_24h_pct ?? coin.latest_daily_change_pct ?? 0);
    coin.market_caps = coin.market_caps || [];
    coin.changes = coin.changes || [];
  });
  return coins;
}

function setDateBounds(coins) {
  const allDates = Object.values(coins).flatMap((coin) => coin.dates).sort();
  if (!allDates.length) return;
  const start = document.getElementById("startDate");
  const end = document.getElementById("endDate");
  if (!start.dataset.ready) {
    start.value = allDates[0];
    end.value = allDates.at(-1);
    start.dataset.ready = "true";
  }
}

async function loadDashboard(manual = false) {
  const status = document.getElementById("status");
  try {
    let payload;
    const live = await fetch("/api/market", { cache: "no-store" });
    if (live.ok) {
      payload = await live.json();
    } else {
      const fallback = await fetch("dashboard_data.json", { cache: "no-store" });
      if (!fallback.ok) throw new Error("No live API or snapshot available");
      payload = await fallback.json();
    }
    dataset = normalizePayload(payload);
    setDateBounds(dataset);
    showCards();
    drawCharts();
    status.classList.remove("error");
    status.textContent = manual
      ? `Manual refresh at ${new Date().toLocaleTimeString()}`
      : `Live dataset loaded · ${payload.generated_at || "snapshot"}`;
    document.getElementById("liveLabel").textContent = "Live";
  } catch (error) {
    status.classList.add("error");
    status.textContent = "Could not load market data. Run python main.py or check the CoinGecko API key.";
    document.getElementById("liveLabel").textContent = "Offline";
  }
}

function tick() {
  secondsLeft -= 1;
  if (secondsLeft <= 0) {
    secondsLeft = 60;
    loadDashboard();
  }
  document.getElementById("countdown").textContent = `Next refresh in ${secondsLeft}s`;
}

function bindControls() {
  document.getElementById("coinSelect").addEventListener("change", drawCharts);
  ["startDate", "endDate"].forEach((id) => {
    document.getElementById(id).addEventListener("change", drawCharts);
  });
  document.getElementById("resetDates").addEventListener("click", () => {
    const start = document.getElementById("startDate");
    start.dataset.ready = "";
    setDateBounds(dataset);
    drawCharts();
  });
  document.getElementById("downloadCsv").addEventListener("click", downloadCsv);
  document.getElementById("refreshNow").addEventListener("click", () => {
    secondsLeft = 60;
    loadDashboard(true);
  });
}

bindControls();
loadDashboard();
timerId = setInterval(tick, 1000);
