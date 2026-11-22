import pandas as pd
from etl.coingecko_client import CoinGeckoClient
from etl.config import TRACKED_COINS, HISTORY_DAYS


def fetch_coin_data(client: CoinGeckoClient, coin_id: str, coin_name: str, days: int = HISTORY_DAYS) -> pd.DataFrame:
    payload = client.get_market_chart(coin_id, days=days)

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
    client = CoinGeckoClient()
    frames = []
    for coin_id, coin_name in TRACKED_COINS.items():
        print(f"Extracting {coin_name} data from CoinGecko...")
        frames.append(fetch_coin_data(client, coin_id, coin_name))
    return pd.concat(frames, ignore_index=True)
