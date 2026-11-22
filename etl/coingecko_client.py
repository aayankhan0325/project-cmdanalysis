"""Dedicated CoinGecko API client used by the extract layer."""

import requests
from etl.config import (
    COINGECKO_BASE_URL,
    HISTORY_DAYS,
    REQUEST_TIMEOUT,
    VS_CURRENCY,
    coingecko_headers,
)


class CoinGeckoClient:
    def __init__(self) -> None:
        self.base_url = COINGECKO_BASE_URL
        self.headers = coingecko_headers()

    def get_market_chart(self, coin_id: str, days: int = HISTORY_DAYS) -> dict:
        url = f"{self.base_url}/coins/{coin_id}/market_chart"
        response = requests.get(
            url,
            params={"vs_currency": VS_CURRENCY, "days": days},
            headers=self.headers,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()

    def get_simple_price(self, coin_ids: list[str]) -> dict:
        url = f"{self.base_url}/simple/price"
        response = requests.get(
            url,
            params={
                "ids": ",".join(coin_ids),
                "vs_currencies": VS_CURRENCY,
                "include_market_cap": "true",
                "include_24hr_vol": "true",
                "include_24hr_change": "true",
            },
            headers=self.headers,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()
