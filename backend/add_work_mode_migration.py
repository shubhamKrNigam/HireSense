import sqlite3
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATABASE_PATH = PROJECT_ROOT / "database" / "hiresense.db"


def main():
    if not DATABASE_PATH.exists():
        raise FileNotFoundError(
            f"Database not found: {DATABASE_PATH}"
        )

    print(f"Using database: {DATABASE_PATH}")

    connection = sqlite3.connect(DATABASE_PATH)

    try:
        cursor = connection.cursor()

        # Check that the jobs table exists.
        cursor.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table' AND name = 'jobs'
            """
        )

        if cursor.fetchone() is None:
            raise RuntimeError(
                "The 'jobs' table does not exist in the database."
            )

        # Inspect the existing jobs table.
        cursor.execute("PRAGMA table_info(jobs)")
        columns = {row[1] for row in cursor.fetchall()}

        # Safe to run multiple times.
        if "work_mode" in columns:
            print("work_mode already exists in jobs.")
            print("No database changes were made.")
            return

        # Add the new optional column.
        cursor.execute(
            "ALTER TABLE jobs ADD COLUMN work_mode VARCHAR(30)"
        )

        connection.commit()

        print("Successfully added work_mode to jobs.")
        print("Existing jobs and data were preserved.")
        print("No database reset was performed.")

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


if __name__ == "__main__":
    main()
