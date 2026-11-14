from pathlib import Path
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd


def run_eda(df: pd.DataFrame, output_dir: Path, frontend_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    frontend_dir.mkdir(parents=True, exist_ok=True)

    for coin_id, group in df.groupby("coin_id"):
        plt.figure(figsize=(10, 5))
        plt.plot(group["date"], group["price_usd"])
        plt.title(f"{group['coin_name'].iloc[0]} Daily Price (USD)")
        plt.xlabel("Date")
        plt.ylabel("Price (USD)")
        plt.xticks(rotation=30)
        plt.tight_layout()
        plt.savefig(output_dir / f"{coin_id}_price_trend.png")
        plt.close()

    latest = df.sort_values("date").groupby("coin_id").tail(1)
    plt.figure(figsize=(8, 5))
    plt.bar(latest["coin_name"], latest["volume_usd"])
    plt.title("Latest Recorded 24h Trading Volume")
    plt.ylabel("Volume (USD)")
    plt.tight_layout()
    plt.savefig(output_dir / "volume_comparison.png")
    plt.close()

    summary = {}
    for coin_id, group in df.groupby("coin_id"):
        latest_row = group.sort_values("date").iloc[-1]
        summary[coin_id] = {
            "name": str(latest_row["coin_name"]),
            "latest_price": round(float(latest_row["price_usd"]), 2),
            "latest_market_cap": round(float(latest_row["market_cap_usd"]), 2),
            "latest_volume": round(float(latest_row["volume_usd"]), 2),
            "average_price": round(float(group["price_usd"].mean()), 2),
            "highest_price": round(float(group["price_usd"].max()), 2),
            "lowest_price": round(float(group["price_usd"].min()), 2),
            "average_daily_change_pct": round(float(group["daily_change_pct"].mean()), 3),
            "dates": group["date"].dt.strftime("%Y-%m-%d").tolist(),
            "prices": [round(float(x), 2) for x in group["price_usd"].tolist()],
            "volumes": [round(float(x), 2) for x in group["volume_usd"].tolist()],
        }

    with open(frontend_dir / "dashboard_data.json", "w", encoding="utf-8") as file:
        json.dump(summary, file, indent=2)

    print("EDA charts and dashboard JSON generated.")
