import sqlite3
from pathlib import Path
from datetime import datetime


DB_PATH = Path(__file__).resolve().parent / "hiresense.db"


def main():
    print("Fixing candidate_preferences table...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA foreign_keys = OFF")

    # Read existing data.
    cursor.execute(
        """
        SELECT
            id,
            candidate_id,
            preferred_roles,
            preferred_locations,
            work_modes,
            employment_types,
            experience_level,
            updated_at
        FROM candidate_preferences
        """
    )

    rows = cursor.fetchall()

    # Remove temporary table if a previous interrupted migration exists.
    cursor.execute(
        "DROP TABLE IF EXISTS candidate_preferences_new"
    )

    # Create clean table.
    cursor.execute(
        """
        CREATE TABLE candidate_preferences_new (
            id INTEGER PRIMARY KEY,
            candidate_id INTEGER NOT NULL UNIQUE,
            preferred_roles JSON NOT NULL DEFAULT '[]',
            preferred_locations JSON NOT NULL DEFAULT '[]',
            work_modes JSON NOT NULL DEFAULT '[]',
            employment_types JSON NOT NULL DEFAULT '[]',
            experience_level VARCHAR,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(candidate_id) REFERENCES candidates(id)
        )
        """
    )

    # Copy existing data.
    for row in rows:
        (
            row_id,
            candidate_id,
            preferred_roles,
            preferred_locations,
            work_modes,
            employment_types,
            experience_level,
            updated_at,
        ) = row

        # Fix the old invalid timestamp if necessary.
        if (
            updated_at is None
            or updated_at == "CURRENT_TIMESTAMP"
            or updated_at == "'CURRENT_TIMESTAMP'"
        ):
            updated_at = datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )

        # Old database may have NULL work_modes.
        if work_modes is None:
            work_modes = "[]"

        cursor.execute(
            """
            INSERT INTO candidate_preferences_new (
                id,
                candidate_id,
                preferred_roles,
                preferred_locations,
                work_modes,
                employment_types,
                experience_level,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                row_id,
                candidate_id,
                preferred_roles or "[]",
                preferred_locations or "[]",
                work_modes,
                employment_types or "[]",
                experience_level,
                updated_at,
            ),
        )

    # Replace old table.
    cursor.execute(
        "DROP TABLE candidate_preferences"
    )

    cursor.execute(
        """
        ALTER TABLE candidate_preferences_new
        RENAME TO candidate_preferences
        """
    )

    cursor.execute("PRAGMA foreign_keys = ON")

    conn.commit()

    print("Candidate preference table fixed successfully.")
    print(f"Rows preserved: {len(rows)}")

    conn.close()


if __name__ == "__main__":
    main()