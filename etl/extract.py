import os
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.coingecko.com/api/v3"
COINS = {"bitcoin": "Bitcoin", "ethereum": "Ethereum"}


def fetch_coin_data(coin_id: str, coin_name: str, days: int = 365) -> pd.DataFrame:
    url = f"{BASE_URL}/coins/{coin_id}/market_chart"
    headers = {}
    api_key = os.getenv("COINGECKO_API_KEY", "").strip()
    if api_key:
        headers["x-cg-demo-api-key"] = api_key

    response = requests.get(
        url,
        params={"vs_currency": "usd", "days": days},
        headers=headers,
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()

    prices = pd.DataFrame(payload.get("prices", []), columns=["timestamp", "price_usd"])
    caps = pd.DataFrame(payload.get("market_caps", []), columns=["timestamp", "market_cap_usd"])
    volumes = pd.DataFrame(payload.get("total_volumes", []), columns=["timestamp", "volume_usd"])

    if prices.empty:
        raise ValueError(f"No price data returned for {coin_name}")

    df = prices.merge(caps, on="timestamp", how="left")
    df = df.merge(volumes, on="timestamp", how="left")
    df["date"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True).dt.date
    df["coin_id"] = coin_id
    df["coin_name"] = coin_name
    return df[["coin_id", "coin_name", "date", "price_usd", "market_cap_usd", "volume_usd"]]


def extract_all() -> pd.DataFrame:
    frames = []
    for coin_id, coin_name in COINS.items():
        print(f"Extracting {coin_name} data...")
        frames.append(fetch_coin_data(coin_id, coin_name))
    return pd.concat(frames, ignore_index=True)
