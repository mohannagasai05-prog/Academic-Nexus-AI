import sqlite3
import os
from backend.config import settings

def get_db():
    conn = sqlite3.connect(settings.DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(settings.DB_FILE, check_same_thread=False)
    cursor = conn.cursor()

    # Table: Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_no TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Table: Exams
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
        subject_name TEXT NOT NULL,
        course_code TEXT,
        exam_date TEXT NOT NULL,
        location TEXT,
        difficulty INTEGER DEFAULT 3,
        weightage INTEGER DEFAULT 20,
        topics TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Table: Schedule Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS schedule_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
        title TEXT NOT NULL,
        subject_name TEXT,
        date_str TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        session_type TEXT DEFAULT 'study',
        is_completed INTEGER DEFAULT 0,
        notes TEXT
    )
    """)

    # Table: Analyzed Documents
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        text_content TEXT,
        summary TEXT,
        key_concepts TEXT,
        flashcards TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Table: App Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)

    # Safe Schema Migrations for existing databases
    for table_name in ["exams", "schedule_sessions", "documents"]:
        try:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN user_id INTEGER DEFAULT 1")
        except sqlite3.OperationalError:
            pass # Column already exists

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
