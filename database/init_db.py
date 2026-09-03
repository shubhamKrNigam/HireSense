import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

DATABASE_PATH = BASE_DIR / "hiresense.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"


def initialize_database():
    connection = sqlite3.connect(DATABASE_PATH)

    try:
        connection.execute("PRAGMA foreign_keys = ON")

        schema = SCHEMA_PATH.read_text(encoding="utf-8")

        connection.executescript(schema)

        connection.commit()

        print("HireSense database initialized successfully.")
        print(f"Database: {DATABASE_PATH}")

    finally:
        connection.close()


if __name__ == "__main__":
    initialize_database()