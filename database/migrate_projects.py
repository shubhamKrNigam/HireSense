import sqlite3

DB_PATH = "database/hiresense.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

columns = {
    row[1] for row in cursor.execute("PRAGMA table_info(projects)").fetchall()
}

# Rename existing columns to match the new Project model
if "title" in columns and "project_name" not in columns:
    cursor.execute("ALTER TABLE projects RENAME COLUMN title TO project_name")
    print("Renamed: title -> project_name")

if "github_url" in columns and "project_link" not in columns:
    cursor.execute("ALTER TABLE projects RENAME COLUMN github_url TO project_link")
    print("Renamed: github_url -> project_link")

# Add new columns
if "project_type" not in columns:
    cursor.execute(
        "ALTER TABLE projects ADD COLUMN project_type VARCHAR(100)"
    )
    print("Added: project_type")

if "technologies" not in columns:
    cursor.execute(
        "ALTER TABLE projects ADD COLUMN technologies TEXT"
    )
    print("Added: technologies")

conn.commit()

print("\nProjects database migration completed successfully.")

print("\nFinal projects table:")
print(cursor.execute("PRAGMA table_info(projects)").fetchall())

conn.close()