from pathlib import Path
from etl.extract import extract_all
from etl.transform import transform_data
from etl.load import load_outputs
from etl.analysis import run_eda


def run_pipeline(output_dir: Path, public_dir: Path):
    raw = extract_all()
    clean = transform_data(raw)
    load_outputs(clean, output_dir)
    run_eda(clean, output_dir, public_dir)
    return clean
