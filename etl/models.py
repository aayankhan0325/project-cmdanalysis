from datetime import date
from pydantic import BaseModel, Field, ConfigDict, field_validator


class MarketRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    coin_id: str
    coin_name: str
    date: date
    price_usd: float = Field(gt=0)
    market_cap_usd: float = Field(ge=0)
    volume_usd: float = Field(ge=0)

    @field_validator("coin_id", "coin_name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty")
        return cleaned


class EnrichedMarketRecord(MarketRecord):
    daily_change_pct: float = 0.0
    volume_to_mcap_pct: float = Field(ge=0, default=0.0)
