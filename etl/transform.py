import pandas as pd
from etl.models import EnrichedMarketRecord, MarketRecord


def transform_data(raw: pd.DataFrame) -> pd.DataFrame:
    df = raw.copy()
    numeric_cols = ["price_usd", "market_cap_usd", "volume_usd"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["coin_id"] = df["coin_id"].astype(str).str.strip().str.lower()
    df["coin_name"] = df["coin_name"].astype(str).str.strip()
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date

    df = df.dropna(subset=["coin_id", "coin_name", "date", *numeric_cols])
    df = df[(df["price_usd"] > 0) & (df["market_cap_usd"] >= 0) & (df["volume_usd"] >= 0)]
    df = df.drop_duplicates(subset=["coin_id", "date"], keep="last")
    df = df.sort_values(["coin_id", "date"]).reset_index(drop=True)

    validated = [MarketRecord(**record).model_dump() for record in df.to_dict(orient="records")]
    clean = pd.DataFrame(validated)
    clean["date"] = pd.to_datetime(clean["date"])

    clean["daily_change_pct"] = (
        clean.groupby("coin_id")["price_usd"].pct_change().fillna(0) * 100
    ).round(4)
    clean["volume_to_mcap_pct"] = (
        (clean["volume_usd"] / clean["market_cap_usd"].replace(0, pd.NA)) * 100
    ).fillna(0).round(4)

    enriched = [
        EnrichedMarketRecord(**record).model_dump()
        for record in clean.to_dict(orient="records")
    ]
    result = pd.DataFrame(enriched)
    result["date"] = pd.to_datetime(result["date"])
    result["price_usd"] = result["price_usd"].round(4)
    result["market_cap_usd"] = result["market_cap_usd"].round(2)
    result["volume_usd"] = result["volume_usd"].round(2)
    return result.sort_values(["coin_id", "date"]).reset_index(drop=True)
