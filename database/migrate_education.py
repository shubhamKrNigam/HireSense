import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "hiresense.db"


def main():
    if not DB_PATH.exists():
        print(f"Database not found: {DB_PATH}")
        return

    connection = sqlite3.connect(DB_PATH)

    try:
        cursor = connection.cursor()

        cursor.execute("PRAGMA table_info(educations)")
        columns = {row[1] for row in cursor.fetchall()}

        if "education_type" not in columns:
            cursor.execute(
                """
                ALTER TABLE educations
                ADD COLUMN education_type VARCHAR(50)
                DEFAULT 'Undergraduate'
                """
            )
            print("Added: education_type")
        else:
            print("Already exists: education_type")

        if "score_type" not in columns:
            cursor.execute(
                """
                ALTER TABLE educations
                ADD COLUMN score_type VARCHAR(30)
                DEFAULT 'CGPA'
                """
            )
            print("Added: score_type")
        else:
            print("Already exists: score_type")

        connection.commit()

        print("\nEducation database migration completed successfully.")

    finally:
        connection.close()


if __name__ == "__main__":
    main()