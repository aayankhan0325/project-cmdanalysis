from pathlib import Path
import sqlite3
import pandas as pd


def load_outputs(df: pd.DataFrame, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / "crypto_market_data.csv"
    db_path = output_dir / "crypto_market_data.db"

    export_df = df.copy()
    export_df["date"] = export_df["date"].dt.strftime("%Y-%m-%d")
    export_df.to_csv(csv_path, index=False)

    with sqlite3.connect(db_path) as connection:
        export_df.to_sql("market_data", connection, if_exists="replace", index=False)

    print(f"Saved CSV: {csv_path}")
    print(f"Saved SQLite database: {db_path}")
