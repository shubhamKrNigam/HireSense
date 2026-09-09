import json
import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "hiresense.db"


def main():
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(candidate_preferences)")
    columns = {row[1] for row in cursor.fetchall()}

    if "candidate_preferences" not in [
        row[0]
        for row in cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    ]:
        print("candidate_preferences table does not exist.")
        conn.close()
        return

    if "work_modes" not in columns:
        print("Adding work_modes column...")
        cursor.execute(
            "ALTER TABLE candidate_preferences ADD COLUMN work_modes JSON"
        )

    cursor.execute(
        """
        SELECT id, work_mode
        FROM candidate_preferences
        """
    )

    rows = cursor.fetchall()

    migrated = 0

    for row_id, old_work_mode in rows:
        if old_work_mode:
            work_modes = [old_work_mode]
        else:
            work_modes = []

        cursor.execute(
            """
            UPDATE candidate_preferences
            SET work_modes = ?
            WHERE id = ?
            """,
            (json.dumps(work_modes), row_id),
        )

        migrated += 1

    conn.commit()
    conn.close()

    print("Candidate preference migration completed.")
    print(f"Rows migrated: {migrated}")
    print("Existing work_mode column was preserved for safety.")


if __name__ == "__main__":
    main()