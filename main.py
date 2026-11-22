from etl.config import OUTPUT_DIR, PUBLIC_DIR
from etl.pipeline import run_pipeline


def main():
    print("\n=== Cryptocurrency ETL Pipeline Started ===\n")
    try:
        clean_data = run_pipeline(OUTPUT_DIR, PUBLIC_DIR)
        print(f"Pipeline stored {len(clean_data)} validated rows.")

        print("\n=== ETL Pipeline Completed Successfully ===")
        print("Open public/index.html or deploy to Vercel to view the dashboard.")
    except Exception as error:
        print("\nPROJECT ERROR:", error)
        print("Check your internet connection, CoinGecko API access, and try again.")
        raise


if __name__ == "__main__":
    main()
