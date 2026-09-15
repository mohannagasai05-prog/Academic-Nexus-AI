import sqlite3
from datetime import datetime, timedelta
from backend.services.exam_tracker import get_all_exams

def generate_study_schedule(conn: sqlite3.Connection, target_hours_per_day: float = 4.0, days_ahead: int = 7, user_id: int = 1) -> list:
    exams = get_all_exams(conn, user_id=user_id)
    future_exams = [e for e in exams if not e['is_past']]
    
    if not future_exams:
        future_exams = [
            {"subject_name": "Mathematics & Calculus", "difficulty": 4, "weightage": 30, "days_left": 5},
            {"subject_name": "Computer Science Data Structures", "difficulty": 4, "weightage": 25, "days_left": 8},
            {"subject_name": "Physics & Thermodynamics", "difficulty": 3, "weightage": 20, "days_left": 12}
        ]

    total_score = 0
    for e in future_exams:
        days = max(1, e.get('days_left', 7))
        score = (e['difficulty'] * e['weightage']) / (days ** 0.5)
        e['alloc_score'] = score
        total_score += score

    cursor = conn.cursor()
    cursor.execute("DELETE FROM schedule_sessions WHERE user_id = ? AND is_completed = 0", (user_id,))

    today = datetime.now().date()
    sessions = []
    start_hour = 9

    for day_idx in range(days_ahead):
        current_date = today + timedelta(days=day_idx)
        date_str = current_date.isoformat()
        
        daily_minutes = int(target_hours_per_day * 60)
        current_time = datetime.combine(current_date, datetime.min.time()).replace(hour=start_hour, minute=0)
        
        for e in future_exams:
            ratio = e['alloc_score'] / total_score if total_score > 0 else (1 / len(future_exams))
            subject_mins = int(daily_minutes * ratio)
            
            block_duration = max(45, min(90, subject_mins))
            
            start_str = current_time.strftime("%H:%M")
            end_time = current_time + timedelta(minutes=block_duration)
            end_str = end_time.strftime("%H:%M")

            session_obj = {
                "user_id": user_id,
                "title": f"Study Block: {e['subject_name']}",
                "subject_name": e['subject_name'],
                "date_str": date_str,
                "start_time": start_str,
                "end_time": end_str,
                "session_type": "study",
                "notes": f"Focus on high-weightage topics ({e['weightage']}% of total grade)."
            }
            
            cursor.execute("""
            INSERT INTO schedule_sessions (user_id, title, subject_name, date_str, start_time, end_time, session_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, session_obj['title'], session_obj['subject_name'], session_obj['date_str'],
                  session_obj['start_time'], session_obj['end_time'], session_obj['session_type'], session_obj['notes']))
            
            sessions.append(session_obj)
            current_time = end_time + timedelta(minutes=15)

        rev_start = current_time.strftime("%H:%M")
        rev_end = (current_time + timedelta(minutes=30)).strftime("%H:%M")
        cursor.execute("""
        INSERT INTO schedule_sessions (user_id, title, subject_name, date_str, start_time, end_time, session_type, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, "Daily Flashcard & Spaced Revision", "All Subjects", date_str, rev_start, rev_end, "revision",
            "Review generated flashcards and summarize today's study blocks."
        ))

    conn.commit()
    return get_saved_schedule(conn, user_id=user_id)

def get_saved_schedule(conn: sqlite3.Connection, user_id: int = 1) -> list:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schedule_sessions WHERE user_id = ? ORDER BY date_str ASC, start_time ASC", (user_id,))
    return [dict(r) for r in cursor.fetchall()]

def toggle_session_completed(conn: sqlite3.Connection, session_id: int, user_id: int = 1):
    cursor = conn.cursor()
    cursor.execute("UPDATE schedule_sessions SET is_completed = CASE WHEN is_completed = 1 THEN 0 ELSE 1 END WHERE id = ? AND user_id = ?", (session_id, user_id))
    conn.commit()
    return True

def generate_ics_calendar(sessions: list) -> str:
    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Academic Nexus AI//Study Schedule Maker//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ]
    
    for s in sessions:
        try:
            date_clean = s['date_str'].replace("-", "")
            start_clean = s['start_time'].replace(":", "") + "00"
            end_clean = s['end_time'].replace(":", "") + "00"
            
            ics_lines.extend([
                "BEGIN:VEVENT",
                f"SUMMARY:{s['title']}",
                f"DESCRIPTION:{s.get('notes', 'Academic Nexus Study Session')}",
                f"DTSTART:{date_clean}T{start_clean}",
                f"DTEND:{date_clean}T{end_clean}",
                f"STATUS:{'CONFIRMED' if not s.get('is_completed') else 'COMPLETED'}",
                "END:VEVENT"
            ])
        except Exception:
            continue
            
    ics_lines.append("END:VCALENDAR")
    return "\n".join(ics_lines)
