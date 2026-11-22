# Cryptocurrency Market Data Analysis Using an ETL Pipeline

This project extracts Bitcoin and Ethereum market data from the CoinGecko API, validates it with Pydantic, stores a cleaned CSV and SQLite database, and serves a live dashboard with one-minute auto-refresh.

## Pipeline

1. **Extract** — `etl/coingecko_client.py` calls CoinGecko with a demo API key.
2. **Transform** — Pandas cleans missing values, timestamps, and daily changes. Pydantic validates required fields.
3. **Load** — UTF-8 CSV (Excel-friendly) and SQLite table `market_data`.
4. **Analyze** — price trends, highs/lows, volume, daily % change, and market-cap vs volume.

## Local ETL

```bash
python -m pip install -r requirements.txt
copy .env.example .env
python main.py
```

Set `COINGECKO_API_KEY` in `.env`. Outputs land in `outputs/crypto_market_data.csv` and `outputs/crypto_market_data.db`.

## Live dashboard

The dashboard reads `/api/market` and refreshes every 60 seconds. CSV download uses quoted columns, ISO dates, and a UTF-8 BOM.

```bash
python main.py
python serve.py
```

Then open http://127.0.0.1:8765

## Vercel

CLI deploy from this Windows machine is not required. Import the GitHub repo:

1. Open https://vercel.com/new and import `aayankhan0325/project-cmdanalysis`.
2. Framework preset: Other. Output directory: `public`.
3. Add environment variable `COINGECKO_API_KEY`.
4. Deploy. Routes in `api/` become serverless functions (`/api/market`, `/api/csv`, `/api/health`).
