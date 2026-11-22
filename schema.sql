CREATE TABLE IF NOT EXISTS market_data (
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  date TEXT NOT NULL,
  price_usd REAL NOT NULL,
  market_cap_usd REAL NOT NULL,
  volume_usd REAL NOT NULL,
  daily_change_pct REAL NOT NULL,
  volume_to_mcap_pct REAL NOT NULL,
  PRIMARY KEY (coin_id, date)
);

CREATE INDEX IF NOT EXISTS idx_market_coin_date ON market_data (coin_id, date);
