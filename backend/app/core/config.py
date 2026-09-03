from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[3]

DATABASE_PATH = BASE_DIR / "database" / "hiresense.db"

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

APP_NAME = "HireSense API"
APP_VERSION = "0.1.0"
APP_DESCRIPTION = "AI-powered recruitment and job matching platform"