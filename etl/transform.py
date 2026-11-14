import pandas as pd
from etl.models import MarketRecord


def transform_data(raw: pd.DataFrame) -> pd.DataFrame:
    df = raw.copy()
    numeric_cols = ["price_usd", "market_cap_usd", "volume_usd"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=["coin_id", "coin_name", "date", *numeric_cols])
    df = df[(df["price_usd"] > 0) & (df["market_cap_usd"] >= 0) & (df["volume_usd"] >= 0)]
    df = df.drop_duplicates(subset=["coin_id", "date"], keep="last")
    df = df.sort_values(["coin_id", "date"]).reset_index(drop=True)

    validated = []
    for record in df.to_dict(orient="records"):
        validated.append(MarketRecord(**record).model_dump())

    clean = pd.DataFrame(validated)
    clean["date"] = pd.to_datetime(clean["date"])
    clean["daily_change_pct"] = (
        clean.groupby("coin_id")["price_usd"].pct_change().fillna(0) * 100
    ).round(3)
    return clean
