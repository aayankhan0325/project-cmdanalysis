const marketHandler = require("./market");

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(payload) {
  const header = [
    "coin_id",
    "coin_name",
    "symbol",
    "date",
    "price_usd",
    "market_cap_usd",
    "volume_usd",
    "daily_change_pct",
  ];
  const lines = [header.join(",")];
  Object.values(payload.coins || {}).forEach((coin) => {
    coin.dates.forEach((date, index) => {
      lines.push(
        [
          csvEscape(coin.id),
          csvEscape(coin.name),
          csvEscape(coin.symbol),
          csvEscape(date),
          csvEscape(Number(coin.prices[index] || 0).toFixed(4)),
          csvEscape(Number(coin.market_caps[index] || 0).toFixed(2)),
          csvEscape(Number(coin.volumes[index] || 0).toFixed(2)),
          csvEscape(Number(coin.changes[index] || 0).toFixed(4)),
        ].join(",")
      );
    });
  });
  return `\uFEFF${lines.join("\n")}\n`;
}

module.exports = async function handler(req, res) {
  const fakeRes = {
    setHeader() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await marketHandler(req, fakeRes);
  if (fakeRes.statusCode && fakeRes.statusCode >= 400) {
    res.status(fakeRes.statusCode).json(fakeRes.body);
    return;
  }
  const csv = toCsv(fakeRes.body);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="crypto_market_data.csv"');
  res.status(200).send(csv);
};
