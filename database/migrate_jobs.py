import sqlite3


DB_PATH = "database/hiresense.db"


connection = sqlite3.connect(DB_PATH)
cursor = connection.cursor()

columns = [
    row[1]
    for row in cursor.execute("PRAGMA table_info(jobs)").fetchall()
]

if "status" not in columns:
    cursor.execute(
        """
        ALTER TABLE jobs
        ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'open'
        """
    )
    print("Added: status")
else:
    print("Already exists: status")

connection.commit()
connection.close()

print("Jobs database migration completed successfully.")