import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "outputs"
PUBLIC_DIR = BASE_DIR / "public"

COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "").strip()
VS_CURRENCY = "usd"
HISTORY_DAYS = 365
REQUEST_TIMEOUT = 30
TRACKED_COINS = {
    "bitcoin": "Bitcoin",
    "ethereum": "Ethereum",
}


def coingecko_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "User-Agent": "crypto-etl-pipeline/1.0",
    }
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY
    return headers
