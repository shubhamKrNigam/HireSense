import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "hiresense.db"


def get_id(connection, table, column, value):
    row = connection.execute(
        f"SELECT id FROM {table} WHERE {column} = ?",
        (value,)
    ).fetchone()

    if row is None:
        raise ValueError(
            f"Could not find {value!r} in {table}.{column}"
        )

    return row[0]


def seed_database():
    connection = sqlite3.connect(DATABASE_PATH)

    try:
        connection.execute("PRAGMA foreign_keys = ON")

        # =====================================================
        # SKILLS
        # =====================================================

        skills = [
            ("Python", "Programming"),
            ("SQL", "Database"),
            ("Pandas", "Data Analytics"),
            ("NumPy", "Data Analytics"),
            ("Power BI", "Visualization"),
            ("Tableau", "Visualization"),
            ("Excel", "Data Analytics"),
            ("Statistics", "Data Science"),
            ("Machine Learning", "Data Science"),
            ("Scikit-learn", "Machine Learning"),
            ("TensorFlow", "Machine Learning"),
            ("NLP", "Artificial Intelligence"),
            ("Git", "Developer Tools"),
            ("Docker", "DevOps"),
            ("AWS", "Cloud"),
            ("FastAPI", "Backend"),
            ("Java", "Programming"),
            ("JavaScript", "Programming"),
            ("React", "Frontend"),
            ("PostgreSQL", "Database"),
        ]

        for name, category in skills:
            connection.execute(
                """
                INSERT OR IGNORE INTO skills (name, category)
                VALUES (?, ?)
                """,
                (name, category)
            )

        # =====================================================
        # COMPANIES
        # =====================================================

        companies = [
            (
                "DataVista Analytics",
                "Analytics",
                "Bengaluru, India",
                "https://example.com/datavista"
            ),
            (
                "TechNova Solutions",
                "Information Technology",
                "Hyderabad, India",
                "https://example.com/technova"
            ),
            (
                "FinEdge Technologies",
                "FinTech",
                "Mumbai, India",
                "https://example.com/finedge"
            ),
            (
                "CloudMatrix Systems",
                "Cloud Technology",
                "Pune, India",
                "https://example.com/cloudmatrix"
            ),
            (
                "InsightWorks",
                "Data Science",
                "Gurugram, India",
                "https://example.com/insightworks"
            ),
            (
                "NextGen Software",
                "Software Development",
                "Noida, India",
                "https://example.com/nextgen"
            ),
        ]

        for company in companies:
            connection.execute(
                """
                INSERT OR IGNORE INTO companies
                (name, industry, location, website)
                VALUES (?, ?, ?, ?)
                """,
                company
            )

        # =====================================================
        # USERS + CANDIDATES
        # =====================================================

        candidates = [
            (
                "Aarav Sharma",
                "aarav@example.com",
                "Delhi",
                "Python, SQL, Pandas, Power BI"
            ),
            (
                "Ananya Verma",
                "ananya@example.com",
                "Noida",
                "Python, SQL, Statistics, Machine Learning"
            ),
            (
                "Rohan Mehta",
                "rohan@example.com",
                "Pune",
                "Java, SQL, Git, Docker"
            ),
            (
                "Priya Singh",
                "priya@example.com",
                "Lucknow",
                "Python, Pandas, NumPy, Tableau"
            ),
            (
                "Karan Gupta",
                "karan@example.com",
                "Gurugram",
                "Python, Machine Learning, Scikit-learn, NLP"
            ),
            (
                "Sneha Kapoor",
                "sneha@example.com",
                "Bengaluru",
                "SQL, Excel, Power BI, Tableau"
            ),
            (
                "Aditya Joshi",
                "aditya@example.com",
                "Jaipur",
                "Python, FastAPI, Git, PostgreSQL"
            ),
            (
                "Neha Agarwal",
                "neha@example.com",
                "Mumbai",
                "Python, SQL, Statistics, Power BI"
            ),
            (
                "Vivek Malhotra",
                "vivek@example.com",
                "Chandigarh",
                "Java, JavaScript, React, Git"
            ),
            (
                "Ishita Rao",
                "ishita@example.com",
                "Hyderabad",
                "Python, TensorFlow, NLP, Machine Learning"
            ),
        ]

        for name, email, location, _ in candidates:
            connection.execute(
                """
                INSERT OR IGNORE INTO users
                (name, email, password_hash, role)
                VALUES (?, ?, ?, 'candidate')
                """,
                (
                    name,
                    email,
                    "development-only-password-hash"
                )
            )

            user_id = get_id(
                connection,
                "users",
                "email",
                email
            )

            connection.execute(
                """
                INSERT OR IGNORE INTO candidates
                (user_id, location, resume_text)
                VALUES (?, ?, ?)
                """,
                (
                    user_id,
                    location,
                    f"Candidate profile for {name}. Skills: "
                    f"{_}"
                )
            )

        # =====================================================
        # EDUCATION
        # =====================================================

        education_data = [
            ("aarav@example.com", "B.Tech", "Computer Science", 2023, 2027, 8.4),
            ("ananya@example.com", "B.Tech", "Computer Science", 2022, 2026, 8.8),
            ("rohan@example.com", "B.Tech", "Information Technology", 2023, 2027, 7.9),
            ("priya@example.com", "B.Tech", "Computer Science", 2023, 2027, 8.2),
            ("karan@example.com", "B.Tech", "Artificial Intelligence", 2022, 2026, 9.0),
            ("sneha@example.com", "B.Com", "Business Analytics", 2022, 2025, 8.5),
            ("aditya@example.com", "B.Tech", "Computer Science", 2023, 2027, 8.1),
            ("neha@example.com", "B.Tech", "Data Science", 2023, 2027, 8.7),
            ("vivek@example.com", "B.Tech", "Information Technology", 2022, 2026, 8.0),
            ("ishita@example.com", "B.Tech", "Artificial Intelligence", 2023, 2027, 8.9),
        ]

        for email, degree, field, start, end, gpa in education_data:
            candidate_id = get_id(
                connection,
                "candidates",
                "user_id",
                get_id(connection, "users", "email", email)
            )

            connection.execute(
                """
                INSERT INTO educations
                (candidate_id, institution, degree, field_of_study,
                 start_year, end_year, gpa)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    candidate_id,
                    "Sample University",
                    degree,
                    field,
                    start,
                    end,
                    gpa
                )
            )

        # =====================================================
        # PROJECTS
        # =====================================================

        projects = [
            ("aarav@example.com", "Sales Dashboard",
             "Built a sales analytics dashboard using Python, SQL and Power BI."),
            ("ananya@example.com", "Customer Churn Prediction",
             "Built a machine learning model using Python, Pandas and Scikit-learn."),
            ("rohan@example.com", "Inventory Management API",
             "Developed a backend application using Java, SQL and Git."),
            ("priya@example.com", "Business Analytics Dashboard",
             "Created analytics reports using Pandas, NumPy and Tableau."),
            ("karan@example.com", "Resume Classification",
             "Built an NLP classification system using Python and Scikit-learn."),
            ("sneha@example.com", "Retail Analytics",
             "Analyzed retail transactions using SQL, Excel and Power BI."),
            ("aditya@example.com", "HireSense API",
             "Developed a FastAPI backend with PostgreSQL and Git."),
            ("neha@example.com", "Marketing Analytics",
             "Performed statistical analysis using Python, SQL and Power BI."),
            ("vivek@example.com", "Web Application",
             "Built a web application using JavaScript, React and Git."),
            ("ishita@example.com", "NLP Sentiment Analysis",
             "Built an NLP model using Python, TensorFlow and machine learning."),
        ]

        for email, title, description in projects:
            candidate_id = get_id(
                connection,
                "candidates",
                "user_id",
                get_id(connection, "users", "email", email)
            )

            connection.execute(
                """
                INSERT INTO projects
                (candidate_id, title, description)
                VALUES (?, ?, ?)
                """,
                (candidate_id, title, description)
            )

        # =====================================================
        # CANDIDATE SKILLS
        # =====================================================

        candidate_skill_data = {
            "aarav@example.com": [
                ("Python", 4, 2),
                ("SQL", 4, 2),
                ("Pandas", 4, 2),
                ("Power BI", 3, 1),
                ("Excel", 4, 2),
            ],
            "ananya@example.com": [
                ("Python", 4, 2),
                ("SQL", 4, 2),
                ("Statistics", 4, 2),
                ("Machine Learning", 4, 2),
                ("Scikit-learn", 4, 1),
            ],
            "rohan@example.com": [
                ("Java", 4, 2),
                ("SQL", 3, 1),
                ("Git", 4, 2),
                ("Docker", 3, 1),
            ],
            "priya@example.com": [
                ("Python", 4, 2),
                ("Pandas", 4, 2),
                ("NumPy", 4, 2),
                ("Tableau", 3, 1),
            ],
            "karan@example.com": [
                ("Python", 5, 3),
                ("Machine Learning", 5, 2),
                ("Scikit-learn", 5, 2),
                ("NLP", 4, 1),
            ],
            "sneha@example.com": [
                ("SQL", 4, 2),
                ("Excel", 5, 3),
                ("Power BI", 4, 2),
                ("Tableau", 3, 1),
            ],
            "aditya@example.com": [
                ("Python", 4, 2),
                ("FastAPI", 4, 1),
                ("Git", 4, 2),
                ("PostgreSQL", 3, 1),
            ],
            "neha@example.com": [
                ("Python", 4, 2),
                ("SQL", 4, 2),
                ("Statistics", 4, 2),
                ("Power BI", 4, 2),
            ],
            "vivek@example.com": [
                ("Java", 4, 2),
                ("JavaScript", 4, 2),
                ("React", 4, 2),
                ("Git", 4, 2),
            ],
            "ishita@example.com": [
                ("Python", 5, 2),
                ("TensorFlow", 4, 1),
                ("NLP", 5, 2),
                ("Machine Learning", 5, 2),
            ],
        }

        for email, skill_list in candidate_skill_data.items():
            candidate_id = get_id(
                connection,
                "candidates",
                "user_id",
                get_id(connection, "users", "email", email)
            )

            for skill_name, proficiency, years in skill_list:
                skill_id = get_id(
                    connection,
                    "skills",
                    "name",
                    skill_name
                )

                connection.execute(
                    """
                    INSERT OR IGNORE INTO candidate_skills
                    (candidate_id, skill_id, proficiency, years_used, source)
                    VALUES (?, ?, ?, ?, 'seed')
                    """,
                    (
                        candidate_id,
                        skill_id,
                        proficiency,
                        years
                    )
                )

        # =====================================================
        # JOBS
        # =====================================================

        jobs = [
            (
                "DataVista Analytics",
                "Data Analyst",
                "Analyze business data using SQL, Python, Pandas and Power BI.",
                "Bengaluru, India",
                "Full-time",
                0,
                2,
                500000,
                900000
            ),
            (
                "DataVista Analytics",
                "Junior Data Scientist",
                "Build machine learning models using Python, Statistics and Scikit-learn.",
                "Bengaluru, India",
                "Full-time",
                0,
                2,
                600000,
                1100000
            ),
            (
                "TechNova Solutions",
                "Software Engineer",
                "Develop backend systems using Java, SQL, Git and Docker.",
                "Hyderabad, India",
                "Full-time",
                0,
                2,
                500000,
                1000000
            ),
            (
                "FinEdge Technologies",
                "Business Data Analyst",
                "Work with SQL, Excel, Power BI and statistical analysis.",
                "Mumbai, India",
                "Full-time",
                0,
                2,
                550000,
                950000
            ),
            (
                "CloudMatrix Systems",
                "Backend Developer",
                "Build APIs using Python, FastAPI, PostgreSQL and Git.",
                "Pune, India",
                "Full-time",
                0,
                2,
                550000,
                1000000
            ),
            (
                "InsightWorks",
                "Machine Learning Engineer",
                "Develop machine learning and NLP solutions using Python.",
                "Gurugram, India",
                "Full-time",
                1,
                3,
                700000,
                1400000
            ),
            (
                "NextGen Software",
                "Frontend Developer",
                "Develop web applications using JavaScript, React and Git.",
                "Noida, India",
                "Full-time",
                0,
                2,
                450000,
                900000
            ),
            (
                "InsightWorks",
                "NLP Data Scientist",
                "Build NLP and deep learning models using Python and TensorFlow.",
                "Gurugram, India",
                "Full-time",
                0,
                2,
                650000,
                1300000
            ),
        ]

        for (
            company_name,
            title,
            description,
            location,
            employment_type,
            exp_min,
            exp_max,
            salary_min,
            salary_max
        ) in jobs:

            company_id = get_id(
                connection,
                "companies",
                "name",
                company_name
            )

            existing = connection.execute(
                """
                SELECT id FROM jobs
                WHERE company_id = ? AND title = ?
                """,
                (company_id, title)
            ).fetchone()

            if existing is None:
                connection.execute(
                    """
                    INSERT INTO jobs
                    (
                        company_id,
                        title,
                        description,
                        location,
                        employment_type,
                        experience_min,
                        experience_max,
                        salary_min,
                        salary_max,
                        posted_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """,
                    (
                        company_id,
                        title,
                        description,
                        location,
                        employment_type,
                        exp_min,
                        exp_max,
                        salary_min,
                        salary_max
                    )
                )

        # =====================================================
        # JOB SKILLS
        # =====================================================

        job_skill_data = {
            "Data Analyst": [
                ("SQL", 5, 1),
                ("Python", 5, 1),
                ("Pandas", 4, 1),
                ("Power BI", 5, 1),
                ("Excel", 4, 0),
                ("Statistics", 3, 0),
            ],
            "Junior Data Scientist": [
                ("Python", 5, 1),
                ("Statistics", 5, 1),
                ("Machine Learning", 5, 1),
                ("Scikit-learn", 4, 1),
                ("Pandas", 4, 1),
                ("SQL", 3, 0),
            ],
            "Software Engineer": [
                ("Java", 5, 1),
                ("SQL", 3, 1),
                ("Git", 4, 1),
                ("Docker", 3, 0),
            ],
            "Business Data Analyst": [
                ("SQL", 5, 1),
                ("Excel", 5, 1),
                ("Power BI", 5, 1),
                ("Statistics", 4, 0),
                ("Tableau", 3, 0),
            ],
            "Backend Developer": [
                ("Python", 5, 1),
                ("FastAPI", 5, 1),
                ("PostgreSQL", 4, 1),
                ("Git", 4, 1),
                ("Docker", 3, 0),
            ],
            "Machine Learning Engineer": [
                ("Python", 5, 1),
                ("Machine Learning", 5, 1),
                ("Scikit-learn", 5, 1),
                ("NLP", 4, 0),
                ("Docker", 3, 0),
            ],
            "Frontend Developer": [
                ("JavaScript", 5, 1),
                ("React", 5, 1),
                ("Git", 4, 1),
            ],
            "NLP Data Scientist": [
                ("Python", 5, 1),
                ("NLP", 5, 1),
                ("TensorFlow", 4, 1),
                ("Machine Learning", 5, 1),
            ],
        }

        for job_title, skill_list in job_skill_data.items():

            job_id = connection.execute(
                """
                SELECT id FROM jobs
                WHERE title = ?
                """,
                (job_title,)
            ).fetchone()[0]

            for skill_name, importance, required in skill_list:

                skill_id = get_id(
                    connection,
                    "skills",
                    "name",
                    skill_name
                )

                connection.execute(
                    """
                    INSERT OR IGNORE INTO job_skills
                    (job_id, skill_id, importance, required)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        job_id,
                        skill_id,
                        importance,
                        required
                    )
                )

        connection.commit()

        # =====================================================
        # SUMMARY
        # =====================================================

        print()
        print("HireSense seed data inserted successfully.")
        print()

        tables = [
            "users",
            "candidates",
            "companies",
            "jobs",
            "skills",
            "candidate_skills",
            "job_skills",
            "educations",
            "projects",
        ]

        for table in tables:
            count = connection.execute(
                f"SELECT COUNT(*) FROM {table}"
            ).fetchone()[0]

            print(f"{table:20} {count}")

    finally:
        connection.close()


if __name__ == "__main__":
    seed_database()