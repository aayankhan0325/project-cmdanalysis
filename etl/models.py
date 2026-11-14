from datetime import date
from pydantic import BaseModel, Field, ConfigDict


class MarketRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    coin_id: str
    coin_name: str
    date: date
    price_usd: float = Field(gt=0)
    market_cap_usd: float = Field(ge=0)
    volume_usd: float = Field(ge=0)
