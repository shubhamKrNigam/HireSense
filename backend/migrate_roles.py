import sqlite3

from app.core.config import DATABASE_URL


def get_database_path():
    if not DATABASE_URL.startswith("sqlite:///"):
        raise RuntimeError(
            "This migration script expects a SQLite DATABASE_URL."
        )

    return DATABASE_URL.replace("sqlite:///", "", 1)


def migrate_roles():
    database_path = get_database_path()

    connection = sqlite3.connect(database_path)
    cursor = connection.cursor()

    try:
        # Check the existing users table schema.
        cursor.execute(
            """
            SELECT sql
            FROM sqlite_master
            WHERE type = 'table'
              AND name = 'users'
            """
        )

        result = cursor.fetchone()

        if not result:
            raise RuntimeError(
                "The users table does not exist."
            )

        current_schema = result[0]

        if "placement_officer" in current_schema:
            print(
                "users.role already supports placement_officer."
            )
            return

        print("Migrating users.role constraint...")

        connection.execute("PRAGMA foreign_keys=OFF")

        connection.execute(
            """
            CREATE TABLE users_new (
                id INTEGER NOT NULL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL
                    CHECK (
                        role IN (
                            'candidate',
                            'recruiter',
                            'placement_officer',
                            'admin'
                        )
                    ),
                created_at DATETIME
                    DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME
                    DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.execute(
            """
            INSERT INTO users_new (
                id,
                name,
                email,
                password_hash,
                role,
                created_at,
                updated_at
            )
            SELECT
                id,
                name,
                email,
                password_hash,
                role,
                created_at,
                updated_at
            FROM users
            """
        )

        connection.execute(
            "DROP TABLE users"
        )

        connection.execute(
            """
            ALTER TABLE users_new
            RENAME TO users
            """
        )

        connection.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS
            ix_users_email
            ON users (email)
            """
        )

        connection.commit()

        print(
            "users.role migration completed successfully."
        )

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.execute("PRAGMA foreign_keys=ON")
        connection.close()


if __name__ == "__main__":
    migrate_roles()