from sqlalchemy import inspect, text

from app.db.session import engine


def migrate():
    inspector = inspect(engine)

    # -----------------------------------------------------
    # Check whether the users table exists
    # -----------------------------------------------------

    if "users" not in inspector.get_table_names():
        raise RuntimeError(
            "The users table does not exist."
        )

    # -----------------------------------------------------
    # Check whether position already exists
    # -----------------------------------------------------

    columns = inspector.get_columns("users")

    existing_columns = {
        column["name"]
        for column in columns
    }

    if "position" in existing_columns:
        print(
            "Migration not required: "
            "users.position already exists."
        )
        return

    # -----------------------------------------------------
    # Add recruiter position column
    #
    # Nullable is intentional because:
    #
    # - existing users already exist
    # - candidates do not need a position
    # - existing recruiters may not have one yet
    # -----------------------------------------------------

    with engine.begin() as connection:

        connection.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN position VARCHAR(255)
                """
            )
        )

    print(
        "Migration completed successfully."
    )

    print(
        "Added column: users.position"
    )


if __name__ == "__main__":
    migrate()