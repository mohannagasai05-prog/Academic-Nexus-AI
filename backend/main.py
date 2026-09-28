import os
import sqlite3
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Query, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from backend.config import settings
from backend.database import get_db, init_db
from backend.services.auth import create_user, authenticate_user
from backend.services.ai_analyzer import extract_text_from_file, analyze_document_content, answer_document_question
from backend.services.problem_solver import solve_problem
from backend.services.direction_bot import get_direction_guidance
from backend.services.exam_tracker import get_all_exams, create_exam, delete_exam
from backend.services.schedule_maker import generate_study_schedule, get_saved_schedule, toggle_session_completed, generate_ics_calendar
from backend.services.agents import run_agent_task
from backend.services.leetcode import get_leetcode_problems, run_leetcode_code, get_leetcode_hint

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/", response_class=HTMLResponse)
def serve_dashboard():
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Academic Nexus AI Backend Active</h1>")

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "has_gemini_key": bool(settings.GEMINI_API_KEY)
    }

# --- Auth Endpoints ---
class SignupPayload(BaseModel):
    roll_no: str
    full_name: str
    password: str

class LoginPayload(BaseModel):
    roll_no: str
    password: str

@app.post("/api/auth/signup")
def api_signup(payload: SignupPayload, db: sqlite3.Connection = Depends(get_db)):
    try:
        user = create_user(db, payload.roll_no, payload.full_name, payload.password)
        return {"message": "Registration successful!", "user": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
def api_login(payload: LoginPayload, db: sqlite3.Connection = Depends(get_db)):
    try:
        user = authenticate_user(db, payload.roll_no, payload.password)
        return {"message": "Login successful!", "user": user}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

# --- Settings & Keys ---
class SettingsPayload(BaseModel):
    gemini_api_key: str = ""

@app.post("/api/settings")
def update_settings(payload: SettingsPayload, db: sqlite3.Connection = Depends(get_db)):
    settings.GEMINI_API_KEY = payload.gemini_api_key.strip()
    cursor = db.cursor()
    cursor.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('GEMINI_API_KEY', ?)", (settings.GEMINI_API_KEY,))
    db.commit()
    return {"message": "Settings saved successfully", "has_key": bool(settings.GEMINI_API_KEY)}

# --- Exam Tracker Endpoints ---
class ExamPayload(BaseModel):
    subject_name: str
    course_code: str = ""
    exam_date: str
    location: str = "Main Hall"
    difficulty: int = 3
    weightage: int = 20
    topics: str = ""
    notes: str = ""
    user_id: Optional[int] = 1

@app.get("/api/exams")
def api_get_exams(user_id: int = Query(1), db: sqlite3.Connection = Depends(get_db)):
    return get_all_exams(db, user_id=user_id)

@app.post("/api/exams")
def api_create_exam(payload: ExamPayload, db: sqlite3.Connection = Depends(get_db)):
    exam_id = create_exam(db, payload.dict(), user_id=payload.user_id or 1)
    return {"message": "Exam created", "id": exam_id}

@app.delete("/api/exams/{exam_id}")
def api_delete_exam(exam_id: int, user_id: int = Query(1), db: sqlite3.Connection = Depends(get_db)):
    delete_exam(db, exam_id, user_id=user_id)
    return {"message": "Exam deleted"}

# --- Schedule Maker Endpoints ---
class ScheduleGenPayload(BaseModel):
    target_hours: float = 4.0
    days_ahead: int = 7
    user_id: Optional[int] = 1

@app.get("/api/schedule")
def api_get_schedule(user_id: int = Query(1), db: sqlite3.Connection = Depends(get_db)):
    return get_saved_schedule(db, user_id=user_id)

@app.post("/api/schedule/generate")
def api_generate_schedule(payload: ScheduleGenPayload, db: sqlite3.Connection = Depends(get_db)):
    sessions = generate_study_schedule(db, payload.target_hours, payload.days_ahead, user_id=payload.user_id or 1)
    return {"message": "Schedule generated", "sessions": sessions}

@app.post("/api/schedule/toggle/{session_id}")
def api_toggle_session(session_id: int, user_id: int = Query(1), db: sqlite3.Connection = Depends(get_db)):
    toggle_session_completed(db, session_id, user_id=user_id)
    return {"message": "Status updated"}

@app.get("/api/schedule/export.ics")
def api_export_ics(user_id: int = Query(1), db: sqlite3.Connection = Depends(get_db)):
    sessions = get_saved_schedule(db, user_id=user_id)
    ics_content = generate_ics_calendar(sessions)
    return Response(content=ics_content, media_type="text/calendar", headers={"Content-Disposition": "attachment; filename=study_schedule.ics"})

# --- AI Analyzer Endpoints ---
@app.post("/api/analyzer/upload")
def api_upload_analyzer(file: UploadFile = File(...), user_id: Optional[int] = Form(1), db: sqlite3.Connection = Depends(get_db)):
    target_user_id = user_id if user_id is not None else 1
    save_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(save_path, "wb") as f:
        content = file.file.read()
        f.write(content)

    text = extract_text_from_file(save_path)
    analysis = analyze_document_content(text, file.filename)

    cursor = db.cursor()
    cursor.execute("""
    INSERT INTO documents (user_id, filename, file_path, file_type, text_content, summary, key_concepts, flashcards)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        target_user_id, file.filename, save_path, file.content_type, text[:20000],
        analysis['summary'], str(analysis['key_concepts']), str(analysis['flashcards'])
    ))
    doc_id = cursor.lastrowid
    db.commit()

    return {"doc_id": doc_id, "filename": file.filename, "analysis": analysis, "extracted_text_snippet": text[:500]}

class QAQueryPayload(BaseModel):
    document_text: str = ""
    question: str

@app.post("/api/analyzer/qa")
def api_analyzer_qa(payload: QAQueryPayload):
    answer = answer_document_question(payload.document_text, payload.question)
    return {"question": payload.question, "answer": answer}

# --- Problem Solver Endpoints ---
class ProblemSolvePayload(BaseModel):
    problem_query: str
    subject_category: str = "General STEM"

@app.post("/api/solver/solve")
def api_solve_problem(payload: ProblemSolvePayload):
    solution = solve_problem(payload.problem_query, payload.subject_category)
    return solution

# --- Direction Bot Endpoints ---
class DirectionChatPayload(BaseModel):
    query: str

@app.post("/api/directions/chat")
def api_direction_chat(payload: DirectionChatPayload):
    guidance = get_direction_guidance(payload.query)
    return guidance

# --- AI Autonomous Agents Endpoints ---
class AgentTaskPayload(BaseModel):
    agent_type: str = "scholar"
    user_prompt: str
    target_depth: str = "comprehensive"

@app.post("/api/agents/run")
def api_run_agent(payload: AgentTaskPayload):
    result = run_agent_task(payload.agent_type, payload.user_prompt, payload.target_depth)
    return result

# --- LeetCode & DSA Arena Endpoints ---
class LeetCodeRunPayload(BaseModel):
    problem_id: int
    user_code: str

class LeetCodeHintPayload(BaseModel):
    problem_id: int
    user_code: str

@app.get("/api/leetcode/problems")
def api_get_leetcode_problems():
    return get_leetcode_problems()

@app.post("/api/leetcode/run")
def api_run_leetcode(payload: LeetCodeRunPayload):
    return run_leetcode_code(payload.problem_id, payload.user_code)

@app.post("/api/leetcode/hint")
def api_leetcode_hint(payload: LeetCodeHintPayload):
    return get_leetcode_hint(payload.problem_id, payload.user_code)


