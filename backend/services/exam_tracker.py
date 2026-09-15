import sqlite3
from datetime import datetime
from backend.config import settings

def get_all_exams(conn: sqlite3.Connection, user_id: int = 1):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM exams WHERE user_id = ? ORDER BY exam_date ASC", (user_id,))
    rows = cursor.fetchall()
    
    exams = []
    now = datetime.now()
    
    for row in rows:
        item = dict(row)
        try:
            exam_dt = datetime.fromisoformat(item['exam_date'])
            diff = exam_dt - now
            if diff.total_seconds() > 0:
                days = diff.days
                hours = int(diff.seconds // 3600)
                mins = int((diff.seconds % 3600) // 60)
                item['countdown_str'] = f"{days}d {hours}h {mins}m"
                item['days_left'] = days
                item['is_past'] = False
            else:
                item['countdown_str'] = "Exam Completed"
                item['days_left'] = -1
                item['is_past'] = True
        except Exception:
            item['countdown_str'] = item['exam_date']
            item['days_left'] = 99
            item['is_past'] = False

        days = max(1, item['days_left']) if not item['is_past'] else 100
        urgency = (item['weightage'] * 2) + (item['difficulty'] * 5) - (days * 2)
        if urgency > 50:
            item['priority_level'] = "HIGH"
            item['badge_color'] = "bg-red-500"
        elif urgency > 20:
            item['priority_level'] = "MEDIUM"
            item['badge_color'] = "bg-amber-500"
        else:
            item['priority_level'] = "LOW"
            item['badge_color'] = "bg-emerald-500"

        exams.append(item)
    
    return exams

def create_exam(conn: sqlite3.Connection, data: dict, user_id: int = 1):
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO exams (user_id, subject_name, course_code, exam_date, location, difficulty, weightage, topics, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        data.get('subject_name'),
        data.get('course_code', ''),
        data.get('exam_date'),
        data.get('location', 'Main Hall'),
        data.get('difficulty', 3),
        data.get('weightage', 20),
        data.get('topics', ''),
        data.get('notes', '')
    ))
    conn.commit()
    return cursor.lastrowid

def delete_exam(conn: sqlite3.Connection, exam_id: int, user_id: int = 1):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM exams WHERE id = ? AND user_id = ?", (exam_id, user_id))
    conn.commit()
    return True
