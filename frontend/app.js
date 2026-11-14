let dataset = {};
let priceChart;
let volumeChart;
let comparisonChart;
let filtered = {};

const money = value => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 2
}).format(value);

function getFilteredData(coin) {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  return coin.dates.map((date, i) => ({
    date, price: coin.prices[i], volume: coin.volumes[i]
  })).filter(row => (!start || row.date >= start) && (!end || row.date <= end));
}

function showCards() {
  const cards = document.getElementById("cards");
  cards.innerHTML = "";
  Object.values(dataset).forEach(coin => {
    const div = document.createElement("article");
    div.className = "card";
    div.innerHTML = `<p>${coin.name} · Latest price</p><strong>${money(coin.latest_price)}</strong>
      <p>Average: ${money(coin.average_price)}</p>
      <p>High: ${money(coin.highest_price)} · Low: ${money(coin.lowest_price)}</p>
      <p>Average daily change: ${coin.average_daily_change_pct}%</p>`;
    cards.appendChild(div);
  });
}

function drawCharts(coinId) {
  const coin = dataset[coinId];
  if (!coin) return;
  const rows = getFilteredData(coin);
  const labels = rows.map(row => row.date);

  if (priceChart) priceChart.destroy();
  if (volumeChart) volumeChart.destroy();

  priceChart = new Chart(document.getElementById("priceChart"), {
    type: "line",
    data: { labels, datasets: [{ label: `${coin.name} price (USD)`,
      data: rows.map(row => row.price), borderColor: "#38bdf8",
      backgroundColor: "rgba(56,189,248,.12)", fill: true, pointRadius: 0, tension: .2 }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  volumeChart = new Chart(document.getElementById("volumeChart"), {
    type: "bar",
    data: { labels, datasets: [{ label: "24h volume (USD)",
      data: rows.map(row => row.volume), backgroundColor: "#818cf8" }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  drawComparison();
}

function drawComparison() {
  const ids = ["bitcoin", "ethereum"];
  const colors = ["#38bdf8", "#a78bfa"];
  const sets = ids.filter(id => dataset[id]).map((id, index) => {
    const rows = getFilteredData(dataset[id]);
    const first = rows.length ? rows[0].price : 1;
    return { label: dataset[id].name,
      data: rows.map(row => first ? ((row.price / first) - 1) * 100 : 0),
      borderColor: colors[index], pointRadius: 0, tension: .2 };
  });
  if (comparisonChart) comparisonChart.destroy();
  comparisonChart = new Chart(document.getElementById("comparisonChart"), {
    type: "line",
    data: { labels: getFilteredData(dataset.bitcoin).map(row => row.date), datasets: sets },
    options: { responsive: true, maintainAspectRatio: false,
      scales: { y: { title: { display: true, text: "% change from first visible day" } } } }
  });
}

function downloadCsv() {
  const header = ["coin", "date", "price_usd", "volume_usd"];
  const lines = [header.join(",")];
  Object.entries(dataset).forEach(([id, coin]) => {
    getFilteredData(coin).forEach(row => {
      lines.push([id, row.date, row.price, row.volume].join(","));
    });
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "crypto_market_data_filtered.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

async function startDashboard() {
  try {
    const response = await fetch("dashboard_data.json");
    if (!response.ok) throw new Error("dashboard_data.json not found");
    dataset = await response.json();
    showCards();

    const allDates = Object.values(dataset).flatMap(coin => coin.dates);
    document.getElementById("startDate").value = allDates.sort()[0];
    document.getElementById("endDate").value = allDates.sort().at(-1);

    drawCharts("bitcoin");
    document.getElementById("coinSelect").addEventListener("change", e => drawCharts(e.target.value));
    ["startDate", "endDate"].forEach(id =>
      document.getElementById(id).addEventListener("change", () =>
        drawCharts(document.getElementById("coinSelect").value)));
    document.getElementById("resetDates").addEventListener("click", () => {
      document.getElementById("startDate").value = allDates.sort()[0];
      document.getElementById("endDate").value = allDates.sort().at(-1);
      drawCharts(document.getElementById("coinSelect").value);
    });
    document.getElementById("downloadCsv").addEventListener("click", downloadCsv);
    document.getElementById("status").textContent = "Dataset loaded successfully.";
  } catch (error) {
    document.getElementById("status").textContent =
      "Dataset not generated yet. Run: python main.py — then open this dashboard using a local web server.";
  }
}
startDashboard();
