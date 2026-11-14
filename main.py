from pathlib import Path
import time
from etl.extract import extract_all
from etl.transform import transform_data
from etl.load import load_outputs
from etl.analysis import run_eda

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
FRONTEND_DIR = BASE_DIR / "frontend"


def main():
    print("\n=== Cryptocurrency ETL Pipeline Started ===\n")
    try:
        raw_data = extract_all()
        print(f"Extracted {len(raw_data)} rows.")

        clean_data = transform_data(raw_data)
        print(f"Transformed and validated {len(clean_data)} rows.")

        load_outputs(clean_data, OUTPUT_DIR)
        run_eda(clean_data, OUTPUT_DIR, FRONTEND_DIR)

        print("\n=== ETL Pipeline Completed Successfully ===")
        print("Open frontend/index.html to view the dashboard.")
    except Exception as error:
        print("\nPROJECT ERROR:", error)
        print("Check your internet connection, CoinGecko API access, and try again.")
        raise


if __name__ == "__main__":
    main()
