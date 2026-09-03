PRAGMA foreign_keys = ON;

-- ============================================================
-- HireSense Database Schema
-- Version: 1.0
-- ============================================================


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL
        CHECK (role IN ('candidate', 'recruiter', 'admin')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- CANDIDATES
-- ============================================================

CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL UNIQUE,

    phone TEXT,

    location TEXT,

    linkedin_url TEXT,

    github_url TEXT,

    portfolio_url TEXT,

    resume_path TEXT,

    resume_text TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- COMPANIES
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL UNIQUE,

    industry TEXT,

    location TEXT,

    website TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- JOBS
-- ============================================================

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    company_id INTEGER NOT NULL,

    title TEXT NOT NULL,

    description TEXT NOT NULL,

    location TEXT,

    employment_type TEXT,

    experience_min REAL DEFAULT 0,

    experience_max REAL,

    salary_min REAL,

    salary_max REAL,

    posted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
);


-- ============================================================
-- SKILLS
-- ============================================================

CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL UNIQUE,

    category TEXT
);


-- ============================================================
-- CANDIDATE SKILLS
-- ============================================================

CREATE TABLE IF NOT EXISTS candidate_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    candidate_id INTEGER NOT NULL,

    skill_id INTEGER NOT NULL,

    proficiency REAL,

    years_used REAL,

    source TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE,

    UNIQUE(candidate_id, skill_id)
);


-- ============================================================
-- JOB SKILLS
-- ============================================================

CREATE TABLE IF NOT EXISTS job_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    job_id INTEGER NOT NULL,

    skill_id INTEGER NOT NULL,

    importance REAL DEFAULT 1.0,

    required INTEGER DEFAULT 0
        CHECK (required IN (0, 1)),

    FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE,

    UNIQUE(job_id, skill_id)
);


-- ============================================================
-- EDUCATION
-- ============================================================

CREATE TABLE IF NOT EXISTS educations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    candidate_id INTEGER NOT NULL,

    institution TEXT NOT NULL,

    degree TEXT,

    field_of_study TEXT,

    start_year INTEGER,

    end_year INTEGER,

    gpa REAL,

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE
);


-- ============================================================
-- EXPERIENCE
-- ============================================================

CREATE TABLE IF NOT EXISTS experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    candidate_id INTEGER NOT NULL,

    company_name TEXT NOT NULL,

    job_title TEXT,

    description TEXT,

    start_date DATE,

    end_date DATE,

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE
);


-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    candidate_id INTEGER NOT NULL,

    title TEXT NOT NULL,

    description TEXT,

    github_url TEXT,

    start_date DATE,

    end_date DATE,

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE
);


-- ============================================================
-- APPLICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    candidate_id INTEGER NOT NULL,

    job_id INTEGER NOT NULL,

    status TEXT NOT NULL DEFAULT 'applied'
        CHECK (
            status IN (
                'applied',
                'shortlisted',
                'interview',
                'rejected',
                'selected'
            )
        ),

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE,

    FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    UNIQUE(candidate_id, job_id)
);


-- ============================================================
-- MATCH RESULTS
-- ============================================================

CREATE TABLE IF NOT EXISTS match_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    candidate_id INTEGER NOT NULL,

    job_id INTEGER NOT NULL,

    overall_score REAL NOT NULL,

    skill_score REAL,

    text_similarity_score REAL,

    experience_score REAL,

    education_score REAL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    model_version TEXT,

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE,

    FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_candidates_user
ON candidates(user_id);


CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate
ON candidate_skills(candidate_id);


CREATE INDEX IF NOT EXISTS idx_candidate_skills_skill
ON candidate_skills(skill_id);


CREATE INDEX IF NOT EXISTS idx_job_skills_job
ON job_skills(job_id);


CREATE INDEX IF NOT EXISTS idx_job_skills_skill
ON job_skills(skill_id);


CREATE INDEX IF NOT EXISTS idx_jobs_company
ON jobs(company_id);


CREATE INDEX IF NOT EXISTS idx_applications_candidate
ON applications(candidate_id);


CREATE INDEX IF NOT EXISTS idx_applications_job
ON applications(job_id);


CREATE INDEX IF NOT EXISTS idx_match_candidate
ON match_results(candidate_id);


CREATE INDEX IF NOT EXISTS idx_match_job
ON match_results(job_id);