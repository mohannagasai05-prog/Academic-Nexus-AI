import requests
from backend.config import settings

def get_direction_guidance(user_query: str, chat_history: list = None) -> dict:
    gemini_key = settings.GEMINI_API_KEY
    if gemini_key:
        try:
            system_instruction = """You are Academic Nexus AI Direction Bot (Nexus Guide).
Your goal is to guide students through their academic journey and platform tools.
Platform capabilities:
1. AI Analyzer: Upload PDFs/notes -> get summaries, key concepts, flashcards, Q&A.
2. Problem Solver: Step-by-step solutions for Math, Physics, CS, Logic with formulas.
3. Exam Schedule Tracker: Track exam dates, countdown timers, weightage, topics.
4. Schedule Maker: Generate study timetables, rebalance schedules, export iCal (.ics).

Provide encouraging, direct, clear, actionable advice. Format key points with markdown bullets."""
            
            prompt = f"{system_instruction}\n\nStudent Query: {user_query}"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            res = requests.post(url, json=payload, timeout=10)
            if res.status_code == 200:
                answer = res.json()['candidates'][0]['content']['parts'][0]['text']
                return {
                    "response": answer,
                    "suggested_actions": get_suggested_actions(user_query)
                }
        except Exception as e:
            print(f"Gemini Direction Bot call failed: {e}")

    # Heuristic Direction Engine
    q = user_query.lower()
    
    if any(k in q for k in ["pdf", "notes", "analyzer", "summarize", "read", "textbook"]):
        resp = "🧭 **Direction: Use AI Analyzer**\n\nTo analyze study materials:\n1. Click on **AI Analyzer** in the left sidebar.\n2. Drag & drop your PDF or lecture notes.\n3. The platform will automatically extract key concepts, summaries, and build interactive flashcards!\n4. You can also ask specific questions grounded in your document."
        action = {"label": "Go to AI Analyzer", "tab": "analyzer"}
    elif any(k in q for k in ["solve", "math", "calculus", "formula", "physics", "code", "problem"]):
        resp = "🧭 **Direction: Use Problem Solver**\n\nFor step-by-step problem resolution:\n1. Open the **Problem Solver** tab.\n2. Type or paste your equation or problem statement.\n3. Get a full Chain-of-Thought breakdown with LaTeX formulas and practice problems!"
        action = {"label": "Go to Problem Solver", "tab": "solver"}
    elif any(k in q for k in ["exam", "date", "countdown", "deadline", "tracker", "test"]):
        resp = "🧭 **Direction: Use Exam Schedule Tracker**\n\nTo keep track of test dates & weightage:\n1. Select **Exam Tracker** from the menu.\n2. Click **+ Add New Exam** and enter the date, weightage %, and syllabus topics.\n3. Watch the live countdown timers update in real time so you never miss a deadline!"
        action = {"label": "Go to Exam Tracker", "tab": "tracker"}
    elif any(k in q for k in ["schedule", "timetable", "routine", "study plan", "calendar", "time"]):
        resp = "🧭 **Direction: Use Schedule Maker**\n\nTo generate an optimized study routine:\n1. Ensure your upcoming exams are listed in the **Exam Tracker**.\n2. Click on **Schedule Maker** and select your daily study target (e.g. 4 hours/day).\n3. Click **Generate Smart Timetable**. The AI will create balanced study sessions with spaced revision slots!\n4. Export directly to Google/Apple Calendar via `.ics`."
        action = {"label": "Go to Schedule Maker", "tab": "schedule"}
    else:
        resp = f"🧭 **Nexus Guide Direction**\n\nHere is how I recommend approaching **\"{user_query}\"**:\n\n- 📚 **Study Strategy**: Start by organizing upcoming deadlines in the **Exam Tracker**.\n- 🧠 **Material Mastery**: Upload syllabus & slides to **AI Analyzer** for quick flashcards.\n- ⏰ **Execution**: Generate an optimized weekly routine using **Schedule Maker**.\n\nWhat tool would you like to explore first?"
        action = {"label": "Explore Dashboard", "tab": "dashboard"}

    return {
        "response": resp,
        "suggested_actions": [action, {"label": "Open Exam Tracker", "tab": "tracker"}]
    }

def get_suggested_actions(query: str) -> list:
    q = query.lower()
    if "pdf" in q or "summar" in q:
        return [{"label": "Open AI Analyzer", "tab": "analyzer"}]
    elif "math" in q or "solve" in q:
        return [{"label": "Open Problem Solver", "tab": "solver"}]
    elif "exam" in q:
        return [{"label": "Open Exam Tracker", "tab": "tracker"}]
    elif "schedule" in q or "plan" in q:
        return [{"label": "Open Schedule Maker", "tab": "schedule"}]
    return [
        {"label": "Add Exam", "tab": "tracker"},
        {"label": "Generate Schedule", "tab": "schedule"}
    ]
