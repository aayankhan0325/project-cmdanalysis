const { COINS, geckoFetch } = require("../lib/coingecko");

let cache = { expiresAt: 0, payload: null };
const CACHE_MS = 45_000;

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function seriesFrom(points) {
  return (points || []).map(([ts, value]) => ({
    date: new Date(ts).toISOString().slice(0, 10),
    value: round(value, 4),
  }));
}

function dailyChanges(prices) {
  return prices.map((point, index) => {
    if (index === 0) return 0;
    const previous = prices[index - 1].value;
    return previous ? round(((point.value - previous) / previous) * 100, 4) : 0;
  });
}

async function buildMarketPayload() {
  const ids = COINS.map((coin) => coin.id).join(",");
  const [spot, ...charts] = await Promise.all([
    geckoFetch("/simple/price", {
      ids,
      vs_currencies: "usd",
      include_market_cap: "true",
      include_24hr_vol: "true",
      include_24hr_change: "true",
    }),
    ...COINS.map((coin) =>
      geckoFetch(`/coins/${coin.id}/market_chart`, { vs_currency: "usd", days: 365 })
    ),
  ]);

  const coins = {};
  COINS.forEach((coin, index) => {
    const live = spot[coin.id] || {};
    const chart = charts[index] || {};
    const prices = seriesFrom(chart.prices);
    const volumes = seriesFrom(chart.total_volumes);
    const marketCaps = seriesFrom(chart.market_caps);
    const changes = dailyChanges(prices);
    const priceValues = prices.map((row) => row.value);
    const average = priceValues.length
      ? priceValues.reduce((sum, value) => sum + value, 0) / priceValues.length
      : 0;
    const latestPrice = round(live.usd || prices.at(-1)?.value || 0);
    coins[coin.id] = {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      latest_price: latestPrice,
      latest_market_cap: round(live.usd_market_cap || marketCaps.at(-1)?.value || 0),
      latest_volume: round(live.usd_24h_vol || volumes.at(-1)?.value || 0),
      change_24h_pct: round(live.usd_24h_change || changes.at(-1) || 0, 4),
      average_price: round(average),
      highest_price: round(Math.max(...priceValues, latestPrice)),
      lowest_price: round(Math.min(...priceValues, latestPrice)),
      average_daily_change_pct: round(
        changes.reduce((sum, value) => sum + value, 0) / (changes.length || 1),
        4
      ),
      mcap_volume_correlation: correlation(
        marketCaps.map((row) => row.value),
        volumes.map((row) => row.value)
      ),
      dates: prices.map((row) => row.date),
      prices: priceValues.map((value) => round(value)),
      volumes: volumes.map((row) => round(row.value)),
      market_caps: marketCaps.map((row) => round(row.value)),
      changes,
    };
  });

  return {
    generated_at: new Date().toISOString(),
    source: "CoinGecko API",
    refresh_seconds: 60,
    coins,
  };
}

function correlation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const xs = x.slice(0, n);
  const ys = y.slice(0, n);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den ? round(num / den, 4) : 0;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=30");
  try {
    const now = Date.now();
    if (!cache.payload || now > cache.expiresAt) {
      cache.payload = await buildMarketPayload();
      cache.expiresAt = now + CACHE_MS;
    }
    res.status(200).json(cache.payload);
  } catch (error) {
    res.status(502).json({
      error: "Unable to load CoinGecko market data",
      detail: error.message,
    });
  }
};
