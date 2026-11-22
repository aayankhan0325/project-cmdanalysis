from pathlib import Path
import sqlite3
import pandas as pd

CSV_COLUMNS = [
    "coin_id",
    "coin_name",
    "date",
    "price_usd",
    "market_cap_usd",
    "volume_usd",
    "daily_change_pct",
    "volume_to_mcap_pct",
]


def _format_export(df: pd.DataFrame) -> pd.DataFrame:
    export_df = df.copy()
    export_df["date"] = pd.to_datetime(export_df["date"]).dt.strftime("%Y-%m-%d")
    export_df["price_usd"] = export_df["price_usd"].map(lambda x: f"{float(x):.4f}")
    export_df["market_cap_usd"] = export_df["market_cap_usd"].map(lambda x: f"{float(x):.2f}")
    export_df["volume_usd"] = export_df["volume_usd"].map(lambda x: f"{float(x):.2f}")
    export_df["daily_change_pct"] = export_df["daily_change_pct"].map(lambda x: f"{float(x):.4f}")
    export_df["volume_to_mcap_pct"] = export_df["volume_to_mcap_pct"].map(lambda x: f"{float(x):.4f}")
    return export_df[CSV_COLUMNS]


def load_outputs(df: pd.DataFrame, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / "crypto_market_data.csv"
    db_path = output_dir / "crypto_market_data.db"
    export_df = _format_export(df)

    export_df.to_csv(
        csv_path,
        index=False,
        encoding="utf-8-sig",
        lineterminator="\n",
        quoting=1,
    )

    numeric_db = df.copy()
    numeric_db["date"] = pd.to_datetime(numeric_db["date"]).dt.strftime("%Y-%m-%d")
    with sqlite3.connect(db_path) as connection:
        numeric_db[CSV_COLUMNS].to_sql("market_data", connection, if_exists="replace", index=False)
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_market_coin_date ON market_data (coin_id, date)"
        )

    print(f"Saved CSV: {csv_path}")
    print(f"Saved SQLite database: {db_path}")
