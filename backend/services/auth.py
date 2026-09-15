import hashlib
import os
import secrets
import sqlite3
from typing import Optional

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    # Generate PBKDF2 hash using SHA-256
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return key.hex(), salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(new_hash, password_hash)

def create_user(conn: sqlite3.Connection, roll_no: str, full_name: str, password: str) -> dict:
    roll_clean = roll_no.strip().upper()
    if not roll_clean:
        raise ValueError("Roll Number is required.")
    if not password or len(password) < 4:
        raise ValueError("Password must be at least 4 characters long.")

    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE roll_no = ?", (roll_clean,))
    if cursor.fetchone():
        raise ValueError(f"Roll Number '{roll_clean}' is already registered. Please login instead.")

    password_hash, salt = hash_password(password)
    stored_credential = f"{salt}${password_hash}"

    cursor.execute("""
    INSERT INTO users (roll_no, full_name, password_hash)
    VALUES (?, ?, ?)
    """, (roll_clean, full_name.strip(), stored_credential))
    conn.commit()

    user_id = cursor.lastrowid
    return {
        "id": user_id,
        "roll_no": roll_clean,
        "full_name": full_name.strip()
    }

def authenticate_user(conn: sqlite3.Connection, roll_no: str, password: str) -> dict:
    roll_clean = roll_no.strip().upper()
    cursor = conn.cursor()
    cursor.execute("SELECT id, roll_no, full_name, password_hash FROM users WHERE roll_no = ?", (roll_clean,))
    row = cursor.fetchone()

    if not row:
        raise ValueError("Invalid Roll Number or Password.")

    user_id, r_no, full_name, stored_credential = row
    try:
        salt, p_hash = stored_credential.split("$")
    except ValueError:
        raise ValueError("Invalid password hash format.")

    if not verify_password(password, p_hash, salt):
        raise ValueError("Invalid Roll Number or Password.")

    return {
        "id": user_id,
        "roll_no": r_no,
        "full_name": full_name
    }
