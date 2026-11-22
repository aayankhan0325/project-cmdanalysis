const BASE_URL = "https://api.coingecko.com/api/v3";
const COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
];

function headers() {
  const apiKey = (process.env.COINGECKO_API_KEY || "").trim();
  const result = {
    Accept: "application/json",
    "User-Agent": "crypto-etl-dashboard/1.0",
  };
  if (apiKey) {
    result["x-cg-demo-api-key"] = apiKey;
  }
  return result;
}

async function geckoFetch(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`CoinGecko ${response.status}: ${body.slice(0, 180)}`);
  }
  return response.json();
}

module.exports = { BASE_URL, COINS, geckoFetch };
