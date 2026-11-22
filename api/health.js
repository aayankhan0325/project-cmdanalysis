module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    ok: true,
    service: "crypto-market-api",
    source: "CoinGecko",
    hasApiKey: Boolean((process.env.COINGECKO_API_KEY || "").trim()),
    time: new Date().toISOString(),
  });
};
