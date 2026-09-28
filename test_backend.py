import sys
import os

project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

sys.stdout.reconfigure(encoding='utf-8')

from backend.database import init_db
from fastapi.testclient import TestClient
from backend.main import app

def run_tests():
    init_db()
    client = TestClient(app)
    
    print("1. Health Check...")
    res = client.get("/api/health")
    assert res.status_code == 200

    print("2. Student Registration & Login...")
    res = client.post("/api/auth/signup", json={
        "roll_no": "21CS088",
        "full_name": "Sarah Connor",
        "password": "mypassword123"
    })
    res_login = client.post("/api/auth/login", json={
        "roll_no": "21CS088",
        "password": "mypassword123"
    })
    assert res_login.status_code == 200
    user = res_login.json()["user"]
    user_id = user["id"]
    print(f"   Logged in as {user['full_name']} (User ID: {user_id})")

    print("3. Exam Schedule Tracker...")
    res = client.post("/api/exams", json={
        "subject_name": "Data Structures & Algorithms",
        "course_code": "CS201",
        "exam_date": "2026-11-20T10:00",
        "difficulty": 5,
        "weightage": 40,
        "topics": "Trees, Graphs, Dynamic Programming",
        "user_id": user_id
    })
    assert res.status_code == 200
    exam_id = res.json()["id"]

    res_list = client.get(f"/api/exams?user_id={user_id}")
    assert res_list.status_code == 200
    exams = res_list.json()
    assert len(exams) >= 1
    print(f"   User {user_id} Exam count: {len(exams)} (Subject: {exams[0]['subject_name']})")

    print("4. Automated Schedule Maker...")
    res_sched = client.post("/api/schedule/generate", json={
        "target_hours": 6.0,
        "days_ahead": 7,
        "user_id": user_id
    })
    assert res_sched.status_code == 200
    sessions = res_sched.json()["sessions"]
    assert len(sessions) > 0
    print(f"   Generated {len(sessions)} study sessions for User {user_id}.")

    print("5. AI Analyzer File Upload & Q&A...")
    sample_file_path = os.path.join(project_root, "test_notes.txt")
    with open(sample_file_path, "w", encoding="utf-8") as f:
        f.write("Operating Systems Lecture 1: Processes vs Threads. A process is an executing program instance with its own virtual memory address space. Threads share memory within the same process.")

    with open(sample_file_path, "rb") as f:
        res_upload = client.post("/api/analyzer/upload", data={"user_id": str(user_id)}, files={"file": ("test_notes.txt", f, "text/plain")})

    assert res_upload.status_code == 200
    upload_data = res_upload.json()
    assert "analysis" in upload_data
    print("   Upload & Analysis OK! Summary snippet:", upload_data["analysis"]["summary"][:80])

    print("6. Problem Solver...")
    res_solve = client.post("/api/solver/solve", json={
        "problem_query": "def is_even(n):\n    return n % 2 == 0\nprint(is_even(10))",
        "subject_category": "Computer Science & Data"
    })
    assert res_solve.status_code == 200
    print("   Problem Solver result:", res_solve.json()["final_answer"][:60])

    print("7. Direction Bot...")
    res_bot = client.post("/api/directions/chat", json={
        "query": "How do I generate my study schedule?"
    })
    assert res_bot.status_code == 200
    print("   Direction Bot guidance OK!")

    print("8. AI Autonomous Agents Hub...")
    res_agent = client.post("/api/agents/run", json={
        "agent_type": "scholar",
        "user_prompt": "Explain Transformer Self-Attention mechanism"
    })
    assert res_agent.status_code == 200
    assert "output" in res_agent.json()
    print("   ScholarAgent execution OK!")

    print("\nALL PLATFORM FEATURES VERIFIED & WORKING PERFECTLY! 🚀✅")

if __name__ == "__main__":
    run_tests()
